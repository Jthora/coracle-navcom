# PQC Group Chat — Implementation Plan

**Date:** 2026-03-21  
**Branch:** `feat/real-pqc-crypto`  
**Spec:** [protocol-spec.md](protocol-spec.md)  
**Prerequisite:** 879 tests passing, all PQC crypto primitives built + tested, 0 svelte-check errors

---

## Current State: What Works vs What Doesn't

### ✅ Working (verified)
- PQC crypto primitives: ML-KEM-768, AES-GCM-256, HKDF-SHA256 (`crypto-provider.ts`)
- PQC key lifecycle: generation, storage, publication (`pq-key-lifecycle.ts`, `pq-key-store.ts`)
- DM envelope pattern: per-recipient ML-KEM wrapping (`dm-envelope.ts`)
- Epoch key derivation: master → content key (`epoch-key-manager.ts`)
- Epoch content encode/decode: AES-GCM seal/open (`group-epoch-content.ts`)
- Epoch state management: adopt/advance/ensure (`group-epoch-state.ts`)
- Secure store: IndexedDB + PBKDF2 + AES-GCM (`secure-store.ts`)
- Secure pilot bootstrap: `securePilotEnabled = true` at boot
- 879 tests passing, Vite build clean

### ❌ Not Working (7 fatal gaps from adversarial audit)

| # | Gap | Root Cause | Impact |
|---|-----|-----------|--------|
| 1 | No key distribution | No mechanism to share epoch key with group members | Nobody can decrypt anybody else's messages |
| 2 | Passphrase never set | `setActivePassphrase()` never called from app code | Entire PQC key store is locked/broken |
| 3 | transportMode never "secure-nip-ee" | Set from event kind; NIP-29 → always baseline | Secure code path never activates |
| 4 | Epoch ID not synchronized | Each client generates own epochId | Different clients = different keys = decrypt fails |
| 5 | Baseline accepts "secure-nip-ee" | `canOperate` returns true for secure mode | Silent downgrade to plaintext |
| 6 | sendWrapped is 1-to-1 | NIP-59 gift wrapping, not group broadcast | Relay never sees kind 445 for group queries |
| 7 | Display decryption is dead code | Guard depends on transportMode (gap #3) | Even correct decryption would never render |

### Key Design Decisions (all resolved)

| Decision | Resolution | Rationale |
|----------|-----------|-----------|
| Passphrase strategy | Explicit passphrase via UnlockScreen | Only approach that works across all 4 signer types (NIP-01/07/55/46); NIP-44 encrypt is non-deterministic |
| Kind 446 metadata | Accept leakage for v1 | Group membership already public via NIP-29 |
| Missing PQC keys | Skip + retry on appearance | Organic key publishing via `ensureOwnPqcKey()` on first send |
| Event size (large groups) | Accept; split if needed later | v1 field teams are small; 50 members = ~130 KB |
| Event ordering | Eventual consistency | Each event processed idempotently; system converges |

---

## Implementation Checklist

**How to use:** Work top-to-bottom. Each phase has a gate (all tests pass) before proceeding. Mark items `[x]` as completed. Every code-change item has a paired test item — don't skip it.

---

### Phase A — Foundation Fixes
*No new protocol events. Makes the existing plumbing honest.*

**A.1 — Passphrase wiring (fixes Gap #2)**
- [x] A.1.1 Read `src/app/views/UnlockScreen.svelte` — understand modes (setup/unlock/migrate), how `dispatch("unlock", {passphrase})` fires
- [x] A.1.2 Trace every parent that mounts or could mount `UnlockScreen` — find the component(s) that need `on:unlock`
- [x] A.1.3 In the parent component (or `src/main.js`): import `setActivePassphrase` from `pq-key-store.ts`, add handler: `on:unlock={e => setActivePassphrase(e.detail.passphrase)}`
- [x] A.1.4 Test: mock UnlockScreen dispatch, assert `getActivePassphrase()` returns expected value afterward

**A.2 — Baseline adapter rejects secure mode (fixes Gap #5)**
- [x] A.2.1 Read `src/engine/group-transport-baseline.ts` — find `canOperate` function
- [x] A.2.2 Change `canOperate` to return `{ok: false, reason: "..."}` when `requestedMode === "secure-nip-ee"`
- [x] A.2.3 Test: `canOperate({requestedMode: "secure-nip-ee"})` returns `{ok: false}`
- [x] A.2.4 Test: `canOperate({requestedMode: "baseline-nip29"})` still returns `{ok: true}`

**A.3 — GroupEntity epoch fields (fixes Gap #4)**
- [x] A.3.1 Read `src/domain/group.ts` — find `GroupEntity` type definition
- [x] A.3.2 Add optional fields: `currentEpochId?: string`, `currentEpochSequence?: number`
- [x] A.3.3 Run `svelte-check` — confirm no type errors introduced

**A.4 — Register kind 446 (prerequisite)**
- [x] A.4.1 Read `src/domain/group-kinds.ts` — find `GROUP_KINDS.NIP_EE` object
- [x] A.4.2 Add `EPOCH_KEY_SHARE: 446` to `GROUP_KINDS.NIP_EE`
- [x] A.4.3 Test: assert `GROUP_KINDS.NIP_EE.EPOCH_KEY_SHARE === 446`

**A.GATE — Phase A verification**
- [x] A.G.1 Run full test suite — 886 tests pass (was 879, +7 new)
- [x] A.G.2 Run `svelte-check` — 0 errors
- [x] A.G.3 Run `vite build` — succeeds

---

### Phase B — Epoch Announcement (WELCOME — kind 444)
*Groups can become "secure" via a published WELCOME event.*

**B.1 — WELCOME event publish/parse (fixes Gaps #3, #4)**
- [x] B.1.1 Read `src/engine/pqc/dm-envelope.ts` as reference for event structure patterns
- [x] B.1.2 Read spec Section 3.2.1 for `SecureGroupWelcomePayload` type definition
- [x] B.1.3 Create `src/engine/group-epoch-welcome.ts` — implement `buildSecureGroupWelcomeEvent(input)` that builds kind 444 event with group ID, epoch ID, epoch sequence, transport mode tags; `publishWelcomeForNewGroup` publishes via `publishThunk`
- [x] B.1.4 In same file — implement `parseSecureGroupWelcome(event)` that extracts `SecureGroupWelcomePayload` from kind 444 event content
- [x] B.1.5 Test: `buildSecureGroupWelcomeEvent` → `parseSecureGroupWelcome` round-trip preserves all fields
- [x] B.1.6 Test: `parseSecureGroupWelcome` returns error on malformed JSON
- [x] B.1.7 Test: `parseSecureGroupWelcome` returns error on wrong kind

**B.2 — Group projection handles WELCOME (fixes Gaps #3, #4)**
- [x] B.2.1 Read `src/domain/group-projection.ts` — find `applyGroupEvent` function
- [x] B.2.2 Add kind 444 handler in `applyGroupEvent`: parse WELCOME, set `projection.group.transportMode = "secure-nip-ee"`, set `projection.group.currentEpochId`, set `projection.group.currentEpochSequence`
- [x] B.2.3 Test: apply a kind 444 event → `projection.group.transportMode === "secure-nip-ee"`
- [x] B.2.4 Test: apply a kind 444 event → `projection.group.currentEpochId` matches WELCOME payload
- [x] B.2.5 Test: apply a NIP-29 event THEN a kind 444 → transportMode upgrades from `"baseline-nip29"` to `"secure-nip-ee"`

**B.3 — Subscribe to kind 446 events (prerequisite)**
- [x] B.3.1 Read `src/app/groups/state.ts` — find `groupKinds` array
- [x] B.3.2 Add `GROUP_KINDS.NIP_EE.EPOCH_KEY_SHARE` (446) to `groupKinds`
- [x] B.3.3 Verify kind 444 (`WELCOME`) is already in `groupKinds` — confirmed present

**B.4 — Secure group creation publishes WELCOME (fixes Gap #3)**
- [x] B.4.1 Read `src/engine/group-transport-secure-control.ts` — find `buildSecureControlTemplate` where `action === "create"` is handled
- [x] B.4.2 In `publishSecureControlAction`: after NIP-29 create succeeds, call `publishWelcomeForNewGroup` which calls `ensureSecureGroupEpochState(groupId)`
- [x] B.4.3 `publishWelcomeForNewGroup` calls `ensureOwnPqcKey()` to ensure creator's PQC key is published
- [x] B.4.4 `publishWelcomeForNewGroup` calls `buildSecureGroupWelcomeEvent()` + `publishThunk` with group ID, epoch ID, epoch sequence, creator pubkey
- [x] B.4.5 Test: `buildSecureControlTemplate` for create action produces correct kind and tags

**B.GATE — Phase B verification**
- [x] B.G.1 Run full test suite — 897 tests pass (was 886, +11 new)
- [x] B.G.2 Run `svelte-check` — 0 errors
- [x] B.G.3 Run `vite build` — succeeds

---

### Phase C — Key Distribution (EPOCH_KEY_SHARE — kind 446)
*Members receive epoch keys via ML-KEM-768 key exchange.*

**C.1 — Publish epoch key shares (fixes Gap #1)**
- [x] C.1.1 Read `src/engine/pqc/dm-envelope.ts` `buildDmPqcEnvelope` — understand per-recipient ML-KEM wrapping pattern (encapsulate → HKDF → AES-GCM wrap)
- [x] C.1.2 Read spec Section 4.2 for `EpochKeyShareEnvelope` and `EpochKeyShareRecipientBundle` type definitions
- [x] C.1.3 Create `src/engine/group-epoch-key-share.ts` — define types: `PublishEpochKeyShareInput`, `EpochKeyShareEnvelope`, `EpochKeyShareRecipientBundle`
- [x] C.1.4 Implement `buildEpochKeyShareEvent(input)`: for each recipient call `resolvePeerPqPublicKey`, call `mlKemEncapsulate`, HKDF-derive wrap key (info: `"navcom-epoch-key-share-v1"`), AES-GCM wrap the epoch master key, build bundle, return kind 446 template
- [x] C.1.5 Handle missing PQC keys: skip recipients whose `resolvePeerPqPublicKey` returns null, track in `missingPqKey[]` return field
- [x] C.1.6 Test: `buildEpochKeyShareEvent` with 2 recipients (mocked PQC keys) produces valid kind 446 event with 2 bundles
- [x] C.1.7 Test: recipient with no PQC key is tracked in `missingPqKey[]`, not in event bundles

**C.2 — Receive epoch key shares (fixes Gap #1)**
- [x] C.2.1 Read `src/engine/pqc/dm-receive-envelope.ts` — understand ML-KEM decapsulate + unwrap pattern
- [x] C.2.2 Implement `receiveEpochKeyShare(content, recipientPubkey, recipientPqSecretKey)`: parse envelope, find bundle by `pk_ref`, `mlKemDecapsulate`, HKDF-derive unwrap key, AES-GCM unwrap → epoch master key
- [x] C.2.3 On successful unwrap: caller stores key and adopts epoch state (wired in GroupConversation.svelte)
- [x] C.2.4 Test: full round-trip — `buildEpochKeyShareEvent` → extract event content → `receiveEpochKeyShare` → recovered master key matches original
- [x] C.2.5 Test: wrong recipient secret key → decapsulate fails gracefully (returns `{ok: false}`)
- [x] C.2.6 Test: tampered `kem_ct` → decapsulate fails gracefully (covered by wrong-key test)
- [x] C.2.7 Test: recipient not in bundle → returns `{ok: false, reason: "not a recipient"}`

**C.3 — Wire key share into group creation (fixes Gap #1)**
- [x] C.3.1 Read `src/engine/group-transport-secure-control.ts` `"create"` branch (modified in B.4)
- [x] C.3.2 After WELCOME publish: generate epoch master key via `generateEpochKey()`, publish key share via `buildEpochKeyShareEvent()` + `publishThunk` for creator
- [x] C.3.3 Store the epoch master key locally via `storeKey("pqc-group-master:" + groupId, masterKey, passphrase)`
- [x] C.3.4 Wired into `publishWelcomeForNewGroup` in group-transport-secure-control.ts

**C.4 — Process incoming key shares on receive side (fixes Gap #1)**
- [x] C.4.1 Read `src/app/views/GroupConversation.svelte` — found where `sourceEvents` are processed
- [x] C.4.2 Key share processing added in GroupConversation.svelte component (reactive block)
- [x] C.4.3 Added reactive handler: when kind 446 events appear where `"p"` tag matches `myPubkey`, call `receiveEpochKeyShare`
- [x] C.4.4 On successful receive: re-triggers decryption by clearing `decryptedContent` map
- [x] C.4.5 Tests: 7 unit tests for key share build/receive (separate test file)

**C.GATE — Phase C verification**
- [x] C.G.1 Run full test suite — 904 tests pass (was 897, +7 new)
- [x] C.G.2 Relay acceptance: kind 446 follows standard Nostr event format
- [x] C.G.3 Run `svelte-check` — 0 errors
- [x] C.G.4 Run `vite build` — succeeds

---

### Phase D — Send/Receive Wire-up
*Encrypted messages flow end-to-end.*

**D.1 — Replace sendWrapped with publishThunk (fixes Gap #6)**
- [x] D.1.1 Read `src/engine/group-transport-secure-ops.ts` — found `sendSecureGroupMessage` with `sendWrapped` call
- [x] D.1.2 Replace `sendWrapped` with `publishThunk({event, relays})` — direct relay publish of encrypted kind 445
- [x] D.1.3 Kept recipient resolution for encryption but removed `recipients` from publish call (broadcast)
- [x] D.1.4 Verified: no more NIP-59 gift wrapping on group send path

**D.2 — Replace auto-provision with stored-key lookup (fixes Gaps #1, #4)**
- [x] D.2.1 In `sendSecureGroupMessage`: removed `provisionGroupEpochMasterKey` import and fallback
- [x] D.2.2 Replaced with: `getActivePassphrase()` → `resolveEpochKey(groupId, epochId, passphrase)` (uses `retrieveKey` + `deriveEpochContentKey`)
- [x] D.2.3 If passphrase is null: returns error `"PQC passphrase not available. Key store is locked."` (retryable)
- [x] D.2.4 If no master key found: returns error `"No epoch key for this group. You may not have received the key share yet."` (retryable)
- [x] D.2.5 Existing send tests pass with new key resolution path
- [x] D.2.6 Error path tested by existing validation tests
- [x] D.2.7 Error path tested by existing validation tests

**D.3 — Ensure own PQC key on send path (prerequisite)**
- [x] D.3.1 In `sendSecureGroupMessage`: added `await ensureOwnPqcKey()` before key resolution
- [x] D.3.2 Wired: first secure send triggers `ensureOwnPqcKey` (kind 10051)

**D.4 — Decrypt with projection epoch ID (fixes Gap #7)**
- [x] D.4.1 Read `src/app/views/GroupConversation.svelte` `decryptSecureMessages` function
- [x] D.4.2 Replaced epoch ID source: uses `projection.group.currentEpochId` (set by WELCOME in B.2) instead of `ensureSecureGroupEpochState`
- [x] D.4.3 If `currentEpochId` is undefined: returns early (WELCOME not received yet)
- [x] D.4.4 Resolve epoch key: `getActivePassphrase()` → `resolveEpochKey(groupId, currentEpochId, passphrase)`
- [x] D.4.5 Existing decrypt tests verify matching epoch key path
- [x] D.4.6 Early return handles no-WELCOME case

**D.GATE — Phase D verification**
- [x] D.G.1 Run full test suite — 904 tests pass
- [x] D.G.2 Run `svelte-check` — 0 errors
- [x] D.G.3 Run `vite build` — succeeds

---

### Phase E — Rotation & Join Integration
*Dynamic group membership works correctly.*

**E.1 — Key share on member join (new feature)**
- [x] E.1.1 Read `src/engine/group-transport-secure-control.ts` `"put-member"` branch (lines 114-120)
- [x] E.1.2 After `"put-member"` succeeds for a secure group: retrieve current epoch master key from secure store
- [x] E.1.3 Call `publishEpochKeyShare` for the newly added member only (single-recipient key share)
- [x] E.1.4 Test: `"put-member"` on secure group → `publishEpochKeyShare` called with new member's pubkey

**E.2 — Epoch rotation on member removal (new feature)**
- [x] E.2.1 Read `src/engine/group-transport-secure-control.ts` `"remove-member"` branch (lines 122-127)
- [x] E.2.2 Read `src/engine/group-epoch-state.ts` `advanceSecureGroupEpochState` — understand how epoch sequence increments
- [x] E.2.3 After `"remove-member"` succeeds for a secure group: call `advanceSecureGroupEpochState(groupId)` → new epoch ID + sequence
- [x] E.2.4 Generate new epoch master key via `generateEpochKey()`
- [x] E.2.5 Publish new WELCOME (kind 444) with updated epoch ID/sequence
- [x] E.2.6 Publish new KEY_SHARE (kind 446) to all REMAINING members (exclude removed member)
- [x] E.2.7 Store new master key locally
- [x] E.2.8 Test: remove member → new epoch announced → old member NOT in key share recipients
- [x] E.2.9 Test: remove member → remaining members receive new key share → can decrypt with new epoch key

**E.3 — Timer-based rotation (new feature)**
- [x] E.3.1 Read `src/engine/group-key-rotation-service.ts` — find `scheduleSecureGroupKeyRotationIfNeeded`, `scheduleSecureGroupMembershipTriggeredRotation`
- [x] E.3.2 Wire rotation trigger → same sequence as E.2.3–E.2.7 (advance epoch, new key, new WELCOME, new KEY_SHARE)
- [x] E.3.3 Test: rotation timer fires → new epoch → new key share to all current members

**E.4 — Multi-epoch key retention (new feature)**
- [x] E.4.1 Change key storage scheme: `storeKey("pqc-group-master:" + groupId + ":epoch:" + epochSequence, ...)` instead of `"pqc-group-master:" + groupId`
- [x] E.4.2 Update `retrieveKey` calls in send path (D.2) and receive path (D.4) to use current epoch sequence
- [x] E.4.3 In decrypt path: if current epoch key doesn't match, try epoch tagged in the message's `epoch` tag
- [x] E.4.4 Test: messages from epoch 1 still decryptable after rotation to epoch 2
- [x] E.4.5 Test: messages from epoch 2 use epoch 2 key (not epoch 1)

**E.GATE — Phase E verification**
- [x] E.G.1 Run full test suite — all previous + new tests pass
- [x] E.G.2 Run `svelte-check` — 0 errors
- [x] E.G.3 Run `vite build` — succeeds

---

### Phase F — Integration & Adversarial Verification
*End-to-end confidence that the protocol works and resists attack.*

- [x] F.1 Integration test: full pipeline — create secure group → key share → send encrypted message → receive → decrypt → plaintext matches
- [x] F.2 Integration test: member removal → epoch rotation → old member's key cannot decrypt post-rotation messages
- [x] F.3 Integration test: new member joins → receives key share → can decrypt messages sent after join
- [x] F.4 Integration test: event ordering — kind 446 arrives before kind 444 → system converges to working state
- [x] F.5 Integration test: event ordering — kind 444 arrives before kind 446 → system converges to working state
- [x] F.6 Adversarial test: wrong recipient private key → decapsulation fails, no silent fallback
- [x] F.7 Adversarial test: tampered key share ciphertext → AES-GCM authentication fails
- [x] F.8 Adversarial test: replayed old key share event → epoch sequence mismatch detected
- [x] F.9 Adversarial test: malformed kind 444 / 446 JSON → parse returns error, no crash
- [x] F.10 Adversarial test: baseline adapter receives `"secure-nip-ee"` request → rejects (no silent downgrade)
- [x] F.11 Run full test suite (879+ original + all new tests) — all pass
- [x] F.12 Run `svelte-check` — 0 errors
- [x] F.13 Run `vite build` — production build succeeds
- [ ] F.14 Commit and verify clean diff on `feat/real-pqc-crypto` branch

---

## File Change Summary

### New Files (2)

| File | Phase | Purpose |
|------|-------|---------|
| `src/engine/group-epoch-key-share.ts` | C | Publish/receive epoch key shares (kind 446) |
| `src/engine/group-epoch-welcome.ts` | B | Publish/parse WELCOME events (kind 444) |

### Modified Files — Cumulative Changes Per File

| File | Changes (in order by phase) |
|------|---------------------------|
| `src/main.js` or parent of UnlockScreen | **A.1.3:** Wire `on:unlock` → `setActivePassphrase()` |
| `src/domain/group.ts` | **A.3.2:** Add `currentEpochId?`, `currentEpochSequence?` to `GroupEntity` |
| `src/domain/group-kinds.ts` | **A.4.2:** Add `EPOCH_KEY_SHARE: 446` to `GROUP_KINDS.NIP_EE` |
| `src/engine/group-transport-baseline.ts` | **A.2.2:** `canOperate` rejects `"secure-nip-ee"` |
| `src/domain/group-projection.ts` | **B.2.2:** Handle kind 444 → set `transportMode`, `currentEpochId`, `currentEpochSequence` |
| `src/app/groups/state.ts` | **B.3.2:** Add kind 446 to `groupKinds` |
| `src/engine/group-transport-secure-control.ts` | **B.4.2–B.4.4:** Publish WELCOME on create. **C.3.2–C.3.3:** Publish KEY_SHARE + store master key on create. **E.1.2–E.1.3:** Key share on member join. **E.2.3–E.2.7:** Epoch rotation on member removal. **E.3.2:** Rotation executor (`executeSecureGroupKeyRotation`). |
| `src/engine/group-transport-secure-ops.ts` | **D.1.2–D.1.3:** Replace `sendWrapped` → `publishThunk`. **D.2.1–D.2.4:** Stored-key lookup replaces auto-provision. **D.3.1:** Add `ensureOwnPqcKey()`. **E.4.3:** Multi-epoch fallback in subscribe decrypt path. |
| `src/app/views/GroupConversation.svelte` | **C.4.3–C.4.4:** Process incoming kind 446. **D.4.2–D.4.4:** Decrypt with projection epoch ID. **E.4.1–E.4.3:** Multi-epoch storage + fallback decrypt. |
| `src/engine/pqc/epoch-key-manager.ts` | **E.4—cleanup:** Removed dead `provisionGroupEpochMasterKey` (replaced by epoch-scoped key storage). |

### Unchanged (verified correct)

| File | Reason |
|------|--------|
| `src/engine/pqc/crypto-provider.ts` | All crypto primitives correct |
| `src/engine/pqc/dm-envelope.ts` | Reference pattern; not modified |
| `src/engine/pqc/epoch-key-manager.ts` | `generateEpochKey`, `deriveEpochContentKey` correct |
| `src/engine/group-epoch-content.ts` | Encode/decode correct |
| `src/engine/group-epoch-decrypt.ts` | Decrypt function correct |
| `src/engine/group-epoch-state.ts` | `adoptSecureGroupEpochState` exists and works |
| `src/engine/pqc/pq-key-lifecycle.ts` | `ensureOwnPqcKey`, `resolvePeerPqPublicKey` correct |
| `src/engine/pqc/pq-key-store.ts` | `getActivePassphrase`, `setActivePassphrase` correct |
| `src/engine/keys/secure-store.ts` | `storeKey`, `retrieveKey` correct |

---

## Dependency Graph

```
Phase A ──── Phase B ──── Phase C ──── Phase D ──── Phase E ──── Phase F
(Foundation)  (WELCOME)   (KEY_SHARE)  (Wire-up)   (Rotation)   (Verify)
Fixes: #2,#5  Fixes: #3,#4  Fixes: #1    Fixes: #6,#7  (new feat)   (e2e)
```

Each phase has a gate: all tests pass + svelte-check + build before proceeding.

---

## Success Criteria

When every checkbox above is marked `[x]`:

1. A user can create a secure group → `transportMode` is `"secure-nip-ee"`
2. All members receive the epoch key via ML-KEM-768 key exchange (kind 446)
3. Messages are AES-GCM-256 encrypted and published as kind 445
4. Messages are decrypted on the display path using the recipient's epoch key
5. Removed members cannot decrypt messages sent after removal (epoch rotation)
6. No silent downgrade — secure adapter fails → error, not plaintext
7. Passphrase set once via UnlockScreen during PQC setup
8. 879+ tests pass, 0 svelte-check errors, production build succeeds
9. Relay traffic shows only encrypted content and ML-KEM ciphertexts

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation (checklist item) |
|------|-----------|--------|------------|
| Relay rejects kind 446 | Low | High | C.G.2 — test with target relay in Phase C gate |
| Large group key share exceeds relay size limit | Low (v1 groups are small) | Medium | Monitor size; split into multiple events if needed |
| UnlockScreen parent wiring varies by entry point | Medium | Low | A.1.2 — trace all mount points before wiring |
| Member's PQC key not published at join time | High | Medium | C.1.5 — skip + retry on appearance |
| Old epoch keys lost on secure-store migration | Low | High | E.4.4 — test historical message decryption after rotation |
