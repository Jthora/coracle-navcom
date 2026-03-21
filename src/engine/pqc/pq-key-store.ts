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

import {bytesToBase64, base64ToBytes} from "src/engine/pqc/crypto-provider"
import type {PqcKeyPublicationRecord} from "src/engine/pqc/key-publication"
import {storeKey, retrieveKey, hasKey, deleteKey} from "src/engine/keys/secure-store"

const RECORD_PREFIX = "pqc-key-record:"
const SECRET_PREFIX = "pqc-key-secret:"

/**
 * In-memory passphrase for secure store operations.
 * Set by the UnlockScreen on app start, cleared on lock.
 */
let activePassphrase: string | null = null

export function setActivePassphrase(passphrase: string | null): void {
  activePassphrase = passphrase
}

export function getActivePassphrase(): string | null {
  return activePassphrase
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
  // Always save the public record to localStorage (non-secret metadata)
  const entry: StoredKeyPair = {
    record,
    secretKeyB64: bytesToBase64(secretKey),
  }
  localStorage.setItem(`${RECORD_PREFIX}${userPubkey}`, JSON.stringify(entry))

  // Store secret key in secure store if passphrase available
  if (activePassphrase) {
    const secureId = `pqc:${userPubkey}:${record.key_id}`
    await storeKey(secureId, secretKey, activePassphrase, "pqc-secret", {
      pubkey: userPubkey,
      keyId: record.key_id,
    })
    // Remove legacy localStorage secret
    localStorage.removeItem(`${SECRET_PREFIX}${userPubkey}:${record.key_id}`)
  } else {
    // Fallback: localStorage (legacy, for when no passphrase is set yet)
    localStorage.setItem(`${SECRET_PREFIX}${userPubkey}:${record.key_id}`, bytesToBase64(secretKey))
  }
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

    // Fallback: legacy localStorage
    if (entry.secretKeyB64) {
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

  // Fallback: legacy localStorage
  const raw = localStorage.getItem(`${SECRET_PREFIX}${userPubkey}:${keyId}`)
  if (!raw) return null

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
