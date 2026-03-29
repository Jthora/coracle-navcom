# PQC Test & Validation Plan

Status: Active
Owner: Core Team (Human-Verified)
Created: 2026-03-20
Depends On: [01-crypto-wiring-spec.md](01-crypto-wiring-spec.md), [02-implementation-roadmap.md](02-implementation-roadmap.md)

## Purpose

This document defines how to **prove** real crypto works. Every test targets a specific security property. Tests are ordered by the implementation phases and can be run incrementally.

## Testing Philosophy

The existing test suite validates scaffolding (envelope shapes, type contracts, state machine transitions). Those tests remain valuable. This plan adds **cryptographic correctness tests** that verify actual confidentiality, integrity, and authenticity.

### Key Principle: Tests Must Fail Against Placeholder Code

Every new test must be written so that it would **fail** if the old base64 "encryption" were still in place. This is the litmus test for whether a test is actually validating real crypto.

---

## Level 1: Unit Tests — CryptoProvider

File: `tests/unit/engine/pqc/crypto-provider.spec.ts`

### 1.1 AES-GCM-256 Roundtrip
```typescript
it('encrypts and decrypts with AES-GCM-256', async () => {
  const key = await importAesGcmKey(randomBytes(32))
  const nonce = randomNonce()
  const plaintext = stringToBytes('Earth Alliance operational message')
  const ad = stringToBytes('group:earth-alliance:epoch-7')

  const ct = await aesGcmEncrypt(plaintext, key, nonce, ad)
  const recovered = await aesGcmDecrypt(ct, key, nonce, ad)

  expect(recovered).toEqual(plaintext)
  expect(ct).not.toEqual(plaintext) // Ciphertext differs from plaintext
})
```

### 1.2 AES-GCM Wrong Key Fails
```typescript
it('fails to decrypt with wrong key', async () => {
  const key1 = await importAesGcmKey(randomBytes(32))
  const key2 = await importAesGcmKey(randomBytes(32))
  const nonce = randomNonce()
  const ct = await aesGcmEncrypt(stringToBytes('secret'), key1, nonce)

  await expect(aesGcmDecrypt(ct, key2, nonce)).rejects.toThrow()
})
```

### 1.3 AES-GCM Tampered Ciphertext Fails
```typescript
it('fails on tampered ciphertext', async () => {
  const key = await importAesGcmKey(randomBytes(32))
  const nonce = randomNonce()
  const ct = await aesGcmEncrypt(stringToBytes('secret'), key, nonce)

  ct[0] ^= 0xff // Flip one byte
  await expect(aesGcmDecrypt(ct, key, nonce)).rejects.toThrow()
})
```

### 1.4 AES-GCM AD Mismatch Fails
```typescript
it('fails when associated data mismatches', async () => {
  const key = await importAesGcmKey(randomBytes(32))
  const nonce = randomNonce()
  const ad1 = stringToBytes('group:alpha')
  const ad2 = stringToBytes('group:beta')

  const ct = await aesGcmEncrypt(stringToBytes('secret'), key, nonce, ad1)
  await expect(aesGcmDecrypt(ct, key, nonce, ad2)).rejects.toThrow()
})
```

### 1.5 Random Nonces Are Unique
```typescript
it('produces unique nonces', () => {
  const nonces = new Set<string>()
  for (let i = 0; i < 1000; i++) {
    nonces.add(bytesToBase64(randomNonce()))
  }
  expect(nonces.size).toBe(1000) // All unique
})
```

### 1.6 SHA-256 Known Vector
```typescript
it('matches known SHA-256 test vector', async () => {
  const input = stringToBytes('abc')
  const hash = await sha256(input)
  const hex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('')
  expect(hex).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})
```

### 1.7 HMAC-SHA256 Known Vector
```typescript
it('matches known HMAC-SHA256 test vector', async () => {
  // RFC 4231 Test Case 2
  const key = stringToBytes('Jefe')
  const data = stringToBytes('what do ya want for nothing?')
  const mac = await hmacSha256(key, data)
  const hex = Array.from(mac).map(b => b.toString(16).padStart(2, '0')).join('')
  expect(hex).toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843')
})
```

### 1.8 HKDF Determinism
```typescript
it('derives same key from same inputs', async () => {
  const ikm = randomBytes(32)
  const salt = stringToBytes('test-salt')
  const info = stringToBytes('test-info')

  const key1 = await hkdfDeriveKey(ikm, salt, info, 32)
  const key2 = await hkdfDeriveKey(ikm, salt, info, 32)
  expect(key1).toEqual(key2)
})
```

---

## Level 2: Unit Tests — Group Epoch Content AEAD

File: `tests/unit/engine/group-epoch-content-real.spec.ts`

### 2.1 Ciphertext Is Not Base64 Of Plaintext (Anti-Placeholder Test)
```typescript
it('ciphertext is not base64 of plaintext', async () => {
  const epochKey = randomBytes(32)
  const plaintext = 'This is a classified Earth Alliance message'

  const result = await encodeSecureGroupEpochContent({
    groupId: 'g1', epochId: 'e1', plaintext,
    senderPubkey: 'sender', recipients: ['r1'],
    epochKeyBytes: epochKey,
  })

  expect(result.ok).toBe(true)
  if (!result.ok) return

  // THE CRITICAL TEST: ct must NOT be base64(plaintext)
  const decoded = atob(result.envelope.ct)
  expect(decoded).not.toBe(plaintext)
  expect(decoded).not.toContain(plaintext)
})
```

### 2.2 Roundtrip Encrypt/Decrypt
```typescript
it('roundtrips through encrypt and decrypt', async () => {
  const epochKey = randomBytes(32)
  const plaintext = 'Rendezvous at coordinates 47.6062° N, 122.3321° W'

  const encoded = await encodeSecureGroupEpochContent({
    groupId: 'g1', epochId: 'e1', plaintext,
    senderPubkey: 'sender', recipients: ['r1'],
    epochKeyBytes: epochKey,
  })

  expect(encoded.ok).toBe(true)
  if (!encoded.ok) return

  const decoded = await decodeSecureGroupEpochContent(encoded.content, epochKey)
  expect(decoded.ok).toBe(true)
  if (!decoded.ok) return
  expect(decoded.plaintext).toBe(plaintext)
})
```

### 2.3 Wrong Epoch Key Fails
```typescript
it('fails to decrypt with wrong epoch key', async () => {
  const key1 = randomBytes(32)
  const key2 = randomBytes(32)

  const encoded = await encodeSecureGroupEpochContent({
    groupId: 'g1', epochId: 'e1', plaintext: 'secret',
    senderPubkey: 'sender', recipients: ['r1'],
    epochKeyBytes: key1,
  })

  if (!encoded.ok) return
  const decoded = await decodeSecureGroupEpochContent(encoded.content, key2)
  expect(decoded.ok).toBe(false)
})
```

### 2.4 Nonces Are Random (Not Deterministic)
```typescript
it('produces different nonces for same input', async () => {
  const epochKey = randomBytes(32)
  const input = {
    groupId: 'g1', epochId: 'e1', plaintext: 'hello',
    senderPubkey: 'sender', recipients: ['r1'],
    epochKeyBytes: epochKey,
  }

  const r1 = await encodeSecureGroupEpochContent(input)
  const r2 = await encodeSecureGroupEpochContent(input)

  if (!r1.ok || !r2.ok) return
  expect(r1.envelope.nonce).not.toBe(r2.envelope.nonce) // Random nonces differ
  expect(r1.envelope.ct).not.toBe(r2.envelope.ct)       // Different nonces → different ct
})
```

---

## Level 3: Unit Tests — ML-KEM-768

File: `tests/unit/engine/pqc/ml-kem.spec.ts`

### 3.1 Key Generation Produces Valid Keys
```typescript
it('generates ML-KEM-768 keypair', () => {
  const { publicKey, secretKey } = ml_kem768.keygen()
  expect(publicKey.length).toBe(1184)  // ML-KEM-768 public key size
  expect(secretKey.length).toBe(2400)  // ML-KEM-768 secret key size
})
```

### 3.2 Encapsulate/Decapsulate Shared Secret Agreement
```typescript
it('encapsulate and decapsulate agree on shared secret', () => {
  const { publicKey, secretKey } = ml_kem768.keygen()
  const { cipherText, sharedSecret: ss1 } = ml_kem768.encapsulate(publicKey)
  const ss2 = ml_kem768.decapsulate(cipherText, secretKey)

  expect(ss1).toEqual(ss2)
  expect(ss1.length).toBe(32) // 256-bit shared secret
})
```

### 3.3 Wrong Secret Key Fails
```typescript
it('decapsulate with wrong key produces different shared secret', () => {
  const kp1 = ml_kem768.keygen()
  const kp2 = ml_kem768.keygen()

  const { cipherText, sharedSecret: ss1 } = ml_kem768.encapsulate(kp1.publicKey)
  const ss2 = ml_kem768.decapsulate(cipherText, kp2.secretKey)

  expect(ss1).not.toEqual(ss2) // Different key → different shared secret
})
```

---

## Level 4: Unit Tests — Epoch Key Manager

File: `tests/unit/engine/pqc/epoch-key-manager.spec.ts`

### 4.1 Epoch Keys Are Random
```typescript
it('generates unique epoch keys', () => {
  const keys = new Set<string>()
  for (let i = 0; i < 100; i++) {
    keys.add(bytesToBase64(generateEpochKey()))
  }
  expect(keys.size).toBe(100)
})
```

### 4.2 Content Key Derivation Is Deterministic
```typescript
it('derives same content key from same inputs', async () => {
  const masterKey = randomBytes(32)
  const k1 = await deriveEpochContentKey(masterKey, 'group1', 'epoch1')
  const k2 = await deriveEpochContentKey(masterKey, 'group1', 'epoch1')
  expect(k1).toEqual(k2)
})
```

### 4.3 Different Epochs Derive Different Keys
```typescript
it('different epochs produce different content keys', async () => {
  const masterKey = randomBytes(32)
  const k1 = await deriveEpochContentKey(masterKey, 'group1', 'epoch1')
  const k2 = await deriveEpochContentKey(masterKey, 'group1', 'epoch2')
  expect(k1).not.toEqual(k2)
})
```

### 4.4 Content Key vs Integrity Key Are Different
```typescript
it('content and integrity keys are different for same epoch', async () => {
  const masterKey = randomBytes(32)
  const content = await deriveEpochContentKey(masterKey, 'g1', 'e1')
  const integrity = await deriveEpochIntegrityKey(masterKey, 'g1', 'e1')
  expect(content).not.toEqual(integrity)
})
```

---

## Level 5: Integration Tests — Full Group Chat Flow

File: `tests/integration/secure-group-chat.spec.ts`

### 5.1 End-to-End Secure Group Message
```typescript
it('encrypts, publishes, and decrypts a group message', async () => {
  // 1. Create epoch key
  const epochMasterKey = generateEpochKey()

  // 2. Derive content key
  const contentKey = await deriveEpochContentKey(epochMasterKey, 'group-ea-ops', 'epoch-1')

  // 3. Encrypt message
  const encoded = await encodeSecureGroupEpochContent({
    groupId: 'group-ea-ops',
    epochId: 'epoch-1',
    plaintext: 'Briefing at 0800 UTC. Bring encrypted comms.',
    senderPubkey: 'commander-pubkey',
    recipients: ['agent-alpha', 'agent-bravo'],
    epochKeyBytes: contentKey,
  })
  expect(encoded.ok).toBe(true)

  // 4. Verify relay-side content is opaque
  const relayContent = JSON.parse(encoded.content)
  const ctDecoded = atob(relayContent.ct)
  expect(ctDecoded).not.toContain('Briefing')
  expect(ctDecoded).not.toContain('0800')

  // 5. Decrypt as authorized member
  const decoded = await decodeSecureGroupEpochContent(encoded.content, contentKey)
  expect(decoded.ok).toBe(true)
  if (decoded.ok) {
    expect(decoded.plaintext).toBe('Briefing at 0800 UTC. Bring encrypted comms.')
  }
})
```

### 5.2 Forward Secrecy — Removed Member Cannot Decrypt
```typescript
it('removed member cannot decrypt messages from new epoch', async () => {
  const epoch1Key = generateEpochKey()
  const epoch2Key = generateEpochKey() // New key after removal

  const epoch1ContentKey = await deriveEpochContentKey(epoch1Key, 'g1', 'e1')
  const epoch2ContentKey = await deriveEpochContentKey(epoch2Key, 'g1', 'e2')

  // Message sent in epoch 2 (after member removal)
  const encoded = await encodeSecureGroupEpochContent({
    groupId: 'g1', epochId: 'e2', plaintext: 'Post-removal classified intel',
    senderPubkey: 'sender', recipients: ['still-member'],
    epochKeyBytes: epoch2ContentKey,
  })
  expect(encoded.ok).toBe(true)

  // Removed member only has epoch 1 key — cannot decrypt epoch 2
  const failDecode = await decodeSecureGroupEpochContent(encoded.content, epoch1ContentKey)
  expect(failDecode.ok).toBe(false)
})
```

### 5.3 Cross-Group Replay Prevention
```typescript
it('message from group A cannot be replayed into group B', async () => {
  const keyA = randomBytes(32)
  const keyB = randomBytes(32)

  const contentKeyA = await deriveEpochContentKey(keyA, 'group-alpha', 'e1')
  const contentKeyB = await deriveEpochContentKey(keyB, 'group-bravo', 'e1')

  const encoded = await encodeSecureGroupEpochContent({
    groupId: 'group-alpha', epochId: 'e1', plaintext: 'Alpha-only intel',
    senderPubkey: 'sender', recipients: ['r1'],
    epochKeyBytes: contentKeyA,
  })
  expect(encoded.ok).toBe(true)

  // Attempt to decrypt in group-bravo context fails (different key)
  const fail = await decodeSecureGroupEpochContent(encoded.content, contentKeyB)
  expect(fail.ok).toBe(false)
})
```

---

## Level 6: Security Property Verification

### 6.1 No Plaintext in Wire Format
```typescript
it('no plaintext appears anywhere in the serialized envelope', async () => {
  const plaintext = 'UNIQUESENTINEL_classified_payload_xyz123'
  const epochKey = randomBytes(32)

  const result = await encodeSecureGroupEpochContent({
    groupId: 'g1', epochId: 'e1', plaintext,
    senderPubkey: 'sender', recipients: ['r1'],
    epochKeyBytes: epochKey,
  })

  if (!result.ok) return
  // Search the entire serialized envelope for any trace of plaintext
  expect(result.content).not.toContain('UNIQUESENTINEL')
  expect(result.content).not.toContain(btoa('UNIQUESENTINEL'))
  expect(result.content).not.toContain('classified_payload')
})
```

### 6.2 Deterministic Nonces Are Eliminated
```typescript
it('nonce is not derivable from public metadata', async () => {
  const epochKey = randomBytes(32)
  const result = await encodeSecureGroupEpochContent({
    groupId: 'g1', epochId: 'e1', plaintext: 'x',
    senderPubkey: 'sender', recipients: ['r1'],
    epochKeyBytes: epochKey,
    createdAt: 1700000000,
  })

  if (!result.ok) return
  const nonce = result.envelope.nonce

  // Nonce must NOT be base64 of "g1:e1:1700000000" (old deterministic nonce pattern)
  const deterministicNonce = btoa('g1:e1:1700000000')
  expect(nonce).not.toBe(deterministicNonce)
})
```

---

## Running Tests

```bash
# Phase 1 crypto foundation
pnpm vitest run tests/unit/engine/pqc/crypto-provider.spec.ts
pnpm vitest run tests/unit/engine/pqc/epoch-key-manager.spec.ts
pnpm vitest run tests/unit/engine/pqc/ml-kem.spec.ts

# Phase 2 group AEAD
pnpm vitest run tests/unit/engine/group-epoch-content-real.spec.ts

# Phase 5 integration
pnpm vitest run tests/integration/secure-group-chat.spec.ts

# Full suite (existing + new — ensure no regressions)
pnpm vitest run
```

## Test Matrix Summary

| Test | Security Property | Phase | Anti-Placeholder? |
|------|-------------------|-------|--------------------|
| 1.1 | Confidentiality | 1 | Yes |
| 1.2 | Key separation | 1 | Yes |
| 1.3 | Integrity | 1 | Yes |
| 1.4 | Authentication (AD) | 1 | Yes |
| 1.5 | Nonce uniqueness | 1 | Yes |
| 1.6 | Hash correctness | 1 | No (replaces hand-rolled) |
| 1.7 | MAC correctness | 1 | No (replaces hand-rolled) |
| 1.8 | KDF determinism | 1 | No (new function) |
| 2.1 | **Anti-placeholder** | 2 | **YES — primary litmus** |
| 2.2 | Roundtrip correctness | 2 | Yes |
| 2.3 | Key separation | 2 | Yes |
| 2.4 | Nonce randomness | 2 | Yes |
| 3.1-3.3 | KEM correctness | 3 | N/A (new function) |
| 4.1-4.4 | Key derivation | 4 | N/A (new function) |
| 5.1 | End-to-end | 5 | Yes |
| 5.2 | Forward secrecy | 5 | Yes |
| 5.3 | Replay prevention | 5 | Yes |
| 6.1 | **No plaintext leak** | 5 | **YES — critical** |
| 6.2 | No deterministic nonce | 5 | **YES — critical** |
