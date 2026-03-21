# PQC Migration Checklist

Status: Active
Owner: Core Team (Human-Verified)
Created: 2026-03-20
Depends On: [01-crypto-wiring-spec.md](01-crypto-wiring-spec.md), [02-implementation-roadmap.md](02-implementation-roadmap.md), [03-test-validation-plan.md](03-test-validation-plan.md)

## Purpose

Step-by-step checklist for migrating from placeholder crypto to real crypto. Each item is a discrete, verifiable action. Do them in order. Check each box only when the verification step passes.

---

## Pre-Flight

- [ ] Read all four docs in this suite (00 through 03)
- [ ] Confirm you are on a dedicated branch (e.g., `feat/real-pqc-crypto`)
- [ ] Confirm `pnpm vitest run` passes with all existing tests (baseline)
- [ ] Confirm `pnpm exec tsc --noEmit` passes (no type errors)
- [ ] Confirm `VITE_ENABLE_SECURE_GROUP_PILOT` is `false` (pilot stays off during migration)

---

## Phase 1 — Crypto Foundation

### 1.1 Install dependency
- [ ] Run: `pnpm add @noble/post-quantum@^0.2`
- [ ] Verify: `node -e "require('@noble/post-quantum/ml-kem')"` exits without error
- [ ] Verify: `pnpm exec tsc --noEmit` passes
- [ ] Commit: `feat(pqc): add @noble/post-quantum dependency`

### 1.2 Create CryptoProvider module
- [ ] Create `src/engine/pqc/crypto-provider.ts` per spec in [01-crypto-wiring-spec.md §1](01-crypto-wiring-spec.md)
- [ ] Export all functions from `src/engine/pqc/index.ts`
- [ ] Create `tests/unit/engine/pqc/crypto-provider.spec.ts` with tests 1.1–1.8 from [03-test-validation-plan.md §1](03-test-validation-plan.md)
- [ ] Verify: `pnpm vitest run tests/unit/engine/pqc/crypto-provider.spec.ts` — all pass
- [ ] Verify: `pnpm exec tsc --noEmit` passes
- [ ] Commit: `feat(pqc): add CryptoProvider with AES-GCM, HKDF, SHA-256, HMAC`

### 1.3 Create Epoch Key Manager
- [ ] Create `src/engine/pqc/epoch-key-manager.ts` per spec
- [ ] Create `tests/unit/engine/pqc/epoch-key-manager.spec.ts` with tests 4.1–4.4
- [ ] Verify: all tests pass
- [ ] Commit: `feat(pqc): add epoch key generation and HKDF derivation`

### 1.4 Add ML-KEM-768 keygen
- [ ] Add `generatePqcKeyPair()` to `src/engine/pqc/key-publication.ts`
- [ ] Create `tests/unit/engine/pqc/ml-kem.spec.ts` with tests 3.1–3.3
- [ ] Verify: encapsulate/decapsulate shared secret agreement test passes
- [ ] Commit: `feat(pqc): add real ML-KEM-768 keygen and encapsulate/decapsulate`

### Phase 1 Gate
- [ ] All existing tests still pass: `pnpm vitest run`
- [ ] Zero behavioral changes to existing code (all new functions, no modifications yet)

---

## Phase 2 — Group Epoch AEAD

### 2.1 Replace group content encryption
- [ ] Modify `src/engine/group-epoch-content.ts`: `encodeSecureGroupEpochContent` → async, add `epochKeyBytes` param, use `aesGcmEncrypt`
- [ ] Replace `encodeUtf8Base64(plaintext)` with real `aesGcmEncrypt()`
- [ ] Replace deterministic nonce with `randomNonce()`
- [ ] Verify: **Anti-placeholder test 2.1** passes (ciphertext ≠ base64 of plaintext)
- [ ] Commit: `feat(pqc): wire real AES-GCM-256 into group content encryption`

### 2.2 Replace group content decryption
- [ ] Modify `decodeSecureGroupEpochContent` → async, add `epochKeyBytes` param, use `aesGcmDecrypt`
- [ ] Replace `decodeUtf8Base64(parsed.ct)` with real `aesGcmDecrypt()`
- [ ] Verify: roundtrip test 2.2 passes. Wrong-key test 2.3 passes.
- [ ] Commit: `feat(pqc): wire real AES-GCM-256 into group content decryption`

### 2.3 Update decrypt wrapper
- [ ] Modify `src/engine/group-epoch-decrypt.ts`: add `epochKeyBytes` param, await async call
- [ ] Update callers in `group-transport-secure-ops.ts`
- [ ] Verify: existing group decrypt tests updated and passing
- [ ] Commit: `feat(pqc): thread epoch key through group decrypt path`

### 2.4 Update transport callers
- [ ] Modify `src/engine/group-transport-secure-ops.ts`: resolve epoch key from secure storage before send/reconcile
- [ ] Remove `as any` casts on local state — add proper type guards
- [ ] Verify: transport tests pass with real key material
- [ ] Commit: `feat(pqc): wire epoch key resolution into secure transport ops`

### 2.5 Remove hand-rolled SHA-256
- [ ] In `src/engine/group-epoch-state.ts`, delete:
  - `rotr()` function
  - `SHA256_K` constant (64 entries)
  - `sha256()` function (~100 lines)
  - `hmacSha256()` function (~30 lines)
  - `bytesToBase64Url()` function
  - `base64UrlToBytes()` function
- [ ] Add imports from `crypto-provider`
- [ ] Make `computeIntegrityMac` / `verifyIntegrityMac` async
- [ ] Verify: epoch state tests pass with Web Crypto SHA-256
- [ ] Verify: file is ~130 lines shorter
- [ ] Commit: `refactor(pqc): replace hand-rolled SHA-256 with Web Crypto`

### Phase 2 Gate
- [ ] **Anti-placeholder test passes**: ciphertext is NOT base64 of plaintext
- [ ] **No plaintext leak test passes**: serialized envelope contains no trace of message content
- [ ] **Forward secrecy test passes**: wrong epoch key cannot decrypt
- [ ] All existing tests updated and passing: `pnpm vitest run`

---

## Phase 3 — Epoch Key Distribution

### 3.1 Epoch key on group create
- [ ] When creating a secure group, generate epoch master key via `generateEpochKey()`
- [ ] Store locally via `group-secure-storage.ts` (already real AES-GCM)
- [ ] For each member: encrypt epoch key via `signer.nip44.encrypt()` → kind-444 event
- [ ] Verify: kind-444 event is published with NIP-44 encrypted content
- [ ] Commit: `feat(pqc): generate and distribute real epoch key on group create`

### 3.2 Epoch key on join
- [ ] When receiving kind-444 WELCOME: decrypt via `signer.nip44.decrypt()`
- [ ] Store epoch key locally via `group-secure-storage.ts`
- [ ] Derive content key via `deriveEpochContentKey()`
- [ ] Verify: new member can decrypt group messages
- [ ] Commit: `feat(pqc): receive and store epoch key from WELCOME events`

### 3.3 Epoch rotation on removal
- [ ] On membership removal: generate new epoch key
- [ ] Distribute to remaining members only (exclude removed member)
- [ ] Increment epoch sequence
- [ ] Verify: removed member's old key cannot decrypt new epoch messages
- [ ] Commit: `feat(pqc): rotate epoch key on member removal`

### Phase 3 Gate
- [ ] End-to-end test 5.1 passes: create group → send message → decrypt as member
- [ ] Forward secrecy test 5.2 passes: removed member locked out
- [ ] Cross-group replay test 5.3 passes

---

## Phase 4 — DM Envelope Encryption (Can Parallel with Phase 3)

### 4.1 DM encrypt
- [ ] Modify `buildDmPqcEnvelope` → async, add key material params
- [ ] Real ML-KEM-768 encapsulate per recipient
- [ ] Real AES-GCM encrypt of content with random CEK
- [ ] Real random nonce
- [ ] Verify: DM envelope ct ≠ base64(plaintext)
- [ ] Commit: `feat(pqc): wire real hybrid KEM + AEAD into DM encryption`

### 4.2 DM decrypt
- [ ] Modify `parseDmPqcEnvelopeContent` → async, add secret key param
- [ ] Real ML-KEM-768 decapsulate → HKDF → unwrap CEK → AES-GCM decrypt
- [ ] Verify: roundtrip test passes
- [ ] Commit: `feat(pqc): wire real hybrid KEM + AEAD into DM decryption`

### 4.3 Wire into commands
- [ ] Thread key material through `sendMessage` in `commands.ts`
- [ ] Resolve recipient PQ public keys from kind-10051
- [ ] Graceful fallback to NIP-44 if no PQ key available
- [ ] Verify: DM to PQ-capable recipient → hybrid encrypted. DM to non-PQ → NIP-44.
- [ ] Commit: `feat(pqc): wire DM PQC path into send command`

---

## Phase 5 — Enable

### 5.1 Integration test
- [ ] Run secure group flow manually against a test relay
- [ ] Create group → add members → send messages → verify encryption on wire
- [ ] Remove member → verify forward secrecy
- [ ] Cross-device: same user decrypts on second session

### 5.2 Enable pilot flag
- [ ] Set `VITE_ENABLE_SECURE_GROUP_PILOT=true` in `.env.local`
- [ ] Verify UI shows secure group option
- [ ] Smoke test full flow in browser
- [ ] Commit: `feat(pqc): enable secure group pilot`

### 5.3 Performance benchmarks
- [ ] AES-GCM-256 encrypt/decrypt < 1ms
- [ ] ML-KEM-768 keygen < 10ms
- [ ] ML-KEM-768 encapsulate/decapsulate < 5ms
- [ ] Epoch rotation for 50-member group < 500ms
- [ ] Serialized envelope < 64 KB for relay compatibility

### 5.4 Security review
- [ ] No plaintext in console.log, network tab, or relay storage
- [ ] Nonces verified random (not deterministic)
- [ ] Removed members verified locked out
- [ ] Classical fallback verified to use NIP-44 (not base64)
- [ ] AD binding prevents cross-group/cross-epoch replay
- [ ] Epoch key stored via AES-GCM in local storage (not plaintext)

### Phase 5 Gate
- [ ] All tests pass: `pnpm vitest run`
- [ ] TypeScript clean: `pnpm exec tsc --noEmit`
- [ ] Manual smoke test: group create → message → decrypt → member removal → forward secrecy
- [ ] Pilot flag on, no regressions

---

## Post-Migration Cleanup

- [ ] Add `// REAL ENCRYPTION — AES-GCM-256 via Web Crypto` comment at injection points
- [ ] Update `docs/security/pqc/progress-tracker.md` Stage 2/3 items to reference real crypto
- [ ] Update `public/llms.txt` and `public/llms-full.txt` to confirm PQC is live
- [ ] Remove or archive `docs/security/pqc/` AI-generated scaffolding docs (or mark as superseded)
- [ ] Update README.md security section

---

## Rollback Plan

If issues arise after enabling the pilot:

1. Set `VITE_ENABLE_SECURE_GROUP_PILOT=false` — instantly reverts to baseline NIP-29 groups
2. All existing groups continue working (baseline transport is always available)
3. Secure group messages that were already encrypted remain encrypted (members with the epoch key can still read them)
4. No data loss — epoch keys stored locally via real AES-GCM survive a flag toggle

---

## Quick Reference: What Changes vs What Stays

### Changes (inject real crypto)
- `group-epoch-content.ts` — encode/decode become async, use AES-GCM
- `group-epoch-decrypt.ts` — accepts epochKeyBytes, awaits decode
- `group-epoch-state.ts` — delete 186 lines of hand-rolled SHA-256
- `dm-envelope.ts` — hybrid KEM + AEAD (async)
- `dm-receive-envelope.ts` — KEM decapsulate + AEAD decrypt (async)
- `key-publication.ts` — real ML-KEM-768 keygen
- `envelope-contracts.ts` — add `wrapped_cek`, `wrap_nonce` fields
- `group-transport-secure-ops.ts` — thread epoch key, remove `as any`
- `package.json` — add `@noble/post-quantum`

### Stays Unchanged
- Transport adapter pattern (`group-transport.ts`, `group-transport-secure.ts`)
- Negotiation logic (`negotiation.ts`)
- Adaptive controls (`adaptive-controls.ts`)
- Envelope validation (`envelope-validation.ts`)
- Feature flag system (`secure-pilot-bootstrap`, `group-transport-secure.ts`)
- NIP-EE kind numbers (443, 444, 445, 10051)
- Group commands routing (`group-commands.ts`)
- UI components (badges, banners, settings)
- All existing test scaffolding (updated, not replaced)
- Local state encryption (`group-secure-storage.ts` — already real AES-GCM)
