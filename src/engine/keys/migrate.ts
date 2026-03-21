/**
 * Key Migration — localStorage → IndexedDB secure store.
 *
 * Detects existing keys in localStorage (Nostr sessions + PQC keys),
 * wraps them with the user's passphrase, stores in IndexedDB,
 * and removes from localStorage only after confirmed write.
 */

import {storeKey, hasKey} from "./secure-store"

const SESSION_STORAGE_KEY = "sessions"
const PQC_SECRET_PREFIX = "pqc-key-secret:"

export interface MigrationResult {
  nostrKeyMigrated: boolean
  pqcKeysMigrated: number
  alreadyMigrated: boolean
}

/**
 * Check if there are any keys in localStorage that need migration.
 */
export function hasLegacyKeys(): boolean {
  // Check for Nostr session secrets
  const sessionsRaw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (sessionsRaw) {
    try {
      const sessions = JSON.parse(sessionsRaw)
      if (Array.isArray(sessions) && sessions.some((s: any) => s.secret)) {
        return true
      }
    } catch {
      // Malformed
    }
  }

  // Check for PQC secret keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(PQC_SECRET_PREFIX)) {
      return true
    }
  }

  return false
}

/**
 * Migrate all legacy localStorage keys to the secure IndexedDB store.
 * Returns migration results. Removes localStorage entries only after
 * confirming the IndexedDB write succeeded.
 */
export async function migrateLegacyKeys(passphrase: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    nostrKeyMigrated: false,
    pqcKeysMigrated: 0,
    alreadyMigrated: false,
  }

  // --- Nostr session secrets ---
  const sessionsRaw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (sessionsRaw) {
    try {
      const sessions = JSON.parse(sessionsRaw)
      if (Array.isArray(sessions)) {
        for (const session of sessions) {
          if (session.secret && session.pubkey) {
            const keyId = `nsec:${session.pubkey}`

            // Skip if already migrated
            if (await hasKey(keyId)) {
              result.alreadyMigrated = true
              continue
            }

            const secretBytes = hexToBytes(session.secret)
            await storeKey(keyId, secretBytes, passphrase, "nostr-secret", {
              pubkey: session.pubkey,
              method: session.method || "nip01",
            })

            // Remove secret from the session object in localStorage
            // (keep the session entry but strip the secret)
            session.secret = undefined
            result.nostrKeyMigrated = true
          }
        }

        // Write back sessions without secrets
        if (result.nostrKeyMigrated) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions))
        }
      }
    } catch {
      // Don't fail migration on parse errors
    }
  }

  // --- PQC secret keys ---
  const pqcKeysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(PQC_SECRET_PREFIX)) continue

    const raw = localStorage.getItem(key)
    if (!raw) continue

    // Key format: "pqc-key-secret:<pubkey>:<keyId>"
    const suffix = key.slice(PQC_SECRET_PREFIX.length)
    const secureId = `pqc:${suffix}`

    if (await hasKey(secureId)) continue

    try {
      const secretBytes = base64ToBytes(raw)
      await storeKey(secureId, secretBytes, passphrase, "pqc-secret", {
        originalKey: key,
      })
      pqcKeysToRemove.push(key)
      result.pqcKeysMigrated++
    } catch {
      // Skip malformed entries
    }
  }

  // Remove PQC secrets from localStorage only after confirmed writes
  for (const key of pqcKeysToRemove) {
    localStorage.removeItem(key)
  }

  return result
}

// --- Helpers ---

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
