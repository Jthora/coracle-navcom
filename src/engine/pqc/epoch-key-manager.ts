/**
 * Epoch Key Manager — Generates and derives epoch-scoped symmetric keys.
 *
 * Each secure group epoch has a master key (32 random bytes).
 * From that master key, we derive purpose-specific keys via HKDF:
 *   - Content key: for AES-GCM encryption of group messages
 *   - Integrity key: for HMAC-SHA256 of epoch state
 *
 * This separation ensures that compromising one key type
 * does not compromise the other.
 */

import {randomBytes, hkdfDeriveKey, stringToBytes} from "src/engine/pqc/crypto-provider"

/** Generate a fresh 32-byte epoch master key from secure random. */
export const generateEpochKey = (): Uint8Array => randomBytes(32)

/**
 * Derive a 32-byte content encryption key for a specific group epoch.
 * Uses HKDF-SHA256 with group/epoch context binding.
 */
export const deriveEpochContentKey = async (
  masterKey: Uint8Array,
  groupId: string,
  epochId: string,
): Promise<Uint8Array> => {
  const salt = stringToBytes(`navcom:epoch-content:${groupId}`)
  const info = stringToBytes(`epoch:${epochId}:content-key`)
  return hkdfDeriveKey(masterKey, salt, info, 32)
}

/**
 * Derive a 32-byte integrity key for a specific group epoch.
 * Used for HMAC-SHA256 over epoch state.
 */
export const deriveEpochIntegrityKey = async (
  masterKey: Uint8Array,
  groupId: string,
  epochId: string,
): Promise<Uint8Array> => {
  const salt = stringToBytes(`navcom:epoch-integrity:${groupId}`)
  const info = stringToBytes(`epoch:${epochId}:integrity-key`)
  return hkdfDeriveKey(masterKey, salt, info, 32)
}
