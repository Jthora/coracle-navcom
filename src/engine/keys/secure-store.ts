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
 * Re-wrap all keys with a new passphrase (two-phase atomic approach).
 *
 * Phase 1: Unwrap all keys with old passphrase into memory. If any fail,
 * abort without modifying the store — old passphrase remains valid.
 * Phase 2: Write all keys with new passphrase. Only after all writes
 * succeed is the operation considered complete.
 */
export async function rewrapAllKeys(
  oldPassphrase: string,
  newPassphrase: string,
): Promise<{succeeded: number; failed: number; failedIds: string[]}> {
  const ids = await listKeyIds()
  const failedIds: string[] = []

  // Phase 1 — Unwrap all keys into memory
  const unwrapped: Array<{id: string; raw: Uint8Array; record: WrappedKeyRecord}> = []

  for (const id of ids) {
    try {
      const db = await getDb()
      const record: WrappedKeyRecord | undefined = await db.get(STORE_NAME, id)
      if (!record) {
        console.warn(`[SecureStore] rewrapAllKeys: record not found for key "${id}"`)
        failedIds.push(id)
        continue
      }

      const raw = await retrieveKey(id, oldPassphrase)
      if (!raw) {
        console.warn(
          `[SecureStore] rewrapAllKeys: could not unwrap key "${id}" with old passphrase`,
        )
        failedIds.push(id)
        continue
      }

      unwrapped.push({id, raw, record})
    } catch (error) {
      console.warn(`[SecureStore] rewrapAllKeys: unexpected error unwrapping key "${id}":`, error)
      failedIds.push(id)
    }
  }

  // If any keys failed to unwrap, abort — don't partially re-wrap
  if (failedIds.length > 0) {
    // Zero unwrapped material before returning
    for (const entry of unwrapped) entry.raw.fill(0)
    return {succeeded: 0, failed: ids.length, failedIds}
  }

  // Phase 2 — Write all keys with new passphrase
  let succeeded = 0
  try {
    for (const {id, raw, record} of unwrapped) {
      await storeKey(id, raw, newPassphrase, record.keyType, record.metadata)
      succeeded++
    }
  } catch (error) {
    console.warn(
      "[SecureStore] rewrapAllKeys: write phase failed — rolling back to old passphrase:",
      error,
    )
    // Roll back: re-wrap already-succeeded keys with old passphrase
    let rolledBack = 0
    for (let i = 0; i < succeeded; i++) {
      try {
        const entry = unwrapped[i]
        await storeKey(
          entry.id,
          entry.raw,
          oldPassphrase,
          entry.record.keyType,
          entry.record.metadata,
        )
        rolledBack++
      } catch (rollbackError) {
        console.warn(
          `[SecureStore] rewrapAllKeys: rollback failed for key "${unwrapped[i].id}":`,
          rollbackError,
        )
      }
    }
    if (rolledBack === succeeded) {
      console.warn(
        "[SecureStore] rewrapAllKeys: rollback complete — old passphrase is still active",
      )
    } else {
      console.warn(
        `[SecureStore] rewrapAllKeys: partial rollback (${rolledBack}/${succeeded}) — inconsistent state`,
      )
    }
    const remainingIds = unwrapped.slice(succeeded).map(e => e.id)
    return {succeeded: 0, failed: ids.length, failedIds: remainingIds}
  } finally {
    // Zero all unwrapped material
    for (const entry of unwrapped) entry.raw.fill(0)
  }

  return {succeeded, failed: 0, failedIds: []}
}
