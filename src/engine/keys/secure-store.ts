/**
 * Secure Key Store — WebCrypto AES-GCM-256 key wrapping + IndexedDB storage.
 *
 * Replaces localStorage-based key storage with:
 * 1. AES-GCM-256 wrapping of private key material
 * 2. IndexedDB persistence (not accessible via simple XSS)
 * 3. Passphrase-based wrapping key derivation (PBKDF2, 600k iterations)
 *
 * Keys are held in memory only while unlocked.
 */

import {openDB} from "idb"
import type {IDBPDatabase} from "idb"
import {generateSalt, deriveEncryptionKey} from "./passphrase"

const DB_NAME = "navcom-keystore"
const DB_VERSION = 1
const STORE_NAME = "keys"

export interface WrappedKeyRecord {
  /** Unique ID for this key (e.g. "nsec", "pqc-secret:<pubkey>") */
  id: string
  /** AES-GCM encrypted key material */
  wrapped: ArrayBuffer
  /** PBKDF2 salt */
  salt: Uint8Array
  /** AES-GCM IV */
  iv: Uint8Array
  /** Key type identifier for unwrap routing */
  keyType: "nostr-secret" | "pqc-secret"
  /** Associated metadata (non-secret) — e.g. pubkey, algorithm */
  metadata?: Record<string, string>
  /** Timestamp of storage */
  storedAt: number
}

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

/**
 * Wrap and store a raw key (as Uint8Array) with a passphrase.
 * The passphrase is never stored — only the wrapped blob, salt, and IV.
 */
export async function storeKey(
  id: string,
  rawKey: Uint8Array,
  passphrase: string,
  keyType: WrappedKeyRecord["keyType"],
  metadata?: Record<string, string>,
): Promise<void> {
  const salt = generateSalt()
  const iv = new Uint8Array(12)
  globalThis.crypto.getRandomValues(iv)

  const encKey = await deriveEncryptionKey(passphrase, salt)

  const wrapped = await globalThis.crypto.subtle.encrypt({name: "AES-GCM", iv}, encKey, rawKey)

  const record: WrappedKeyRecord = {
    id,
    wrapped,
    salt,
    iv,
    keyType,
    metadata,
    storedAt: Date.now(),
  }

  const db = await getDb()
  await db.put(STORE_NAME, record)
}

/**
 * Unwrap and retrieve a key from IndexedDB using the passphrase.
 * Returns the raw key bytes or null if not found / wrong passphrase.
 */
export async function retrieveKey(id: string, passphrase: string): Promise<Uint8Array | null> {
  const db = await getDb()
  const record: WrappedKeyRecord | undefined = await db.get(STORE_NAME, id)
  if (!record) return null

  try {
    const encKey = await deriveEncryptionKey(passphrase, record.salt)
    const raw = await globalThis.crypto.subtle.decrypt(
      {name: "AES-GCM", iv: record.iv},
      encKey,
      record.wrapped,
    )
    return new Uint8Array(raw)
  } catch {
    // Wrong passphrase → AES-GCM decryption fails
    return null
  }
}

/**
 * Check if a key exists in the secure store (without unwrapping).
 */
export async function hasKey(id: string): Promise<boolean> {
  const db = await getDb()
  const record = await db.get(STORE_NAME, id)
  return !!record
}

/**
 * Get metadata for a stored key (without unwrapping).
 */
export async function getKeyMetadata(
  id: string,
): Promise<{keyType: string; metadata?: Record<string, string>; storedAt: number} | null> {
  const db = await getDb()
  const record: WrappedKeyRecord | undefined = await db.get(STORE_NAME, id)
  if (!record) return null
  return {keyType: record.keyType, metadata: record.metadata, storedAt: record.storedAt}
}

/**
 * Delete a key from the secure store.
 */
export async function deleteKey(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, id)
}

/**
 * List all key IDs in the store.
 */
export async function listKeyIds(): Promise<string[]> {
  const db = await getDb()
  return db.getAllKeys(STORE_NAME) as Promise<string[]>
}

/**
 * Re-wrap all keys with a new passphrase.
 * Used for passphrase change. Requires the old passphrase to unwrap first.
 */
export async function rewrapAllKeys(
  oldPassphrase: string,
  newPassphrase: string,
): Promise<{succeeded: number; failed: number}> {
  const ids = await listKeyIds()
  let succeeded = 0
  let failed = 0

  for (const id of ids) {
    const db = await getDb()
    const record: WrappedKeyRecord | undefined = await db.get(STORE_NAME, id)
    if (!record) {
      failed++
      continue
    }

    const raw = await retrieveKey(id, oldPassphrase)
    if (!raw) {
      failed++
      continue
    }

    await storeKey(id, raw, newPassphrase, record.keyType, record.metadata)
    succeeded++
  }

  return {succeeded, failed}
}
