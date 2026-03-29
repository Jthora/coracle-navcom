# PQC Implementation Roadmap

Status: Active
Owner: Core Team (Human-Verified)
Created: 2026-03-20
Depends On: [00-overview.md](00-overview.md), [01-crypto-wiring-spec.md](01-crypto-wiring-spec.md)

## Ordering Principles

1. Each task must be completable and testable in isolation.
2. No task depends on a task that comes after it.
3. Each task has a clear "done when" definition.
4. The secure pilot flag stays OFF until Phase 5.

---

## Phase 1 — Crypto Foundation

**Goal**: Install real crypto libraries and create the CryptoProvider module. Zero behavioral changes to existing code.

### Task 1.1: Install @noble/post-quantum

```bash
pnpm add @noble/post-quantum@^0.2
```

**Done when**: `package.json` has the dependency and `import { ml_kem768 } from '@noble/post-quantum/ml-kem'` resolves.

**Verify**: `pnpm exec tsc --noEmit` passes (types resolve).

### Task 1.2: Create `src/engine/pqc/crypto-provider.ts`

Implement the centralized module with:
- `randomBytes(n)`, `randomNonce()`
- `aesGcmEncrypt()`, `aesGcmDecrypt()`
- `importAesGcmKey()`
- `hkdfDeriveKey()`
- `sha256()`, `hmacSha256()`
- `bytesToBase64()`, `base64ToBytes()`
- `stringToBytes()`, `bytesToString()`

**Done when**: All functions have unit tests that verify correctness against known test vectors.

**Verify**: `pnpm vitest run tests/unit/engine/pqc/crypto-provider.spec.ts` passes.

### Task 1.3: Create `src/engine/pqc/epoch-key-manager.ts`

Implement:
- `generateEpochKey()` → 32 random bytes
- `deriveEpochContentKey(masterKey, groupId, epochId)` → 32-byte HKDF-derived key
- `deriveEpochIntegrityKey(masterKey, groupId, epochId)` → 32-byte HKDF-derived key

**Done when**: Unit tests verify deterministic derivation (same inputs → same output) and randomness (different calls → different master keys).

### Task 1.4: Add ML-KEM-768 keygen to `key-publication.ts`

Add `generatePqcKeyPair()` function that returns a real ML-KEM-768 keypair.

**Done when**: Unit test generates a keypair, encapsulates with the public key, decapsulates with the secret key, and recovers the same shared secret.

**Test**:
```typescript
const { publicKey, secretKey } = ml_kem768.keygen()
const { cipherText, sharedSecret: ss1 } = ml_kem768.encapsulate(publicKey)
const ss2 = ml_kem768.decapsulate(cipherText, secretKey)
expect(ss1).toEqual(ss2) // Both parties derive same shared secret
```

---

## Phase 2 — Group Epoch AEAD (Symmetric Encryption)

**Goal**: Group messages are encrypted with real AES-GCM-256 using epoch keys. This is the highest-impact change — it protects all group message content.

### Task 2.1: Make `encodeSecureGroupEpochContent` use real AEAD

Modify `src/engine/group-epoch-content.ts`:
- Import from `crypto-provider`
- Change signature to async, add `epochKeyBytes` parameter
- Replace `encodeUtf8Base64(plaintext)` with `aesGcmEncrypt()`
- Replace deterministic nonce with `randomNonce()`
- Keep `buildAssociatedData()` unchanged (AD is metadata, not secret)

**Done when**: Encode produces ciphertext that is NOT the base64 of plaintext. Decode with correct key recovers plaintext. Decode with wrong key throws.

### Task 2.2: Make `decodeSecureGroupEpochContent` use real AEAD

Modify the decode function:
- Accept `epochKeyBytes` parameter
- Replace `decodeUtf8Base64(parsed.ct)` with `aesGcmDecrypt()`
- Validate AD binding during authenticated decryption (AES-GCM does this automatically)

**Done when**: Roundtrip test passes: encode → decode → same plaintext. Tampered ciphertext → decrypt failure. Wrong key → decrypt failure.

### Task 2.3: Update `validateAndDecryptSecureGroupEventContent`

Modify `src/engine/group-epoch-decrypt.ts`:
- Accept `epochKeyBytes` parameter
- Await the async decode call
- Pass key through to `decodeSecureGroupEpochContent`

**Done when**: Integration test with real key material passes end-to-end.

### Task 2.4: Update `group-transport-secure-ops.ts` callers

Thread `epochKeyBytes` through the send and reconcile paths:
- `sendInput()`: resolve epoch key from local storage before encoding
- `reconcile()`: resolve epoch key from local storage before decoding
- Remove `as any` casts on local state

**Done when**: Existing transport tests updated and passing with real key material.

### Task 2.5: Replace hand-rolled SHA-256 in `group-epoch-state.ts`

- Delete the ~186-line hand-rolled `sha256()` function and `SHA256_K` constant
- Delete the hand-rolled `hmacSha256()` function
- Delete the hand-rolled `bytesToBase64Url()` and `base64UrlToBytes()` functions
- Import `sha256`, `hmacSha256`, `bytesToBase64`, `base64ToBytes` from crypto-provider
- Make integrity computation async

**Done when**: Existing epoch state tests pass with Web Crypto functions. File is ~130 lines shorter.

---

## Phase 3 — Epoch Key Distribution

**Goal**: Epoch keys are generated, encrypted to each group member, and distributed via kind-444 WELCOME events using NIP-44.

### Task 3.1: Implement epoch key generation on group create

When a secure group is created:
1. Generate a random 32-byte epoch master key via `generateEpochKey()`
2. Store locally via `group-secure-storage.ts` (already uses real AES-GCM)
3. For each initial member, encrypt the epoch key using `signer.nip44.encrypt(memberPubkey, epochKeyBase64)`
4. Publish kind-444 WELCOME events containing the encrypted epoch key

**Done when**: Group creation produces kind-444 events with NIP-44 encrypted epoch key.

### Task 3.2: Implement epoch key receipt on join/welcome

When a member receives a kind-444 WELCOME:
1. Decrypt the epoch key via `signer.nip44.decrypt(senderPubkey, encryptedContent)`
2. Store locally via `group-secure-storage.ts`
3. Derive content key via `deriveEpochContentKey()`

**Done when**: New member can decrypt group messages after receiving WELCOME.

### Task 3.3: Implement epoch rotation on membership removal

When a member is removed:
1. Generate new epoch master key
2. Distribute to all remaining members (excluding removed member) via kind-444
3. Increment epoch sequence
4. New messages use new epoch key

**Done when**: Removed member's old key cannot decrypt messages sent after rotation. Remaining members can.

### Task 3.4: Upgrade epoch key distribution to hybrid KEM (optional, can defer)

Replace NIP-44 epoch key wrapping with:
1. ML-KEM-768 encapsulate to each member's PQ public key
2. HKDF-combine KEM shared secret with X25519 shared secret
3. AES-GCM wrap the epoch key with the combined key

This provides PQC protection for the key distribution itself (defense against harvest-now-decrypt-later attacks on the key exchange).

**Done when**: Epoch key distribution uses ML-KEM + X25519 hybrid. Integration test shows classical-only client cannot unwrap.

---

## Phase 4 — DM Envelope Encryption

**Goal**: Direct messages use real hybrid KEM + AEAD.

### Task 4.1: Update `buildDmPqcEnvelope` in `dm-envelope.ts`

- Generate random CEK
- For each recipient: ML-KEM encapsulate → HKDF → wrap CEK
- Encrypt plaintext with CEK via AES-GCM
- Real random nonce

**Done when**: DM envelope contains real KEM ciphertext and encrypted content. Existing envelope validation still passes.

### Task 4.2: Update `parseDmPqcEnvelopeContent` in `dm-receive-envelope.ts`

- Find recipient entry
- ML-KEM decapsulate → HKDF → unwrap CEK
- Decrypt content with CEK

**Done when**: Roundtrip DM encrypt → decrypt works. Wrong recipient key → failure.

### Task 4.3: Wire DM crypto into `commands.ts`

Thread the key material through the existing send path:
- Resolve recipient PQ public keys from kind-10051 events
- Pass to envelope builder
- Handle PQ key unavailability gracefully (fall back to NIP-44 classical mode)

**Done when**: DM send with PQ-capable recipient uses real hybrid encryption. DM send to non-PQ recipient falls back to NIP-44.

---

## Phase 5 — Integration, Hardening, Enable

**Goal**: Everything works, the flag turns on.

### Task 5.1: Integration test with real relay

- Create a secure group
- Add 2-3 members
- Send messages → verify they appear encrypted on relay
- Remove a member → verify forward secrecy (new messages undecryptable by removed member)
- Verify cross-device decrypt (same user, different session)

### Task 5.2: Enable `ENABLE_SECURE_GROUP_PILOT` flag

- Set `VITE_ENABLE_SECURE_GROUP_PILOT=true` in `.env.local`
- Verify the UI "Experimental PQC" badge appears on secure groups
- Verify group creation offers the secure option
- Smoke test the full flow

### Task 5.3: Performance benchmarks

- Measure AES-GCM encrypt/decrypt latency (should be < 1ms on modern hardware)
- Measure ML-KEM keygen/encapsulate/decapsulate latency (should be < 5ms)
- Measure epoch rotation latency for groups of 10, 50, 100 members
- Verify relay payload size stays within 64 KB limit

### Task 5.4: Security review

- Verify no plaintext leaks in console/network
- Verify nonces are never reused (random, not deterministic)
- Verify removed members cannot derive new epoch keys
- Verify classical fallback uses NIP-44 (not base64)
- Verify associated data binding prevents cross-group replay

---

## Dependency Graph

```
Phase 1 (Foundation)
  ├── 1.1 Install @noble/post-quantum
  ├── 1.2 Create crypto-provider.ts
  │     ↓
  ├── 1.3 Create epoch-key-manager.ts (depends on 1.2)
  └── 1.4 ML-KEM keygen (depends on 1.1)

Phase 2 (Group AEAD) — depends on 1.2, 1.3
  ├── 2.1 Encrypt group content (depends on 1.2)
  ├── 2.2 Decrypt group content (depends on 2.1)
  ├── 2.3 Update decrypt wrapper (depends on 2.2)
  ├── 2.4 Update transport callers (depends on 2.3)
  └── 2.5 Replace hand-rolled SHA-256 (depends on 1.2, independent of 2.1-2.4)

Phase 3 (Key Distribution) — depends on 2.1, 2.2
  ├── 3.1 Epoch key on group create (depends on 1.3)
  ├── 3.2 Epoch key on join (depends on 3.1)
  ├── 3.3 Epoch rotation on removal (depends on 3.2)
  └── 3.4 Hybrid KEM key exchange [OPTIONAL] (depends on 1.4, 3.1)

Phase 4 (DM Encryption) — depends on 1.1, 1.2, 1.4
  ├── 4.1 DM encrypt (depends on 1.4)
  ├── 4.2 DM decrypt (depends on 4.1)
  └── 4.3 Wire into commands.ts (depends on 4.2)

Phase 5 (Enable) — depends on 2.*, 3.1-3.3
  ├── 5.1 Integration test
  ├── 5.2 Enable pilot flag
  ├── 5.3 Performance benchmarks
  └── 5.4 Security review
```

## Critical Path

The fastest route to the target capability ("secure group chats"):

**1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 2.3 → 2.4 → 3.1 → 3.2 → 3.3 → 5.1 → 5.2**

This path delivers real encrypted group chat without DM encryption (Phase 4) or hybrid KEM key exchange (Task 3.4). Those can follow.

**Estimated scope**: ~12 tasks on critical path, primarily modifying 8 existing files and creating 2 new ones.
