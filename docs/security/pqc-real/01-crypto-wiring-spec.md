# PQC Crypto Wiring Specification

Status: Active
Owner: Core Team (Human-Verified)
Created: 2026-03-20
Depends On: [00-overview.md](00-overview.md)

## Purpose

This document specifies the **exact code changes** needed to replace placeholder base64 encoding with real cryptographic operations. Each section identifies the file, the placeholder code, and the real crypto code that replaces it.

---

## 1. New Module: `src/engine/pqc/crypto-provider.ts`

Create a centralized crypto provider that wraps Web Crypto API and @noble libraries. All other modules call this instead of doing their own encoding.

```typescript
/**
 * CryptoProvider — Real cryptographic operations for NavCom PQC.
 *
 * This module is the ONLY place where raw crypto primitives are called.
 * All other modules (dm-envelope, group-epoch-content, etc.) call these
 * functions instead of base64-encoding plaintext.
 */

// --- Random bytes ---

export const randomBytes = (length: number): Uint8Array => {
  const buf = new Uint8Array(length)
  globalThis.crypto.getRandomValues(buf)
  return buf
}

export const randomNonce = (): Uint8Array => randomBytes(12) // 96-bit for AES-GCM

// --- AES-GCM-256 AEAD ---

export const aesGcmEncrypt = async (
  plaintext: Uint8Array,
  key: CryptoKey,
  nonce: Uint8Array,
  associatedData?: Uint8Array,
): Promise<Uint8Array> => {
  const params: AesGcmParams = { name: 'AES-GCM', iv: nonce }
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
  const params: AesGcmParams = { name: 'AES-GCM', iv: nonce }
  if (associatedData) params.additionalData = associatedData
  const pt = await globalThis.crypto.subtle.decrypt(params, key, ciphertext)
  return new Uint8Array(pt)
}

// --- Key Import ---

export const importAesGcmKey = async (
  rawKeyBytes: Uint8Array,
): Promise<CryptoKey> => {
  return globalThis.crypto.subtle.importKey(
    'raw',
    rawKeyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// --- HKDF key derivation ---
// Uses @noble/hashes (already a transitive dependency)

export const hkdfDeriveKey = async (
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number = 32,
): Promise<Uint8Array> => {
  // Use Web Crypto HKDF
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw', ikm, 'HKDF', false, ['deriveBits']
  )
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    baseKey,
    length * 8,
  )
  return new Uint8Array(bits)
}

// --- SHA-256 (replaces hand-rolled implementation) ---

export const sha256 = async (data: Uint8Array): Promise<Uint8Array> => {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hash)
}

// --- HMAC-SHA-256 (replaces hand-rolled implementation) ---

export const hmacSha256 = async (
  key: Uint8Array,
  message: Uint8Array,
): Promise<Uint8Array> => {
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await globalThis.crypto.subtle.sign('HMAC', cryptoKey, message)
  return new Uint8Array(sig)
}

// --- Base64 encoding (for wire format, NOT for "encryption") ---

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  bytes.forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

export const base64ToBytes = (b64: string): Uint8Array => {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export const stringToBytes = (s: string): Uint8Array => textEncoder.encode(s)
export const bytesToString = (b: Uint8Array): string => textDecoder.decode(b)
```

---

## 2. Replace: `src/engine/group-epoch-content.ts` — Group Message AEAD

### Current (PLACEHOLDER — base64 encoding)

```typescript
// Line 95 — "encryption" is just base64
ct: encodeUtf8Base64(plaintext),

// Line 161 — "decryption" is just base64 decode
plaintext: decodeUtf8Base64(parsed.ct),
```

### New (REAL — AES-GCM-256 AEAD)

The function signatures change from sync to async because Web Crypto is async.

```typescript
import {
  aesGcmEncrypt, aesGcmDecrypt, importAesGcmKey,
  randomNonce, bytesToBase64, base64ToBytes,
  stringToBytes, bytesToString,
} from 'src/engine/pqc/crypto-provider'

// encodeSecureGroupEpochContent becomes ASYNC
export const encodeSecureGroupEpochContent = async ({
  groupId, epochId, plaintext, senderPubkey, recipients,
  epochKeyBytes,  // NEW: 32-byte epoch symmetric key
  createdAt = Math.floor(Date.now() / 1000),
}: {
  groupId: string
  epochId: string
  plaintext: string
  senderPubkey: string
  recipients: string[]
  epochKeyBytes: Uint8Array  // <-- NEW REQUIRED PARAMETER
  createdAt?: number
}): Promise<SecureGroupEpochContentEncodeResult> => {
  // ... existing validation unchanged ...

  const nonce = randomNonce()  // 12 random bytes (was deterministic)
  const adString = buildAssociatedData({ groupId, epochId, senderPubkey, recipients, createdAt })
  const adBytes = stringToBytes(adString)

  const key = await importAesGcmKey(epochKeyBytes)
  const plaintextBytes = stringToBytes(plaintext)
  const ciphertextBytes = await aesGcmEncrypt(plaintextBytes, key, nonce, adBytes)

  const envelope: SecureGroupEpochContentEnvelope = {
    v: GROUP_EPOCH_CONTENT_VERSION,
    mode: 'group-epoch-v1',
    alg: GROUP_EPOCH_CONTENT_ALGORITHM,  // Update to 'aes-256-gcm'
    epoch_id: epochId,
    nonce: bytesToBase64(nonce),       // Real random nonce
    ad: bytesToBase64(adBytes),        // AD is metadata, not secret
    ct: bytesToBase64(ciphertextBytes), // REAL CIPHERTEXT
    ts: createdAt,
  }

  return { ok: true, envelope, content: JSON.stringify(envelope) }
}

// decodeSecureGroupEpochContent becomes ASYNC
export const decodeSecureGroupEpochContent = async (
  content: string,
  epochKeyBytes: Uint8Array,  // <-- NEW REQUIRED PARAMETER
): Promise<SecureGroupEpochContentDecodeResult> => {
  const parsed = JSON.parse(content)
  if (!isEnvelope(parsed)) {
    return { ok: false, reason: 'GROUP_EPOCH_CONTENT_PARSE_FAILED', message: '...' }
  }

  const key = await importAesGcmKey(epochKeyBytes)
  const nonce = base64ToBytes(parsed.nonce)
  const ciphertext = base64ToBytes(parsed.ct)
  const ad = base64ToBytes(parsed.ad)

  const plaintextBytes = await aesGcmDecrypt(ciphertext, key, nonce, ad)

  return {
    ok: true,
    envelope: parsed,
    plaintext: bytesToString(plaintextBytes),
  }
}
```

**Key change**: The `epochKeyBytes` parameter is a 32-byte symmetric key shared by all current group members for the active epoch. This key is distributed via the KEM system (Phase 3).

---

## 3. Replace: `src/engine/group-epoch-decrypt.ts` — Receive Path

### Current (PLACEHOLDER)
```typescript
const decoded = decodeSecureGroupEpochContent(event.content)
// This calls decodeUtf8Base64() which is just atob()
```

### New (REAL)
```typescript
export const validateAndDecryptSecureGroupEventContent = async ({
  event,
  expectedEpochId,
  epochKeyBytes,  // <-- NEW
}: {
  event: { id: string; kind: number; content: string }
  expectedEpochId: string
  epochKeyBytes: Uint8Array
}): Promise<SecureGroupEpochDecryptResult> => {
  if (event.kind !== GROUP_KINDS.NIP_EE.GROUP_EVENT) {
    return { ok: true }
  }

  const decoded = await decodeSecureGroupEpochContent(event.content, epochKeyBytes)
  // ... rest unchanged — epoch mismatch check, etc.
}
```

---

## 4. Replace: `src/engine/group-epoch-state.ts` — SHA-256 / HMAC

### Current (HAND-ROLLED — 186 lines of custom SHA-256)
Lines 73-175: Full SHA-256 block cipher implementation
Lines 230-264: Full HMAC-SHA256 implementation

### New (Web Crypto — 2 function calls)

Delete the following from `group-epoch-state.ts`:
- `rotr()` function
- `SHA256_K` constant array
- `sha256()` function (the 100-line hand-rolled one)
- `hmacSha256()` function
- `bytesToBase64Url()` function
- `base64UrlToBytes()` function

Replace with imports from crypto-provider:

```typescript
import {
  sha256, hmacSha256, bytesToBase64, base64ToBytes, stringToBytes
} from 'src/engine/pqc/crypto-provider'
```

The `computeIntegrityMac` and `verifyIntegrityMac` functions become async:

```typescript
const computeIntegrityMac = async (
  state: ..., keyMaterial: string
): Promise<string> => {
  const payload = stringToBytes(toIntegrityPayload(state))
  const key = stringToBytes(keyMaterial)
  const mac = await hmacSha256(key, payload)
  return bytesToBase64(mac)
}
```

---

## 5. Replace: `src/engine/pqc/dm-envelope.ts` — DM Encryption

### Current (PLACEHOLDER)
```typescript
// Line 107 — KEM ciphertext is just base64 of recipient ID
kem_ct: encodeToBase64(`${recipient}:${messageId}`),

// Line 112 — "ciphertext" is just base64 of plaintext
ct: encodeToBase64(plaintext),

// Line 91 — nonce is deterministic from sender+timestamp
const nonceInput = nonceSeed || `${senderPubkey}:${createdAt}:${messageId}`
```

### New (REAL — Hybrid KEM + AEAD)

The DM envelope becomes async and requires real key material:

```typescript
import { ml_kem768 } from '@noble/post-quantum/ml-kem'
import {
  aesGcmEncrypt, importAesGcmKey, hkdfDeriveKey,
  randomNonce, randomBytes, bytesToBase64, base64ToBytes,
  stringToBytes,
} from 'src/engine/pqc/crypto-provider'

export const buildDmPqcEnvelope = async ({
  plaintext, senderPubkey, recipients, mode, algorithm,
  recipientPqPublicKeys,  // NEW: Map<pubkey, ML-KEM-768 public key bytes>
  senderX25519Secret,     // NEW: sender's X25519 secret for classical component
  createdAt = Math.floor(Date.now() / 1000),
  messageId = `dm-${createdAt}-${recipients.length}`,
  fallbackReasonCode,
}: DmEnvelopeBuildInput): Promise<DmEnvelopeBuildResult> => {

  // 1. Generate a random content encryption key (CEK)
  const cek = randomBytes(32) // 256-bit AES key

  // 2. For each recipient, encapsulate the CEK using their ML-KEM public key
  const recipientsPayload = await Promise.all(recipients.map(async (recipient) => {
    const pqPubKey = recipientPqPublicKeys.get(recipient)
    if (!pqPubKey) throw new Error(`No PQ public key for ${recipient}`)

    // ML-KEM-768 encapsulate: produces (ciphertext, sharedSecret)
    const { cipherText: kemCt, sharedSecret: kemSs } = ml_kem768.encapsulate(pqPubKey)

    // Combine KEM shared secret + X25519 shared secret via HKDF
    // (X25519 DH would be computed here for hybrid mode)
    const combinedIkm = new Uint8Array([...kemSs /* , ...x25519SharedSecret */])
    const salt = stringToBytes(`navcom-pqc-dm:${senderPubkey}:${recipient}`)
    const info = stringToBytes(`dm-cek-wrap:${messageId}`)
    const wrapKey = await hkdfDeriveKey(combinedIkm, salt, info, 32)

    // Wrap the CEK with the derived key
    const wrapNonce = randomNonce()
    const wrapKeyObj = await importAesGcmKey(wrapKey)
    const wrappedCek = await aesGcmEncrypt(cek, wrapKeyObj, wrapNonce)

    return {
      kem_alg: 'mlkem768',
      kem_ct: bytesToBase64(kemCt),         // REAL KEM ciphertext
      pk_ref: recipient,
      wrapped_cek: bytesToBase64(wrappedCek),
      wrap_nonce: bytesToBase64(wrapNonce),
    }
  }))

  // 3. Encrypt plaintext with the CEK
  const nonce = randomNonce()  // REAL random nonce
  const ad = buildDmEnvelopeAssociatedData({ ... })
  const adBytes = stringToBytes(ad)
  const cekKey = await importAesGcmKey(cek)
  const ctBytes = await aesGcmEncrypt(stringToBytes(plaintext), cekKey, nonce, adBytes)

  const envelope: PqcEnvelope = {
    // ... same shape, but with REAL values:
    ct: bytesToBase64(ctBytes),           // REAL ciphertext
    nonce: bytesToBase64(nonce),          // REAL random nonce
    ad: bytesToBase64(adBytes),
    recipients: recipientsPayload,
    // ...
  }

  return { ok: true, content: JSON.stringify(envelope), envelope }
}
```

---

## 6. Replace: `src/engine/pqc/dm-receive-envelope.ts` — DM Decryption

### Current (PLACEHOLDER)
```typescript
// Line 232-234 — "decrypt" is just base64 decode
plaintext: decodeBase64Utf8(validation.value.ct),
```

### New (REAL)

```typescript
export const parseDmPqcEnvelopeContent = async (
  content: string,
  {
    recipientSecretKey,      // NEW: recipient's ML-KEM secret key
    recipientPubkey,         // to find our recipient entry
    expectedSenderPubkey,
  },
): Promise<DmEnvelopeParseResult> => {
  const parsed = JSON.parse(content)
  const validation = validatePqcEnvelope(parsed, { strict: true })
  if (!validation.ok) { /* unchanged */ }

  // 1. Find our recipient entry
  const myEntry = validation.value.recipients.find(r => r.pk_ref === recipientPubkey)
  if (!myEntry) return { ok: false, reason: 'DM_ENVELOPE_RECIPIENT_WRAP_INVALID' }

  // 2. ML-KEM decapsulate to recover shared secret
  const kemCt = base64ToBytes(myEntry.kem_ct)
  const kemSs = ml_kem768.decapsulate(kemCt, recipientSecretKey)

  // 3. Derive the wrap key via HKDF (same derivation as sender)
  const salt = stringToBytes(`navcom-pqc-dm:${expectedSenderPubkey}:${recipientPubkey}`)
  const info = stringToBytes(`dm-cek-wrap:${validation.value.msg_id}`)
  const wrapKey = await hkdfDeriveKey(new Uint8Array([...kemSs]), salt, info, 32)

  // 4. Unwrap the CEK
  const wrapKeyObj = await importAesGcmKey(wrapKey)
  const wrappedCek = base64ToBytes(myEntry.wrapped_cek)
  const wrapNonce = base64ToBytes(myEntry.wrap_nonce)
  const cek = await aesGcmDecrypt(wrappedCek, wrapKeyObj, wrapNonce)

  // 5. Decrypt the message content
  const cekKey = await importAesGcmKey(cek)
  const nonce = base64ToBytes(validation.value.nonce)
  const ct = base64ToBytes(validation.value.ct)
  const ad = base64ToBytes(validation.value.ad)
  const plaintextBytes = await aesGcmDecrypt(ct, cekKey, nonce, ad)

  // 6. Validate AD binding (unchanged logic)
  const adString = bytesToString(base64ToBytes(validation.value.ad))
  // ... existing AD validation ...

  return { ok: true, plaintext: bytesToString(plaintextBytes), reason: 'DM_ENVELOPE_PARSE_OK' }
}
```

---

## 7. Envelope Contract Updates: `src/engine/pqc/envelope-contracts.ts`

Add new fields to `PqcEnvelopeRecipient` for the key-wrapped CEK:

```typescript
export type PqcEnvelopeRecipient = {
  pk_ref: string
  kem_alg: string
  kem_ct: string          // Real ML-KEM ciphertext (base64)
  wrapped_cek?: string    // NEW: AES-GCM wrapped content encryption key (base64)
  wrap_nonce?: string     // NEW: nonce for CEK wrap (base64)
  key_epoch?: string
  flags?: Record<string, unknown>
}
```

Update the algorithm constant:
```typescript
// group-epoch-content.ts
export const GROUP_EPOCH_CONTENT_ALGORITHM = 'aes-256-gcm' // was 'group-epoch-aead-v1'
```

---

## 8. Group Epoch Key Derivation

The group epoch key is a 32-byte symmetric key shared by all current members for a given epoch. It must be:
- Generated randomly by the epoch initiator (group creator or rekey trigger)
- Distributed to each member via NIP-44-encrypted kind-444 (WELCOME) events
- Rotated on membership removal (forward secrecy)

### New Module: `src/engine/pqc/epoch-key-manager.ts`

```typescript
import { randomBytes, hkdfDeriveKey, stringToBytes } from 'src/engine/pqc/crypto-provider'

export const generateEpochKey = (): Uint8Array => randomBytes(32)

export const deriveEpochContentKey = async (
  epochMasterKey: Uint8Array,
  groupId: string,
  epochId: string,
): Promise<Uint8Array> => {
  const salt = stringToBytes(`navcom-epoch:${groupId}`)
  const info = stringToBytes(`epoch-content-key:${epochId}`)
  return hkdfDeriveKey(epochMasterKey, salt, info, 32)
}

export const deriveEpochIntegrityKey = async (
  epochMasterKey: Uint8Array,
  groupId: string,
  epochId: string,
): Promise<Uint8Array> => {
  const salt = stringToBytes(`navcom-epoch:${groupId}`)
  const info = stringToBytes(`epoch-integrity-key:${epochId}`)
  return hkdfDeriveKey(epochMasterKey, salt, info, 32)
}
```

### Epoch Key Distribution Flow

```
Group Creator / Rekey Trigger:
  1. epochMasterKey = generateEpochKey()         // 32 random bytes
  2. For each current member:
       a. contentKey = deriveEpochContentKey(epochMasterKey, groupId, epochId)
       b. Use NIP-44 (signer.nip44.encrypt) to encrypt epochMasterKey to member's pubkey
       c. Publish kind-444 WELCOME event with encrypted epochMasterKey
  3. Store epochMasterKey locally via group-secure-storage.ts (already uses real AES-GCM)

Member receiving kind-444:
  1. Decrypt epochMasterKey via NIP-44 (signer.nip44.decrypt)
  2. Store locally via group-secure-storage.ts
  3. Derive contentKey for encrypt/decrypt of kind-445 messages
```

---

## 9. Key Publication Updates: `src/engine/pqc/key-publication.ts`

The `pq_pub` field in `PqcKeyPublicationRecord` must contain a **real** ML-KEM-768 public key:

```typescript
import { ml_kem768 } from '@noble/post-quantum/ml-kem'
import { bytesToBase64, base64ToBytes } from 'src/engine/pqc/crypto-provider'

export const generatePqcKeyPair = () => {
  const { publicKey, secretKey } = ml_kem768.keygen()
  return {
    publicKeyBase64: bytesToBase64(publicKey),   // 1184 bytes → ~1579 base64 chars
    secretKeyBytes: secretKey,                    // 2400 bytes, store securely
  }
}

export const buildKeyPublicationRecord = (
  userPubkey: string,
  pqPublicKeyBase64: string,
  keyId: string,
  now = Math.floor(Date.now() / 1000),
): PqcKeyPublicationRecord => ({
  schema: PQC_KEY_SCHEMA_VERSION,
  user_pubkey: userPubkey,
  pq_alg: 'ml-kem-768',
  pq_pub: pqPublicKeyBase64,  // REAL ML-KEM public key
  key_id: keyId,
  created_at: now,
  expires_at: now + DEFAULT_PQC_KEY_ROTATION_TTL_SECONDS,
  status: 'active',
})
```

---

## 10. Summary of All File Changes

| File | Change | Sync→Async? |
|------|--------|-------------|
| `src/engine/pqc/crypto-provider.ts` | **NEW** — centralized crypto operations | N/A |
| `src/engine/pqc/epoch-key-manager.ts` | **NEW** — epoch key generation and derivation | N/A |
| `src/engine/group-epoch-content.ts` | Replace base64 with AES-GCM-256 | Yes |
| `src/engine/group-epoch-decrypt.ts` | Pass epochKeyBytes, await decrypt | Yes |
| `src/engine/group-epoch-state.ts` | Delete 186 lines of hand-rolled SHA-256, import crypto-provider | Yes |
| `src/engine/pqc/dm-envelope.ts` | Replace base64 with hybrid KEM + AEAD | Yes |
| `src/engine/pqc/dm-receive-envelope.ts` | Add real KEM decapsulate + AEAD decrypt | Yes |
| `src/engine/pqc/key-publication.ts` | Add real ML-KEM-768 keygen | No |
| `src/engine/pqc/envelope-contracts.ts` | Add `wrapped_cek`, `wrap_nonce` to recipient type | No |
| `src/engine/group-transport-secure-ops.ts` | Pass epochKeyBytes through transport | Yes |
| `src/engine/pqc/negotiation.ts` | No changes needed | No |
| `src/engine/pqc/adaptive-controls.ts` | No changes needed | No |
| `package.json` | Add `@noble/post-quantum` dependency | No |

### Async Migration Impact

Several functions become async because Web Crypto API returns Promises. Callers must be updated:
- `group-transport-secure-ops.ts` → `sendInput()` and `reconcile()` already return Promises
- `group-epoch-decrypt.ts` → callers already handle async in the reconcile path
- `dm-envelope.ts` → `sendMessage` in `commands.ts` is already in an async context
- `group-epoch-state.ts` → integrity computation callers need Promise handling
