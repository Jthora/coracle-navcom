/**
 * PQ Key Store — persistence for user PQC keypairs.
 *
 * Stores the PqcKeyPublicationRecord (public metadata, non-secret)
 * in localStorage, and the ML-KEM secret key (private) in the
 * secure IndexedDB store when a passphrase is available, falling
 * back to localStorage for backward compatibility.
 *
 * The secure store (4.5.5) wraps secret keys with AES-GCM-256 derived
 * from the user's passphrase via PBKDF2 600k iterations.
 */

import {writable} from "svelte/store"
import {base64ToBytes} from "src/engine/pqc/crypto-provider"
import type {PqcKeyPublicationRecord} from "src/engine/pqc/key-publication"
import {storeKey, retrieveKey, hasKey, deleteKey, listKeyIds} from "src/engine/keys/secure-store"

const RECORD_PREFIX = "pqc-key-record:"
const SECRET_PREFIX = "pqc-key-secret:"

/**
 * In-memory passphrase for secure store operations.
 * Set by the UnlockScreen on app start, cleared on lock.
 */
let activePassphrase: string | null = null

/** Reactive flag: true when secure-store has keys but no passphrase is set yet. */
export const pqcUnlockNeeded = writable(false)

/** Reactive flag: true when user skipped passphrase prompt (keys not fully protected). */
export const pqcUnlockSkipped = writable(false)

/** Reactive migration progress: {current, total} or null when not migrating. */
export const pqcMigrationProgress = writable<{current: number; total: number} | null>(null)

export function setActivePassphrase(passphrase: string | null): void {
  activePassphrase = passphrase
  pqcUnlockNeeded.set(false)
  pqcUnlockSkipped.set(false)
}

/** Skip passphrase prompt temporarily — keys remain locked, banner will show. */
export function skipPqcUnlock(): void {
  pqcUnlockNeeded.set(false)
  pqcUnlockSkipped.set(true)
}

export function getActivePassphrase(): string | null {
  return activePassphrase
}

/** Check whether UnlockScreen should be shown. Call once during bootstrap. */
export async function checkPqcUnlockNeeded(): Promise<boolean> {
  if (activePassphrase) return false
  const ids = await listKeyIds()
  const needed = ids.length > 0
  pqcUnlockNeeded.set(needed)
  return needed
}

type StoredKeyPair = {
  record: PqcKeyPublicationRecord
  secretKeyB64: string
}

export async function savePqcKeyPair(
  userPubkey: string,
  record: PqcKeyPublicationRecord,
  secretKey: Uint8Array,
): Promise<void> {
  if (!activePassphrase) {
    throw new Error("Passphrase required to store PQC key material securely")
  }

  const secureId = `pqc:${userPubkey}:${record.key_id}`
  await storeKey(secureId, secretKey, activePassphrase, "pqc-secret", {
    pubkey: userPubkey,
    keyId: record.key_id,
  })

  // Save public record WITHOUT secret key material
  const entry: StoredKeyPair = {record, secretKeyB64: ""}
  localStorage.setItem(`${RECORD_PREFIX}${userPubkey}`, JSON.stringify(entry))

  // Remove any legacy localStorage secret copies
  localStorage.removeItem(`${SECRET_PREFIX}${userPubkey}:${record.key_id}`)
}

export async function loadPqcKeyPair(
  userPubkey: string,
): Promise<{record: PqcKeyPublicationRecord; secretKey: Uint8Array} | null> {
  const raw = localStorage.getItem(`${RECORD_PREFIX}${userPubkey}`)
  if (!raw) return null

  try {
    const entry: StoredKeyPair = JSON.parse(raw)

    // Try secure store first
    if (activePassphrase) {
      const secureId = `pqc:${userPubkey}:${entry.record.key_id}`
      if (await hasKey(secureId)) {
        const secretKey = await retrieveKey(secureId, activePassphrase)
        if (secretKey) {
          return {record: entry.record, secretKey}
        }
      }
    }

    // Fallback: legacy localStorage (read-only for migration)
    if (entry.secretKeyB64) {
      console.warn(
        "[PQC] Loading key from plaintext localStorage — migration to secure store recommended",
      )
      return {
        record: entry.record,
        secretKey: base64ToBytes(entry.secretKeyB64),
      }
    }

    return null
  } catch {
    return null
  }
}

export async function loadPqcSecretKey(
  userPubkey: string,
  keyId: string,
): Promise<Uint8Array | null> {
  // Try secure store first
  if (activePassphrase) {
    const secureId = `pqc:${userPubkey}:${keyId}`
    if (await hasKey(secureId)) {
      return retrieveKey(secureId, activePassphrase)
    }
  }

  // Fallback: legacy localStorage (read-only for migration)
  const raw = localStorage.getItem(`${SECRET_PREFIX}${userPubkey}:${keyId}`)
  if (!raw) return null

  console.warn(
    "[PQC] Loading secret key from plaintext localStorage — migration to secure store recommended",
  )
  try {
    return base64ToBytes(raw)
  } catch {
    return null
  }
}

export async function removePqcKeyPair(userPubkey: string): Promise<void> {
  const existing = await loadPqcKeyPair(userPubkey)
  if (existing) {
    // Remove from secure store
    const secureId = `pqc:${userPubkey}:${existing.record.key_id}`
    await deleteKey(secureId)
    // Remove legacy localStorage entry
    localStorage.removeItem(`${SECRET_PREFIX}${userPubkey}:${existing.record.key_id}`)
  }
  localStorage.removeItem(`${RECORD_PREFIX}${userPubkey}`)
}

/**
 * Detect plaintext PQC keys in localStorage and migrate them to the
 * secure IndexedDB store. Requires an active passphrase.
 *
 * Returns {migrated, failed} counts. Legacy localStorage entries are only
 * removed after successful re-wrap (preserves data on failure).
 * Uses a lock to prevent concurrent migrations.
 */
let migrationInProgress = false

export async function migrateLegacyPqcKeys(): Promise<{migrated: number; failed: number}> {
  if (migrationInProgress) {
    console.warn("[PQC] Migration already in progress — skipping concurrent call")
    return {migrated: 0, failed: 0}
  }
  if (!activePassphrase) {
    return {migrated: 0, failed: 0}
  }

  migrationInProgress = true
  let migrated = 0
  let failed = 0

  try {
    // Count total keys needing migration first
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(RECORD_PREFIX)) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const entry: StoredKeyPair = JSON.parse(raw)
        if (entry.secretKeyB64) total++
      } catch {
        /* skip malformed */
      }
    }

    pqcMigrationProgress.set({current: 0, total})

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(RECORD_PREFIX)) continue

      try {
        const raw = localStorage.getItem(key)
        if (!raw) continue

        const entry: StoredKeyPair = JSON.parse(raw)
        if (!entry.secretKeyB64) continue // already migrated

        const userPubkey = key.slice(RECORD_PREFIX.length)
        const secretKey = base64ToBytes(entry.secretKeyB64)
        const secureId = `pqc:${userPubkey}:${entry.record.key_id}`

        // Check if already in secure store
        if (await hasKey(secureId)) {
          // Remove plaintext copy
          entry.secretKeyB64 = ""
          localStorage.setItem(key, JSON.stringify(entry))
          localStorage.removeItem(`${SECRET_PREFIX}${userPubkey}:${entry.record.key_id}`)
          migrated++
          pqcMigrationProgress.set({current: migrated + failed, total})
          continue
        }

        // Store in secure store
        await storeKey(secureId, secretKey, activePassphrase, "pqc-secret", {
          pubkey: userPubkey,
          keyId: entry.record.key_id,
        })

        // Clear plaintext from localStorage record
        entry.secretKeyB64 = ""
        localStorage.setItem(key, JSON.stringify(entry))
        localStorage.removeItem(`${SECRET_PREFIX}${userPubkey}:${entry.record.key_id}`)
        migrated++
        pqcMigrationProgress.set({current: migrated + failed, total})
      } catch (error) {
        console.warn("[PQC] Failed to migrate legacy key:", error)
        failed++
        pqcMigrationProgress.set({current: migrated + failed, total})
      }
    }
  } finally {
    migrationInProgress = false
    pqcMigrationProgress.set(null)
  }

  return {migrated, failed}
}
