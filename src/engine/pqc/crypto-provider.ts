/**
 * CryptoProvider — Real cryptographic operations for NavCom PQC.
 *
 * This module is the ONLY place where raw crypto primitives are called.
 * All other modules (dm-envelope, group-epoch-content, etc.) import from here
 * instead of base64-encoding plaintext.
 *
 * Primitives provided:
 * - AES-GCM-256 authenticated encryption (Web Crypto)
 * - HKDF-SHA256 key derivation (Web Crypto)
 * - SHA-256 digest (Web Crypto)
 * - HMAC-SHA256 (Web Crypto)
 * - ML-KEM-768 key encapsulation (@noble/post-quantum)
 * - Secure random bytes (Web Crypto)
 * - Base64 / UTF-8 encoding helpers
 */

import {ml_kem768} from "@noble/post-quantum/ml-kem"

// --- Random bytes ---

export const randomBytes = (length: number): Uint8Array => {
  const buf = new Uint8Array(length)
  globalThis.crypto.getRandomValues(buf)
  return buf
}

/** 96-bit nonce for AES-GCM */
export const randomNonce = (): Uint8Array => randomBytes(12)

// --- AES-GCM-256 AEAD ---

export const aesGcmEncrypt = async (
  plaintext: Uint8Array,
  key: CryptoKey,
  nonce: Uint8Array,
  associatedData?: Uint8Array,
): Promise<Uint8Array> => {
  const params: AesGcmParams = {name: "AES-GCM", iv: nonce}
  if (associatedData) params.additionalData = associatedData
  const ct = await globalThis.crypto.subtle.encrypt(params, key, plaintext)
  return new Uint8Array(ct)
}

export const aesGcmDecrypt = async (
  ciphertext: Uint8Array,
  key: CryptoKey,
  nonce: Uint8Array,
  associatedData?: Uint8Array,
): Promise<Uint8Array> => {
  const params: AesGcmParams = {name: "AES-GCM", iv: nonce}
  if (associatedData) params.additionalData = associatedData
  const pt = await globalThis.crypto.subtle.decrypt(params, key, ciphertext)
  return new Uint8Array(pt)
}

// --- Key Import ---

export const importAesGcmKey = async (rawKeyBytes: Uint8Array): Promise<CryptoKey> => {
  return globalThis.crypto.subtle.importKey(
    "raw",
    rawKeyBytes,
    {name: "AES-GCM", length: 256},
    false,
    ["encrypt", "decrypt"],
  )
}

// --- HKDF key derivation ---

export const hkdfDeriveKey = async (
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number = 32,
): Promise<Uint8Array> => {
  const baseKey = await globalThis.crypto.subtle.importKey("raw", ikm, "HKDF", false, [
    "deriveBits",
  ])
  const bits = await globalThis.crypto.subtle.deriveBits(
    {name: "HKDF", hash: "SHA-256", salt, info},
    baseKey,
    length * 8,
  )
  return new Uint8Array(bits)
}

// --- SHA-256 ---

export const sha256 = async (data: Uint8Array): Promise<Uint8Array> => {
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data)
  return new Uint8Array(hash)
}

// --- HMAC-SHA256 ---

export const hmacSha256 = async (key: Uint8Array, message: Uint8Array): Promise<Uint8Array> => {
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    key,
    {name: "HMAC", hash: "SHA-256"},
    false,
    ["sign"],
  )
  const sig = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, message)
  return new Uint8Array(sig)
}

// --- ML-KEM-768 ---

export type MlKemKeyPair = {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

export type MlKemEncapsulation = {
  cipherText: Uint8Array
  sharedSecret: Uint8Array
}

export const mlKemKeygen = (): MlKemKeyPair => {
  const {publicKey, secretKey} = ml_kem768.keygen()
  return {publicKey, secretKey}
}

export const mlKemEncapsulate = (publicKey: Uint8Array): MlKemEncapsulation => {
  const {cipherText, sharedSecret} = ml_kem768.encapsulate(publicKey)
  return {cipherText, sharedSecret}
}

export const mlKemDecapsulate = (cipherText: Uint8Array, secretKey: Uint8Array): Uint8Array => {
  return ml_kem768.decapsulate(cipherText, secretKey)
}

// --- Base64 encoding (for wire format, NOT for "encryption") ---

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ""
  bytes.forEach(b => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

export const base64ToBytes = (b64: string): Uint8Array => {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// --- UTF-8 encoding ---

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export const stringToBytes = (s: string): Uint8Array => textEncoder.encode(s)
export const bytesToString = (b: Uint8Array): string => textDecoder.decode(b)
