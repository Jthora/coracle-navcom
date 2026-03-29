/**
 * Passphrase-based key derivation for the secure key store.
 *
 * Uses PBKDF2 with 600,000 iterations (OWASP 2023 recommendation)
 * to derive an AES-GCM-256 wrapping key from a user passphrase.
 */

const PBKDF2_ITERATIONS = 600_000
const SALT_BYTES = 16

export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_BYTES)
  globalThis.crypto.getRandomValues(salt)
  return salt
}

/**
 * Derive an AES-GCM-256 CryptoKey from a passphrase and salt.
 * The resulting key is non-extractable and can only be used for wrapKey/unwrapKey.
 */
export async function deriveWrappingKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const passphraseKey = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  )

  return globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passphraseKey,
    {name: "AES-GCM", length: 256},
    false, // non-extractable
    ["wrapKey", "unwrapKey"],
  )
}

/**
 * Derive an AES-GCM-256 CryptoKey for encrypt/decrypt operations.
 * Used to wrap raw byte secrets (PQC keys) that aren't CryptoKey objects.
 */
export async function deriveEncryptionKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const passphraseKey = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  )

  return globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passphraseKey,
    {name: "AES-GCM", length: 256},
    false,
    ["encrypt", "decrypt"],
  )
}

/**
 * Validate passphrase meets minimum requirements.
 * Returns null if valid, or an error message string.
 */
export function validatePassphrase(passphrase: string): string | null {
  if (passphrase.length < 8) {
    return "Passphrase must be at least 8 characters"
  }
  return null
}

/**
 * Estimate passphrase strength (0–4 scale).
 * 0 = very weak, 4 = strong.
 */
export function passphraseStrength(passphrase: string): number {
  let score = 0
  if (passphrase.length >= 8) score++
  if (passphrase.length >= 12) score++
  if (/[a-z]/.test(passphrase) && /[A-Z]/.test(passphrase)) score++
  if (/\d/.test(passphrase) || /[^a-zA-Z0-9]/.test(passphrase)) score++
  return score
}
