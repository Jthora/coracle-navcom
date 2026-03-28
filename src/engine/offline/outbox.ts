import {openDB} from "idb"
import type {IDBPDatabase} from "idb"
import {getActivePassphrase} from "src/engine/pqc/pq-key-store"
import {deriveEncryptionKey} from "src/engine/keys/passphrase"

export interface QueuedMessage {
  id: string
  channelId: string
  content: string
  createdAt: number
  status: "queued" | "sending" | "sent" | "failed" | "quarantined"
  retryCount: number
  lastRetryAt: number | null
  /** True when content field holds encrypted (base64) ciphertext */
  encrypted?: boolean
  /** Base64-encoded AES-GCM IV (present when encrypted) */
  encryptedIv?: string
  /** Full signed event envelope for sovereign mode queue (JSON-safe) */
  signedEvent?: object
  /** Relay URLs to publish to when draining sovereign mode events */
  targetRelays?: string[]
}

const DB_NAME = "navcom-outbox"
const DB_VERSION = 1
const STORE_NAME = "messages"

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, {keyPath: "id"})
        }
      },
    })
  }
  return dbPromise
}

let nextId = 0

// ── Queue content encryption ──────────────────────────────────────────

const QUEUE_SALT = new TextEncoder().encode("navcom-outbox-queue-encryption-v1")
let cachedQueueKey: CryptoKey | null = null

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function fromBase64(str: string): Uint8Array {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function getQueueKey(): Promise<CryptoKey | null> {
  if (cachedQueueKey) return cachedQueueKey
  const passphrase = getActivePassphrase()
  if (!passphrase) return null
  cachedQueueKey = await deriveEncryptionKey(passphrase, QUEUE_SALT)
  return cachedQueueKey
}

/** Clear cached queue key (call on passphrase change or lock). */
export function clearQueueKey(): void {
  cachedQueueKey = null
}

async function encryptContent(content: string): Promise<{ciphertext: string; iv: string} | null> {
  const key = await getQueueKey()
  if (!key) return null

  const iv = new Uint8Array(12)
  globalThis.crypto.getRandomValues(iv)
  const encoded = new TextEncoder().encode(content)
  const encrypted = await globalThis.crypto.subtle.encrypt({name: "AES-GCM", iv}, key, encoded)
  return {ciphertext: toBase64(new Uint8Array(encrypted)), iv: toBase64(iv)}
}

async function decryptContent(ciphertext: string, iv: string): Promise<string | null> {
  const key = await getQueueKey()
  if (!key) return null

  try {
    const ctBytes = fromBase64(ciphertext)
    const ivBytes = fromBase64(iv)
    const decrypted = await globalThis.crypto.subtle.decrypt(
      {name: "AES-GCM", iv: ivBytes},
      key,
      ctBytes,
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    return null
  }
}

// ── Queue operations ──────────────────────────────────────────────────

export async function enqueue(channelId: string, content: string): Promise<string> {
  const db = await getDb()
  const id = `outbox-${Date.now()}-${nextId++}`

  const enc = await encryptContent(content)
  const msg: QueuedMessage = {
    id,
    channelId,
    content: enc ? enc.ciphertext : content,
    createdAt: Date.now(),
    status: "queued",
    retryCount: 0,
    lastRetryAt: null,
    encrypted: !!enc,
    encryptedIv: enc?.iv,
  }

  if (!enc) {
    console.warn("[Outbox] No passphrase available — queuing message without encryption")
  }

  try {
    await db.put(STORE_NAME, msg)
  } catch (err: unknown) {
    if (isQuotaExceeded(err)) {
      throw new Error("Storage full — cannot queue message. Free up space and try again.")
    }
    throw err
  }
  return id
}

function isQuotaExceeded(err: unknown): boolean {
  if (err instanceof DOMException) {
    // W3C spec: "QuotaExceededError" (name) / code 22
    return err.name === "QuotaExceededError" || err.code === 22
  }
  return false
}

export async function dequeue(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, id)
}

export async function getPending(): Promise<QueuedMessage[]> {
  const db = await getDb()
  const all: QueuedMessage[] = await db.getAll(STORE_NAME)
  const pending = all
    .filter(m => m.status === "queued" || m.status === "sending")
    .sort((a, b) => a.createdAt - b.createdAt)

  const decrypted: QueuedMessage[] = []
  for (const msg of pending) {
    if (msg.encrypted && msg.encryptedIv) {
      const plaintext = await decryptContent(msg.content, msg.encryptedIv)
      if (plaintext === null) {
        // Quarantine rather than discard — preserves data for later recovery
        console.warn(`[Outbox] Cannot decrypt queued message ${msg.id} — quarantining`)
        await updateStatus(msg.id, "quarantined")
        continue
      }
      decrypted.push({...msg, content: plaintext})
    } else {
      decrypted.push(msg)
    }
  }
  return decrypted
}

/** Get count of quarantined messages that need key recovery. */
export async function getQuarantinedCount(): Promise<number> {
  const db = await getDb()
  const all: QueuedMessage[] = await db.getAll(STORE_NAME)
  return all.filter(m => m.status === "quarantined").length
}

export async function updateStatus(
  id: string,
  status: QueuedMessage["status"],
  retryCount?: number,
): Promise<void> {
  const db = await getDb()
  const msg: QueuedMessage | undefined = await db.get(STORE_NAME, id)
  if (!msg) return
  msg.status = status
  if (retryCount !== undefined) {
    msg.retryCount = retryCount
    msg.lastRetryAt = Date.now()
  }
  await db.put(STORE_NAME, msg)
}

export async function getQueuedCount(): Promise<number> {
  const pending = await getPending()
  return pending.length
}

export async function clearSent(): Promise<void> {
  const db = await getDb()
  const all: QueuedMessage[] = await db.getAll(STORE_NAME)
  const tx = db.transaction(STORE_NAME, "readwrite")
  for (const msg of all) {
    if (msg.status === "sent") {
      await tx.store.delete(msg.id)
    }
  }
  await tx.done
}

/** Enqueue a pre-signed event for sovereign mode (no encryption needed — already signed). */
export async function enqueueSignedEvent(
  signedEvent: object,
  targetRelays: string[],
): Promise<string> {
  const db = await getDb()
  const id = `outbox-${Date.now()}-${nextId++}`

  const msg: QueuedMessage = {
    id,
    channelId: "",
    content: "",
    createdAt: Date.now(),
    status: "queued",
    retryCount: 0,
    lastRetryAt: null,
    signedEvent,
    targetRelays,
  }

  try {
    await db.put(STORE_NAME, msg)
  } catch (err: unknown) {
    if (isQuotaExceeded(err)) {
      throw new Error("Storage full — cannot queue event. Free up space and try again.")
    }
    throw err
  }
  return id
}
