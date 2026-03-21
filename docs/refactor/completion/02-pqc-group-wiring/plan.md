# WS-02: PQC Group Message Wiring

> **Pillar 3 — "Adversaries will have quantum computers."**
> Communications intercepted today can be decrypted tomorrow.
> Post-quantum cryptography is not a feature — it is a survival requirement.

## Status: NOT STARTED

**Priority**: CRITICAL — Group comms are the 90% use case; currently classical-only
**Effort**: ~120 lines of modifications across 3 files
**Blocks**: 7 verification items (lines 377-383 in progress-tracker.md)
**Dependencies**: None — ML-KEM engine passes 556 tests, all APIs ready

---

## Problem

Group messages (kind 445) — NavCom's primary communication channel — encrypt with AES-GCM-256 using epoch keys. The key derivation and symmetric encryption are classical. ML-KEM-768 is only wired into DM envelopes.

An adversary recording encrypted group traffic today can decrypt every message once a cryptographically relevant quantum computer exists. For an Earth Alliance operator, this is not theoretical — it is the threat model's premise.

The ML-KEM engine exists and is tested. The gap is plumbing: resolving epoch keys from secure storage and threading them through the send/receive path with proper types instead of `as any` casts.

---

## Current State

### What works
- `crypto-provider.ts`: `mlKemKeygen()`, `mlKemEncapsulate()`, `mlKemDecapsulate()` — real @noble/post-quantum operations, 556 tests
- `aesGcmEncrypt()`/`aesGcmDecrypt()` — real WebCrypto AES-GCM-256
- `importAesGcmKey()` — key import from raw bytes
- `epoch-key-manager.ts`: `deriveEpochContentKey(masterKey, groupId, epochId)` → HKDF-derived 32-byte key
- `dm-envelope.ts` / `dm-receive-envelope.ts` — full hybrid KEM+AEAD pipeline for DMs (working reference)
- `group-epoch-content.ts`: `encodeSecureGroupEpochContent()` / `decodeSecureGroupEpochContent()` — accept `epochKeyBytes: Uint8Array`, call real AES-GCM

### What's broken
- `group-transport-secure-ops.ts` line 104: `(input.localState as any)` — unsafe type cast
- `group-transport-secure-ops.ts` line 297: `const projection = localState as any` — unsafe projection cast
- Epoch key resolution: the caller must provide `epochKeyBytes` to `sendSecureGroupMessage()`, but there's no clear call site where `deriveEpochContentKey()` is invoked to produce it
- `group-epoch-state.ts` reportedly has ~186 lines of hand-rolled SHA-256 that should use `crypto-provider.ts`

---

## Architecture: Group Encryption Data Flow

### Current (classical AES-GCM only)
```
Caller provides epochKeyBytes (unknown source)
  → sendSecureGroupMessage(input)
    → encodeSecureGroupEpochContent({epochKeyBytes, plaintext, ...})
      → importAesGcmKey(epochKeyBytes)
      → aesGcmEncrypt(plaintext, key, nonce, ad)
      → Envelope: {v:1, mode:"group-epoch-v1", alg:"aes-256-gcm", ct, nonce, ad, epoch_id}
```

### Target (PQC-hardened key derivation)
```
Group join → ML-KEM encapsulate master secret to each member's PQ pubkey
  → Store master secret in secure storage (PBKDF2 + AES-GCM wrapped, IndexedDB)
  → On send: deriveEpochContentKey(masterSecret, groupId, epochId)
    → HKDF → epochKeyBytes
    → encodeSecureGroupEpochContent({epochKeyBytes, ...})
      → AES-GCM-256 encrypt (unchanged)
      → Envelope: {v:2, mode:"group-epoch-pq-v1", alg:"ml-kem-768-aes256-gcm", ...}
```

### Key difference
The symmetric encryption (AES-GCM-256) stays the same. What changes is HOW the epoch master key is established:
- **Current**: Classical key agreement (unspecified/stubbed)
- **Target**: ML-KEM-768 key encapsulation → HKDF → epoch content key

---

## Implementation Plan

### Task 1: Type-safe projection interfaces

**File**: `src/engine/group-transport-secure-ops.ts`

Replace `as any` casts with proper typed interfaces:

```typescript
interface SecureGroupTransportProjection {
  groupId: string
  epochId: string
  epochKeyBytes: Uint8Array
  members: string[]
  policy: TierPolicy
}
```

**Lines affected**: 104, 297
**Effort**: ~20 lines

### Task 2: Epoch key resolution from secure storage

**File**: `src/engine/group-transport-secure-ops.ts`

Before `sendSecureGroupMessage()` calls `encodeSecureGroupEpochContent()`, resolve the epoch key:

```typescript
// Current (lines 115-118): validates epochKeyBytes is present
if (!input.epochKeyBytes) {
  return {ok: false, error: "missing-epoch-key"}
}

// Add: resolve from secure storage if not provided
const epochKeyBytes = input.epochKeyBytes ?? await resolveEpochKey(input.groupId, input.epochId)
```

Where `resolveEpochKey()`:
1. Loads encrypted master key from IndexedDB (`navcom-keystore`)
2. Unwraps with user's PBKDF2-derived key (already in `key-storage.ts`)
3. Calls `deriveEpochContentKey(masterKey, groupId, epochId)` from `epoch-key-manager.ts`
4. Returns 32-byte `Uint8Array`

**Effort**: ~40 lines (new function + threading)

### Task 3: Reconcile path key resolution

**File**: `src/engine/group-transport-secure-ops.ts`

The `reconcileSecureGroupEvents()` function (line 237) needs the same epoch key for decryption. Thread `resolveEpochKey()` into the receive path:

```typescript
// In reconcileSecureGroupEvents():
const epochKeyBytes = await resolveEpochKey(groupId, event.epochId)
const result = await validateAndDecryptSecureGroupEventContent({
  event,
  expectedEpochId,
  epochKeyBytes,
})
```

**Effort**: ~20 lines

### Task 4: Envelope version bump

**File**: `src/engine/group-epoch-content.ts`

Update envelope metadata to indicate PQC key derivation:

```typescript
// Currently: {v: 1, mode: "group-epoch-v1", alg: "aes-256-gcm"}
// Target:    {v: 2, mode: "group-epoch-pq-v1", alg: "ml-kem-768-hkdf-aes256-gcm"}
```

Backwards compatibility: v1 envelopes continue to decrypt (classical path). v2 envelopes indicate PQC key derivation was used.

**Effort**: ~15 lines

### Task 5: Remove hand-rolled SHA-256 from epoch-state

**File**: `src/engine/group-epoch-state.ts`

Replace ~186 lines of hand-rolled SHA-256 implementation with import from `crypto-provider.ts`:

```typescript
import {sha256} from "src/engine/pqc/crypto-provider"
```

**Effort**: Net -150 lines (removal + import)

---

## What Does NOT Change

- `aesGcmEncrypt()` / `aesGcmDecrypt()` — symmetric encryption stays identical
- `encodeSecureGroupEpochContent()` function signature — already accepts `epochKeyBytes`
- `validateAndDecryptSecureGroupEventContent()` — already accepts `epochKeyBytes`
- DM envelope pipeline — already PQC-wired, no changes needed
- 556 PQC unit tests — should continue passing

---

## Verification Items Unblocked

- [ ] Send in T1 group → message encrypted on wire (verify via relay raw event) (line 377)
- [ ] Receive encrypted in T1 group → decrypts and displays correctly (line 378)
- [ ] Send in T2 group without key → blocked with error message (line 379)
- [ ] Send in T0 group → plaintext (no change from current) (line 380)
- [ ] Receive old-epoch message → decrypts if key available, placeholder if not (line 381)
- [ ] All 556 existing PQC tests still pass (line 382)
- [ ] New integration test: send encrypted → receive decrypted round-trip (line 383)

---

## Test Strategy

1. **Existing**: 556 PQC unit tests must continue passing (regression gate)
2. **New unit test**: `resolveEpochKey()` — mock secure storage, verify HKDF derivation produces correct key
3. **New integration test**: `encodeSecureGroupEpochContent()` → `decodeSecureGroupEpochContent()` round-trip with real ML-KEM-derived epoch key
4. **New test**: Envelope v2 backwards compatibility — v1 envelopes still decrypt

---

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/engine/group-transport-secure-ops.ts` | Type-safe interfaces, key resolution | ~80 |
| `src/engine/group-epoch-content.ts` | Envelope v2 metadata | ~15 |
| `src/engine/group-epoch-state.ts` | Remove hand-rolled SHA-256 | -150 |
| `tests/unit/engine/pqc/group-pqc-wiring.spec.ts` | New integration tests | ~80 |
| **Net** | | **~25 new + 1 test file** |
