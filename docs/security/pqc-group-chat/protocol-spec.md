# PQC Group Chat Protocol Specification

**Status:** Draft v2 — All open questions resolved  
**Date:** 2026-03-21 (updated)  
**Branch:** `feat/real-pqc-crypto`  
**Prerequisite:** This spec builds on primitives already implemented and tested (879 tests passing).

---

## 0. WHY THIS EXISTS

NavCom is the Navigation & Communications system for the Earth Alliance — a sovereign, decentralized operational force that cannot rely on and cannot trust commercial infrastructure controlled by third parties.

Group chat is the primary coordination mechanism for field operations. Every message sent today is **plaintext kind 445** on relays. Any passive relay observer (Adversary A1) can read every message. Any future quantum-capable adversary (A6) can retroactively break classical encryption on anything harvested today.

This spec exists because:

1. **Harvest-now-decrypt-later is real.** Communications intercepted today will be decryptable by quantum computers. Every day without PQC is another day of archived plaintext.
2. **Silent downgrade is unacceptable.** The current system silently falls back to plaintext when the secure adapter can't operate. Operators believe they're communicating securely. They are not.
3. **Group key distribution is the missing protocol layer.** The cryptographic primitives (ML-KEM-768, AES-GCM-256, HKDF-SHA256) are built and tested. What's missing is the protocol that distributes keys, coordinates epochs, and ensures every group member can encrypt and decrypt.

### Threat Model Reference

| Adversary | Capability | This protocol mitigates |
|-----------|-----------|------------------------|
| A1: Passive relay observer | Read content | Yes — AES-GCM-256 encryption |
| A2: Active relay operator | Reorder, delay, drop, replay | Partial — epoch tags, AD binding |
| A4: Malicious group member | Leak plaintext, attempt downgrades | Yes — epoch rotation on removal |
| A6: Future quantum-capable | Break classical crypto retroactively | Yes — ML-KEM-768 key exchange |

---

## 1. PROTOCOL OVERVIEW

### 1.1 Design Principles

1. **No new crypto primitives.** Everything uses existing, tested functions from `crypto-provider.ts`.
2. **DM envelope pattern as template.** Group key distribution reuses the per-recipient ML-KEM wrapping pattern proven in `dm-envelope.ts`.
3. **Direct publish, not gift wrap.** Group messages publish encrypted kind 445 events directly to relays (like baseline already does), not via NIP-59 `sendWrapped`.
4. **Epoch announced by creator.** The group creator publishes the epoch as a signed event. Members adopt it via `adoptSecureGroupEpochState`.
5. **Key share event for distribution.** A new kind 446 event carries per-member ML-KEM-wrapped copies of the epoch master key.
6. **Explicit passphrase via UnlockScreen.** The existing UnlockScreen UI prompts for a passphrase once during PQC setup. The passphrase is wired to `setActivePassphrase()` and used to protect the local PQC key store. This is the only approach that works across ALL signer types (NIP-01, NIP-07, NIP-55, NIP-46).

### 1.2 Event Kinds Used

| Kind | Name | Purpose | Existing? |
|------|------|---------|-----------|
| 445 | `GROUP_EVENT` | Encrypted group message | Yes — currently plaintext |
| 444 | `WELCOME` | Group metadata + epoch announcement | Defined, not used |
| 443 | `KEY_PACKAGE` | Member's PQC public key for group context | Defined, not used |
| **446** | `EPOCH_KEY_SHARE` | Per-member wrapped epoch master key | **NEW** |
| 10051 | `KEY_PACKAGE_RELAYS` | User's PQC public key (replaceable) | Yes — `ensureOwnPqcKey` |

### 1.3 Protocol Phases

```
Phase 1: IDENTITY    — Each user publishes ML-KEM-768 public key (kind 10051)
Phase 2: GROUP INIT  — Creator generates epoch + master key, publishes WELCOME (kind 444)
Phase 3: KEY SHARE   — Creator wraps master key per-member, publishes KEY_SHARE (kind 446)  
Phase 4: MESSAGING   — Members encrypt with epoch-derived key, publish kind 445
Phase 5: RECEIVING   — Members decrypt kind 445 using their copy of epoch key
Phase 6: ROTATION    — On member removal or timer: advance epoch, re-share key
```

---

## 2. PHASE 1: IDENTITY — PQC KEY PUBLICATION

### 2.1 What Already Works

- `ensureOwnPqcKey()` in `pq-key-lifecycle.ts` — lazily generates ML-KEM-768 keypair, stores locally, publishes kind 10051
- `resolvePeerPqPublicKey(peerPubkey)` — queries kind 10051 from relays, returns `Uint8Array` public key
- `savePqcKeyPair()` / `loadPqcKeyPair()` in `pq-key-store.ts` — local storage with secure-store encryption

### 2.2 What Must Change

**Problem:** `savePqcKeyPair` depends on `activePassphrase` which is never set.

**Solution (RESOLVED):** Use explicit passphrase via the existing `UnlockScreen.svelte` component.

#### 2.2.1 Why Explicit Passphrase (Not Auto-Derived)

Analysis of all 4 signer types showed that auto-derivation is impossible:

| Signer Type | Has raw key? | Can auto-derive? | Notes |
|-------------|-------------|-------------------|-------|
| NIP-01 (self-custody) | Yes | Theoretically | Has nsec, but fragile coupling |
| NIP-07 (browser ext) | No | No | Extension holds key |
| NIP-55 (Android) | No | No | Android signer holds key |
| NIP-46 (remote bunker) | No | No | Remote server holds key |

Additionally, NIP-44 `encrypt()` is NOT deterministic — each call produces different ciphertext due to a random nonce. There is no reliable signer-agnostic deterministic operation.

**Decision:** Explicit passphrase is the single correct answer. It works universally across all signer types.

#### 2.2.2 Wiring: UnlockScreen → setActivePassphrase

`UnlockScreen.svelte` already:
- Detects setup/unlock/migrate modes
- Prompts user for passphrase
- Dispatches `dispatch("unlock", {passphrase})` event

**What's missing:** The parent component that mounts `UnlockScreen` must listen for the `unlock` event and call `setActivePassphrase(passphrase)`.

**File:** `src/main.js` (or the parent Svelte component that mounts UnlockScreen)

```typescript
// When UnlockScreen dispatches unlock:
import { setActivePassphrase } from "./engine/pqc/pq-key-store"

function handleUnlock(event) {
  const { passphrase } = event.detail
  setActivePassphrase(passphrase)
}
```

**File:** `src/engine/pqc/pq-key-store.ts` — no changes needed. `setActivePassphrase` and `getActivePassphrase` already work.

**No new files needed.** The previously planned `identity-passphrase.ts` is eliminated.

#### 2.2.3 Wiring: Ensure Own PQC Key on First Secure Send

Already works via `ensureOwnPqcKey()`. Just needs to be called from the secure group send path (it currently is only called from DM path).

---

## 3. PHASE 2: GROUP INITIALIZATION — EPOCH ANNOUNCEMENT

### 3.1 Current State

- Groups are created via NIP-29 control events (kind 9007)
- `createProjectionFromEvent` sets `transportMode` based on event kind
- NIP-29 events → `transportMode: "baseline-nip29"` (always)
- No mechanism to create a secure group or upgrade an existing group

### 3.2 Design: Secure Group Creation

When a user creates a group and requests secure mode, the system must:

1. Publish NIP-29 metadata (kind 39000) for relay compatibility — the group "exists" in NIP-29 terms
2. Publish a **WELCOME event** (kind 444) that announces:
   - The group ID
   - The current epoch ID and sequence
   - The transport mode (`"secure-nip-ee"`)
   - The creator's PQC public key reference
3. The WELCOME event's kind (444) causes `createProjectionFromEvent` to set `transportMode: "secure-nip-ee"` (already implemented in `getProtocolForKind`)

#### 3.2.1 WELCOME Event Structure (Kind 444)

```typescript
export type SecureGroupWelcomePayload = {
  v: 1
  group_id: string
  epoch_id: string
  epoch_sequence: number
  transport_mode: "secure-nip-ee"
  creator_pubkey: string
  creator_pq_key_id: string   // references kind 10051 "d" tag
  created_at: number
}
```

**Nostr Event:**
```
kind: 444
content: JSON.stringify(SecureGroupWelcomePayload)
tags: [
  ["h", groupId],
  ["d", groupId],           // replaceable per group
  ["epoch", epochId],
  ["epoch_seq", "1"],
  ["transport", "secure-nip-ee"]
]
```

#### 3.2.2 New Function: `publishSecureGroupWelcome`

**File:** `src/engine/group-epoch-welcome.ts` (NEW)

```typescript
export async function publishSecureGroupWelcome(input: {
  groupId: string
  epochId: string
  epochSequence: number
  creatorPubkey: string
  creatorPqKeyId: string
}): Promise<GroupTransportResult<unknown>>
```

**Implementation:**
1. Build the WELCOME payload
2. Publish via `publishThunk` to group relays
3. This event is replaceable (has `d` tag = groupId), so updates overwrite

#### 3.2.3 Modification: `buildSecureControlTemplate` in `group-transport-secure-control.ts`

Currently the secure adapter's `publishControlAction` for `action === "create"` just calls `buildGroupCreateTemplate` (NIP-29 kind 9007). It must ALSO:

1. Generate epoch state: `ensureSecureGroupEpochState(groupId)`
2. Ensure own PQC key: `ensureOwnPqcKey()`
3. Publish WELCOME: `publishSecureGroupWelcome({...})`
4. Generate and distribute epoch master key: → Phase 3

### 3.3 Modification: Group Projection Transport Mode

**Problem:** `createProjectionFromEvent` derives `transportMode` from the kind of the FIRST event seen. If the NIP-29 metadata (kind 39000) arrives before the WELCOME (kind 444), the group is permanently `"baseline-nip29"`.

**Solution:** `applyGroupEvent` must update `transportMode` when a WELCOME event is applied.

**File:** `src/domain/group-projection.ts` — modify `applyGroupEvent`:

```typescript
// After the existing metadata handling:
if (event.kind === GROUP_KINDS.NIP_EE.WELCOME) {
  projection.group.transportMode = "secure-nip-ee"
  projection.group.protocol = "nip-ee"
  // Parse WELCOME content for epoch info
  try {
    const welcome = JSON.parse(event.content) as SecureGroupWelcomePayload
    projection.group.currentEpochId = welcome.epoch_id
    projection.group.currentEpochSequence = welcome.epoch_sequence
  } catch { /* ignore malformed */ }
}
```

**Requires:** Adding `currentEpochId?: string` and `currentEpochSequence?: number` to `GroupEntity` type.

### 3.4 Fetching WELCOME on Group Hydration

**File:** `src/app/groups/state.ts` — `groupKinds` array already includes `GROUP_KINDS.NIP_EE.WELCOME` (kind 444). No changes needed. When a WELCOME event arrives from the relay, it flows through `deriveEvents → buildGroupProjection → applyGroupEvent` and sets `transportMode`.

---

## 4. PHASE 3: KEY DISTRIBUTION — EPOCH KEY SHARE

This is the core missing protocol. When a group is created (or when a new member joins, or when a key rotation occurs), each member must receive a copy of the epoch master key, wrapped so that only they can unwrap it.

### 4.1 Design

The **EPOCH_KEY_SHARE** event (kind 446) contains:
- The epoch ID it distributes keys for
- An array of per-member wrapped key bundles
- Each bundle is encrypted using that member's ML-KEM-768 public key (from their kind 10051)

This is the **exact same per-recipient wrapping pattern** used by `buildDmPqcEnvelope` in `dm-envelope.ts`.

### 4.2 Key Share Envelope Structure

```typescript
export type EpochKeyShareEnvelope = {
  v: 1
  group_id: string
  epoch_id: string
  epoch_sequence: number
  shares: EpochKeyShareRecipientBundle[]
  created_at: number
}

export type EpochKeyShareRecipientBundle = {
  /** Recipient's Nostr pubkey */
  pk_ref: string
  /** ML-KEM-768 algorithm identifier */
  kem_alg: "mlkem768"
  /** Base64-encoded ML-KEM ciphertext (1088 bytes) */
  kem_ct: string
  /** Base64-encoded AES-GCM wrapped epoch master key */
  wrapped_key: string
  /** Base64-encoded AES-GCM nonce for the wrap operation */
  wrap_nonce: string
  /** HMAC-SHA256 confirmation tag binding KEM ciphertext to associated data (optional for backward compat) */
  confirmation_tag?: string
}
```

**Per-recipient wrapping procedure** (same as DM envelope):
1. Look up recipient's ML-KEM-768 public key via `resolvePeerPqPublicKey(recipientPubkey)`
2. `mlKemEncapsulate(recipientPqPubKey)` → `{cipherText, sharedSecret}`
3. `hkdfDeriveKey(sharedSecret, salt, info, 32)` → `wrapKey` (info = `"navcom-epoch-key-share-v1"`)
4. `aesGcmEncrypt(epochMasterKey, importAesGcmKey(wrapKey), randomNonce())` → `wrappedKey`
5. Compute confirmation tag: `HMAC-SHA256(wrapKey, kem_ct || ad_bytes)` → `confirmationTag`
6. Bundle: `{pk_ref, kem_alg: "mlkem768", kem_ct: b64(cipherText), wrapped_key: b64(wrappedKey), wrap_nonce: b64(nonce), confirmation_tag: b64(confirmationTag)}`

#### 4.2.1 Key Confirmation Tag

Each recipient bundle includes a **confirmation tag** — an HMAC-SHA256 computed over the KEM ciphertext concatenated with the associated data, keyed by the HKDF-derived wrap key.

**Purpose:** Mutual key confirmation. The decrypting party recomputes the tag and verifies it matches. This detects:
- KEM ciphertext substitution (active relay attacks)
- Truncated or corrupted ciphertext
- Mismatched associated data (wrong sender/group/epoch)

**Computation (sender):**
```
tagInput  = kem_ct_bytes || ad_bytes
tag       = HMAC-SHA256(wrapKey, tagInput)
```

**Verification (recipient):**
```
recomputed = HMAC-SHA256(wrapKey, kem_ct_bytes || ad_bytes)
if (!constantTimeEqual(recomputed, received_tag)):
    reject envelope with DM_ENVELOPE_AD_BINDING_MISMATCH
```

The tag is **optional for backward compatibility** — old envelopes without `confirmation_tag` are accepted. New envelopes always include it. Verification uses constant-time comparison to prevent timing side channels.

**Implementation:** `dm-envelope.ts` (sender), `dm-receive-envelope.ts` (recipient), `envelope-contracts.ts` (type)

**Nostr Event:**
```
kind: 446
content: JSON.stringify(EpochKeyShareEnvelope)
tags: [
  ["h", groupId],
  ["epoch", epochId],
  ["epoch_seq", String(epochSequence)],
  // One "p" tag per recipient for relay filtering
  ["p", recipientPubkey1],
  ["p", recipientPubkey2],
  ...
]
```

### 4.3 New Function: `publishEpochKeyShare`

**File:** `src/engine/group-epoch-key-share.ts` (NEW)

```typescript
export type PublishEpochKeyShareInput = {
  groupId: string
  epochId: string
  epochSequence: number
  epochMasterKey: Uint8Array
  recipients: string[]  // Nostr pubkeys of group members
}

export type PublishEpochKeyShareResult = GroupTransportResult<{
  sharedTo: string[]     // pubkeys that received a share
  missingPqKey: string[] // pubkeys whose PQC public key couldn't be resolved
}>

export async function publishEpochKeyShare(
  input: PublishEpochKeyShareInput,
): Promise<PublishEpochKeyShareResult>
```

**Implementation:**
1. For each recipient: `resolvePeerPqPublicKey(pubkey)` — skip if unavailable (track in `missingPqKey`)
2. For each resolved recipient: wrap epoch master key using ML-KEM encapsulate + HKDF + AES-GCM (same as DM envelope pattern)
3. Build `EpochKeyShareEnvelope`
4. Publish via `publishThunk` with kind 446 to group relays

### 4.4 New Function: `receiveEpochKeyShare`

**File:** `src/engine/group-epoch-key-share.ts`

```typescript
export type ReceiveEpochKeyShareResult =
  | { ok: true; epochId: string; epochSequence: number; masterKey: Uint8Array }
  | { ok: false; reason: string }

export async function receiveEpochKeyShare(
  content: string,
  recipientPubkey: string,
  recipientPqSecretKey: Uint8Array,
): Promise<ReceiveEpochKeyShareResult>
```

**Implementation:**
1. Parse `EpochKeyShareEnvelope` from content
2. Find the `EpochKeyShareRecipientBundle` where `pk_ref === recipientPubkey`
3. `base64ToBytes(bundle.kem_ct)` → `kemCiphertext`
4. `mlKemDecapsulate(kemCiphertext, recipientPqSecretKey)` → `sharedSecret`
5. `hkdfDeriveKey(sharedSecret, salt, info, 32)` → `wrapKey`
6. `aesGcmDecrypt(base64ToBytes(bundle.wrapped_key), importAesGcmKey(wrapKey), base64ToBytes(bundle.wrap_nonce))` → `epochMasterKey`
7. Store master key: `storeKey("pqc-group-master:" + groupId, epochMasterKey, passphrase, "pqc-secret", {groupId, epochId})`
8. Adopt epoch: `adoptSecureGroupEpochState(groupId, {epochId, sequence: epochSequence})`

---

## 5. PHASE 4: MESSAGING — ENCRYPTED SEND

### 5.1 Current State

- `sendSecureGroupMessage` in `group-transport-secure-ops.ts` already encrypts with `encodeSecureGroupEpochContent`
- It auto-provisions a local-only epoch key when none exists (Gap 1 from the audit)
- It uses `sendWrapped` (NIP-59 gift wrapping) which is wrong for groups

### 5.2 Required Changes

#### 5.2.1 Replace `sendWrapped` with `publishThunk`

**File:** `src/engine/group-transport-secure-ops.ts` — modify `sendSecureGroupMessage`

**Before** (current):
```typescript
const result = await sendWrapped({
  delay: input.delay || 0,
  recipients: recipientResolution.eligibleRecipients,
  event: makeEvent(GROUP_KINDS.NIP_EE.GROUP_EVENT, { ... }),
})
```

**After:**
```typescript
const result = await publishThunk({
  delay: input.delay || 0,
  event: makeEvent(GROUP_KINDS.NIP_EE.GROUP_EVENT, {
    content: encodedContent.content,
    tags: [...],
  }),
  relays: resolveGroupRelays(input.groupId),
})
```

This publishes the encrypted kind 445 event directly to relays — the same way baseline currently publishes plaintext kind 445. The difference is `content` is now `JSON.stringify(SecureGroupEpochContentEnvelope)` instead of plaintext.

#### 5.2.2 Epoch Key Resolution: Use Stored Key, Not Provision

**Current behavior:** If no epoch key exists, `provisionGroupEpochMasterKey` generates a new one locally. This is wrong — only the group creator/admin should generate epoch keys.

**New behavior:**
1. Look up stored epoch master key via `retrieveKey("pqc-group-master:" + groupId, passphrase)`
2. If found, derive epoch content key via `deriveEpochContentKey(masterKey, groupId, epochState.epochId)`
3. If NOT found, return an error telling the user they haven't received the group key yet (instead of silently generating a useless local key)

```typescript
// In sendSecureGroupMessage, replace the auto-provision logic:
if (!input.epochKeyBytes) {
  const passphrase = getActivePassphrase()
  if (!passphrase) {
    return errTransportResult(
      "GROUP_TRANSPORT_VALIDATION_FAILED",
      "PQC passphrase not available. Key store is locked.",
      true,
    )
  }

  const masterKey = await retrieveKey(`pqc-group-master:${input.groupId}`, passphrase)
  if (!masterKey) {
    return errTransportResult(
      "GROUP_TRANSPORT_VALIDATION_FAILED",
      "No epoch key for this group. You may not have received the key share yet.",
      true, // retryable — key share may arrive
    )
  }

  const epochKey = await deriveEpochContentKey(masterKey, input.groupId, epochState.epochId)
  input = { ...input, epochKeyBytes: epochKey }
}
```

#### 5.2.3 Ensure Own PQC Key Before First Secure Send

Add to `sendSecureGroupMessage`, before key resolution:

```typescript
await ensureOwnPqcKey()
```

This ensures the sender's ML-KEM public key is published (kind 10051) so that future epoch key shares can be wrapped for them.

---

## 6. PHASE 5: RECEIVING — DECRYPTED DISPLAY

### 6.1 Current State

- `GroupConversation.svelte` has `decryptSecureMessages()` that calls `validateAndDecryptSecureGroupEventContent`
- But the guard `projection?.group.transportMode === "secure-nip-ee"` is never true
- Once Phase 2 WELCOME events flow and `applyGroupEvent` updates `transportMode`, the guard will become true

### 6.2 Required Changes

#### 6.2.1 Process Kind 446 (Key Share) Events

When a kind 446 event arrives for the current user, the system must:
1. Call `receiveEpochKeyShare(event.content, myPubkey, myPqSecretKey)`
2. Store the resulting master key in secure store
3. Adopt the epoch state
4. Re-trigger decryption of any previously-undecryptable messages

**Integration point:** `applyGroupEvent` in `group-projection.ts` handles all incoming group events. Add kind 446 handling that triggers the key receive flow.

Alternatively, a reactive store subscription watches for kind 446 events in the group's `sourceEvents` and processes them asynchronously.

#### 6.2.2 New Function: `processIncomingKeyShares`

**File:** `src/engine/group-epoch-key-share.ts`

```typescript
export async function processIncomingKeyShares(
  events: TrustedEvent[],
  myPubkey: string,
): Promise<{processed: number; failed: number}>
```

**Called from:** A new reactive block in `GroupConversation.svelte` or from `state.ts` when group events update.

#### 6.2.3 Fix the Decryption Flow

With transportMode now correctly set by WELCOME events, the existing decryption in `GroupConversation.svelte` will trigger. But it needs one fix:

**Current:** Resolves epoch key from `ensureSecureGroupEpochState` which may have a locally-generated (wrong) epoch ID.

**Fix:** Read epoch ID from `projection.group.currentEpochId` (set by WELCOME event) instead of from `ensureSecureGroupEpochState`:

```typescript
async function decryptSecureMessages(msgs: typeof messages, gid: string) {
  // ...
  const epochId = projection?.group.currentEpochId
  if (!epochId) return  // No WELCOME received yet

  const epochKey = await resolveEpochKey(gid, epochId, passphrase)
  // ...
}
```

---

## 7. PHASE 6: KEY ROTATION

### 7.1 When to Rotate

| Trigger | Action |
|---------|--------|
| Member removed | Mandatory rotation — removed member must not decrypt future messages |
| Timer (configurable, default 7 days) | Proactive rotation — limits exposure window |
| Admin-initiated | Manual rotation via UI |
| Compromise suspected | Emergency rotation |

### 7.2 Rotation Procedure

1. Admin calls `advanceSecureGroupEpochState(groupId)` — increments epoch sequence, generates new epoch ID
2. Admin generates new epoch master key: `generateEpochKey()` (32 random bytes)
3. Admin publishes updated WELCOME (kind 444) with new epoch ID/sequence
4. Admin publishes new KEY_SHARE (kind 446) to all CURRENT members (excluding removed member)
5. Admin stores new master key locally
6. Messages sent after rotation use new epoch key
7. Messages received with old epoch tag can still be decrypted if old key is retained locally

### 7.3 Existing Infrastructure

- `advanceSecureGroupEpochState` — already implemented, increments sequence
- `scheduleSecureGroupKeyRotationIfNeeded` — already exists in `group-key-rotation-service.ts`
- `scheduleSecureGroupMembershipTriggeredRotation` — already exists, triggered on member removal
- `collectGroupMembershipRemovalPubkeys` — already identifies removed members for wrap exclusion

### 7.4 Multi-Epoch Key Retention

Recipients should retain old epoch keys to decrypt historical messages. The secure store keying scheme supports this:
- Key ID: `pqc-group-master:${groupId}:epoch:${epochSequence}` (add epoch sequence to key ID)
- Decryption tries: current epoch first, then falls back to the epoch tagged in the message

---

## 8. SILENT DOWNGRADE PREVENTION

### 8.1 Current Problem

The baseline adapter's `canOperate` returns `ok: true` for `requestedMode === "secure-nip-ee"`. This means when the secure adapter fails (missing key, etc.), the system silently sends plaintext. The operator believes the message is encrypted. It is not.

### 8.2 Solution

**File:** `src/engine/group-transport-baseline.ts` — modify `canOperate`:

```typescript
canOperate: ({requestedMode}) => ({
  ok: requestedMode === "baseline-nip29",
  reason: requestedMode === "baseline-nip29"
    ? undefined
    : "Baseline adapter does not handle secure-nip-ee. Use the secure adapter.",
}),
```

This ensures:
- If `requestedMode === "secure-nip-ee"` and the secure adapter fails → **error returned to UI** instead of silent plaintext
- Operators see a clear message: "Cannot send securely — missing group key" (or similar)
- Tier 1 groups can optionally confirm downgrade (existing `downgradeConfirmed` mechanism)

---

## 8A. SEALED METADATA — PREVENTING TAG LEAKAGE

### 8A.1 Problem

Operationally-sensitive metadata tags — `msg-type`, `location`, `g` (geohash), `priority` — are sent as **plaintext tags** on Nostr events via `extraTags`. Even when message content is encrypted, a relay observer can see:
- What type of message was sent (alert, sitrep, check-in, spotrep)
- Exact geographic coordinates and geohash of the sender
- Alert priority levels

This partially defeats the purpose of end-to-end encryption.

### 8A.2 Solution: Sealed Metadata Envelope

Instead of placing sensitive tags on the event, seal them inside the encrypted content body using a structured JSON envelope:

```typescript
type SealedMetaEnvelope = {
  text: string        // Original plaintext message content
  meta: {
    type?: string     // msg-type value (check-in, alert, sitrep, spotrep)
    location?: string // "lat,lng" coordinates
    geohash?: string  // Geohash from "g" tag
    priority?: string // Alert priority level
  }
}
```

**Send path** (`group-transport-secure-ops.ts`):
1. `extractSealedMeta(extraTags)` splits tags into sensitive metadata and remaining tags
2. `buildSealedContent(plaintext, meta)` wraps text + metadata into sealed JSON
3. The sealed JSON string is passed to `encodeSecureGroupEpochContent()` as the plaintext
4. Only non-sensitive tags (e.g., `pqc`, `pqc_alg`) remain as plaintext event tags

**Receive path** (`GroupConversation.svelte`):
1. `validateAndDecryptSecureGroupEventContent()` returns the decrypted string
2. `parseSealedContent(decrypted)` detects whether it's sealed (JSON with `text` + `meta`) or old-format (plain text)
3. `sealedMetaToTags(meta)` converts sealed metadata back to event tags
4. Tags are injected into `msg.tags` for UI rendering compatibility (marker derivation, SitrepCard, etc.)

### 8A.3 Backward Compatibility

- **Old messages** (pre-sealing): Decrypted content is plain text, not JSON. `parseSealedContent()` detects this and returns `{text: decrypted, meta: {}}`. Existing tags on the event are used as before.
- **New messages**: Decrypted content is `SealedMetaEnvelope` JSON. Metadata is extracted and re-injected as tags.
- **Mixed conversation**: Both formats coexist transparently. No version negotiation needed.
- **No metadata**: If a message has no sensitive tags, `buildSealedContent()` returns the plain text (no wrapping). This avoids envelope overhead for simple messages.

### 8A.4 Tag Classification

| Tag | Sealed? | Reason |
|-----|---------|--------|
| `msg-type` | Yes | Reveals operational intent |
| `location` | Yes | Reveals geographic position |
| `g` | Yes | Reveals approximate area |
| `priority` | Yes | Reveals urgency/threat level |
| `h` | No | Group ID — already public |
| `pqc` | No | Crypto mode — not sensitive |
| `pqc_alg` | No | Algorithm choice — not sensitive |
| `client` | No | Client identifier — not sensitive |
| `epoch` | No | Epoch reference — needed for decryption routing |

### 8A.5 Implementation Files

- `src/engine/group-epoch-content.ts` — `extractSealedMeta()`, `buildSealedContent()`, `parseSealedContent()`, `sealedMetaToTags()`
- `src/engine/group-transport-secure-ops.ts` — Calls `extractSealedMeta()` + `buildSealedContent()` in send path
- `src/app/views/GroupConversation.svelte` — Calls `parseSealedContent()` + `sealedMetaToTags()` in decrypt path

---

## 9. TRANSPORT MODE LIFECYCLE

### 9.1 How a Group Becomes Secure

```
1. Creator clicks "Create Secure Group" (UI)
2. System publishes kind 9007 (NIP-29 CREATE_GROUP) — group exists on relay
3. System publishes kind 444 (WELCOME) — announces epoch + secure mode
4. System publishes kind 446 (KEY_SHARE) — wraps epoch key for initial members
5. Group projection receives kind 444 → transportMode = "secure-nip-ee"
6. All subsequent sends use secure adapter → encrypted kind 445
```

### 9.2 How a Member Joins a Secure Group

```
1. Member receives invite link with preferredMode: "secure-nip-ee"
2. Member's app ensures own PQC key is published (kind 10051)
3. Member publishes kind 9021 (JOIN_REQUEST) 
4. Admin approves → publishes kind 9000 (PUT_USER)
5. Admin publishes updated kind 446 (KEY_SHARE) including the new member
6. New member's app detects kind 446, decapsulates their share
7. New member adopts epoch state
8. New member can now send and receive encrypted messages
```

### 9.3 How a Member is Removed

```
1. Admin publishes kind 9001 (REMOVE_USER)
2. scheduleSecureGroupMembershipTriggeredRotation fires
3. Admin advances epoch → new epoch ID
4. Admin publishes new kind 444 (WELCOME) with new epoch
5. Admin publishes new kind 446 (KEY_SHARE) to remaining members only
6. Removed member cannot decrypt messages after rotation
7. Remaining members adopt new epoch, send/receive with new key
```

---

## 10. DATA FLOW DIAGRAMS

### 10.1 Secure Group Message Send

```
GroupConversation.svelte
  │ publishGroupMessage({requestedMode: "secure-nip-ee", ...})
  ▼
group-commands.ts: publishGroupMessage()
  │ dispatchGroupTransportMessage({requestedMode: "secure-nip-ee", ...})
  ▼
group-transport.ts: dispatchGroupTransportMessage()
  │ resolveGroupMessageTransportAdapter() → securePilotGroupTransport (first match)
  │ securePilotEnabled === true ✓
  │ canOperate({requestedMode: "secure-nip-ee"}) → ok ✓
  ▼
group-transport-secure.ts: sendMessage()
  │ parseSecureGroupSendInputResult(input)
  │ sendSecureGroupMessage(parsed)
  ▼
group-transport-secure-ops.ts: sendSecureGroupMessage()
  │ 1. ensureOwnPqcKey()
  │ 2. ensureSecureGroupEpochState(groupId)
  │ 3. getActivePassphrase() → passphrase (set via UnlockScreen at PQC setup)
  │ 4. retrieveKey("pqc-group-master:" + groupId, passphrase) → masterKey
  │ 5. deriveEpochContentKey(masterKey, groupId, epochId) → epochKey
  │ 6. encodeSecureGroupEpochContent({..., epochKeyBytes: epochKey}) → {content: JSON}
  │ 7. publishThunk({event: makeEvent(445, {content: encrypted, tags: [...]})})
  ▼
Relay stores kind 445 event with encrypted content
```

### 10.2 Secure Group Message Receive

```
Relay returns kind 445 event
  ▼
welshman repository → deriveEvents({kinds: [...445...]})
  ▼
state.ts: groupEvents subscription
  │ buildGroupProjection(events) → projection.sourceEvents includes encrypted kind 445
  ▼
GroupConversation.svelte
  │ $: projection = $groupProjections.get(groupId)
  │ $: projection.group.transportMode === "secure-nip-ee" ← set by WELCOME event ✓
  │ $: decryptSecureMessages(messages, groupId) TRIGGERS
  │
  │ For each message with kind === 445:
  │   1. getActivePassphrase() → passphrase
  │   2. resolveEpochKey(groupId, projection.group.currentEpochId, passphrase) → epochKey
  │   3. validateAndDecryptSecureGroupEventContent({event, epochId, epochKey}) → plaintext
  │   4. decryptedContent.set(msg.id, plaintext)
  │
  │ getDisplayContent(msg) → decryptedContent.get(msg.id) || msg.content
  ▼
Decrypted message rendered in UI
```

### 10.3 Epoch Key Share Distribution

```
Admin triggers key share (group creation / member join / rotation)
  ▼
group-epoch-key-share.ts: publishEpochKeyShare()
  │ For each recipient:
  │   1. resolvePeerPqPublicKey(pubkey) → ML-KEM-768 public key (from kind 10051)
  │   2. mlKemEncapsulate(pqPubKey) → {cipherText, sharedSecret}
  │   3. hkdfDeriveKey(sharedSecret, salt, "navcom-epoch-key-share-v1") → wrapKey
  │   4. aesGcmEncrypt(epochMasterKey, wrapKey, randomNonce()) → wrappedKey
  │   5. Bundle: {pk_ref, kem_alg, kem_ct, wrapped_key, wrap_nonce}
  │
  │ publishThunk({event: makeEvent(446, {content: JSON, tags: [h, epoch, p, p, ...]})})
  ▼
Relay stores kind 446 event

  ▼ (Recipient side — on group hydration or event subscription)

state.ts: groupEvents includes kind 446
  ▼
GroupConversation.svelte (or state.ts watcher):
  │ Detect kind 446 in sourceEvents where "p" tag matches myPubkey
  │ receiveEpochKeyShare(event.content, myPubkey, myPqSecretKey)
  │   1. Find my bundle by pk_ref
  │   2. mlKemDecapsulate(kem_ct, myPqSecretKey) → sharedSecret
  │   3. hkdfDeriveKey(sharedSecret, salt, "navcom-epoch-key-share-v1") → wrapKey
  │   4. aesGcmDecrypt(wrapped_key, wrapKey, wrap_nonce) → epochMasterKey
  │   5. storeKey("pqc-group-master:" + groupId, masterKey, passphrase)
  │   6. adoptSecureGroupEpochState(groupId, {epochId, sequence})
  ▼
Member now has epoch key → can encrypt (send) and decrypt (receive)
```

---

## 11. FILE CHANGE MANIFEST

### New Files

| File | Purpose |
|------|---------|
| `src/engine/group-epoch-key-share.ts` | Publish and receive epoch key shares (kind 446) |
| `src/engine/group-epoch-welcome.ts` | Publish and parse WELCOME events (kind 444) |

### Modified Files

| File | Change |
|------|--------|
| `src/main.js` (or parent component) | Wire UnlockScreen `unlock` event → `setActivePassphrase()` |
| `src/domain/group.ts` | Add `currentEpochId?` and `currentEpochSequence?` to `GroupEntity` |
| `src/domain/group-kinds.ts` | Add `EPOCH_KEY_SHARE: 446` to `GROUP_KINDS.NIP_EE` |
| `src/domain/group-projection.ts` | Handle kind 444 in `applyGroupEvent` → set `transportMode` + epoch info |
| `src/engine/group-transport-baseline.ts` | Reject `"secure-nip-ee"` in `canOperate` |
| `src/engine/group-transport-secure-ops.ts` | Replace `sendWrapped` with `publishThunk`; replace auto-provision with stored-key lookup |
| `src/engine/group-transport-secure-control.ts` | On `"create"` with secure mode: publish WELCOME + KEY_SHARE |
| `src/app/groups/state.ts` | Add kind 446 to `groupKinds` array |
| `src/app/views/GroupConversation.svelte` | Process incoming key shares; use `projection.group.currentEpochId` for decryption |

### No Changes Needed

| File | Why |
|------|-----|
| `src/engine/pqc/crypto-provider.ts` | All crypto primitives already correct |
| `src/engine/pqc/dm-envelope.ts` | Add HMAC-SHA256 confirmation tag to each recipient bundle |
| `src/engine/pqc/dm-receive-envelope.ts` | Verify confirmation tag with constant-time comparison |
| `src/engine/pqc/envelope-contracts.ts` | Add `confirmation_tag?: string` to `PqcEnvelopeRecipient` type |
| `src/engine/pqc/epoch-key-manager.ts` | `generateEpochKey`, `deriveEpochContentKey` already correct |
| `src/engine/group-epoch-content.ts` | Encode/decode already correct |
| `src/engine/group-epoch-decrypt.ts` | Decrypt function already correct |
| `src/engine/group-epoch-state.ts` | `adoptSecureGroupEpochState` already exists |
| `src/engine/pqc/pq-key-lifecycle.ts` | `ensureOwnPqcKey`, `resolvePeerPqPublicKey` already correct |
| `src/engine/pqc/pq-key-store.ts` | `getActivePassphrase`, `setActivePassphrase` already correct |
| `src/engine/keys/secure-store.ts` | `storeKey`, `retrieveKey` already correct |

---

## 12. IMPLEMENTATION ORDER

Each phase builds on the previous. Each is independently testable.

### Phase A: Foundation Fixes (no protocol changes needed)

1. **Wire UnlockScreen → `setActivePassphrase()`** — connect the existing unlock event dispatch to `setActivePassphrase` in the parent component or `main.js`
2. **`group-transport-baseline.ts`** — reject `"secure-nip-ee"` in `canOperate`
3. **`group.ts`** — add `currentEpochId?`, `currentEpochSequence?` to `GroupEntity`
4. **`group-kinds.ts`** — add `EPOCH_KEY_SHARE: 446`

### Phase B: Epoch Announcement (WELCOME)

5. **`group-epoch-welcome.ts`** — `publishSecureGroupWelcome` + `parseSecureGroupWelcome`
6. **`group-projection.ts`** — handle kind 444, update `transportMode` + epoch fields
7. **`state.ts`** — add kind 446 to `groupKinds` (already has 444)
8. **`group-transport-secure-control.ts`** — publish WELCOME on secure group creation

### Phase C: Key Distribution (KEY_SHARE)

9. **`group-epoch-key-share.ts`** — `publishEpochKeyShare` + `receiveEpochKeyShare`
10. **`group-transport-secure-control.ts`** — publish KEY_SHARE after WELCOME on creation
11. **`GroupConversation.svelte`** (or state.ts) — process incoming kind 446 events

### Phase D: Send/Receive Wire-up

12. **`group-transport-secure-ops.ts`** — replace `sendWrapped` with `publishThunk`, replace auto-provision with stored-key lookup
13. **`GroupConversation.svelte`** — use `projection.group.currentEpochId` for decrypt epoch resolution
14. **`group-transport-secure-ops.ts`** — add `ensureOwnPqcKey()` to send path

### Phase E: Rotation & Join Integration

15. Wire `publishEpochKeyShare` into member join approval flow
16. Wire `advanceSecureGroupEpochState` + `publishEpochKeyShare` into member removal flow
17. Wire timer-based rotation into `scheduleSecureGroupKeyRotationIfNeeded`
18. Multi-epoch key retention for historical message decryption

### Phase F: Testing & Verification

19. Unit tests for `publishEpochKeyShare` / `receiveEpochKeyShare` round-trip
20. Unit tests for WELCOME → `transportMode` update
21. Integration test: full create → share → send → receive → decrypt pipeline
22. Integration test: member removal → rotation → old member excluded
23. Integration test: new member join → key share → can decrypt
24. Adversarial test: wrong key, tampered key share, replay
25. Run full test suite + svelte-check + build

---

## 13. OPEN QUESTIONS — ALL RESOLVED

### Q1: Passphrase strategy — RESOLVED ✅

**Decision:** Explicit passphrase via existing `UnlockScreen.svelte`.

**Why:** NIP-44 `encrypt()` is NOT deterministic (random nonce per call). Only NIP-01 signers have raw key access. The only universal, honest approach is an explicit passphrase. UnlockScreen already has the right UX (setup/unlock/migrate modes) and dispatches an `unlock` event — just needs wiring to `setActivePassphrase()`.

**Impact:** Eliminates `identity-passphrase.ts` (was planned as new file). Reduces Phase A from 4 to 3 new items + 1 wiring change.

### Q2: Kind 446 visibility — RESOLVED ✅

**Decision:** Accept metadata leakage for v1.

**Why:** Group membership is already public via NIP-29 metadata events (kind 39000, kind 9000/9001). A relay observer can already see who is in a group. Adding NIP-59 gift wrapping for kind 446 would add significant complexity (per-member event publishing, relay subscription changes) for zero meaningful security gain in the current threat model. Revisit if/when NIP-29 metadata is itself encrypted.

### Q3: Missing PQC keys — RESOLVED ✅

**Decision:** Skip member + retry on key appearance (Option A).

**Implementation:**
- `publishEpochKeyShare` tracks `missingPqKey[]` in its return type (already designed)
- Show info toast to admin: "2 members pending PQC key — they'll receive keys when ready"
- On PQC key appearance (kind 10051 event from a pending member), re-run `publishEpochKeyShare` for just that member
- `ensureOwnPqcKey()` is called on first secure send, so members organically publish their keys
- Future: Add PQC key as prerequisite in "Join Secure Group" flow

### Q4: Key share event size — RESOLVED ✅

**Decision:** Accept current design; monitor and split if needed.

**Analysis:** Each recipient bundle is ~2.6 KB base64-encoded. Size by group size:
- 10 members: ~26 KB (well within limits)
- 50 members: ~130 KB (within typical 512 KB relay limit)
- 200 members: ~520 KB (may exceed some relay limits)

**Mitigation strategy (if needed, NOT for v1):**
- Split kind 446 into multiple events with a `part` tag: `["part", "1", "3"]`
- Or use a tree structure where sub-admins distribute to their segment
- For v1, groups are small (Earth Alliance field teams, not public forums)

### Q5: Race condition on group creation — RESOLVED ✅

**Decision:** Design for eventual consistency with queued processing.

**Implementation:**
- kind 446 before kind 444: Store the decapsulated master key in secure store with the epoch ID from the key share event. When kind 444 (WELCOME) arrives, `applyGroupEvent` sets `transportMode` and `currentEpochId` — the stored key is already there.
- kind 444 before kind 446: `applyGroupEvent` sets `transportMode = "secure-nip-ee"` but no epoch key exists yet. Sends will fail with "No epoch key for this group. You may not have received the key share yet." (retryable error). When kind 446 arrives, key is stored and sends/decrypts work.
- kind 9007 after 444/446: Group doesn't exist in projection yet. When it appears, the projection is created; then when 444 is applied, mode is set.
- **No ordering guarantees required.** Each event is processed idempotently. The system converges to a working state regardless of arrival order.

---

## 14. SUCCESS CRITERIA

When this spec is fully implemented:

1. **A user can create a secure group** and the group's `transportMode` is `"secure-nip-ee"`
2. **All members receive the epoch key** via ML-KEM-768 key exchange (kind 446)
3. **Messages are encrypted** with AES-GCM-256 using HKDF-derived epoch keys and published as kind 445
4. **Messages are decrypted** on the display path using the recipient's copy of the epoch key
5. **Removed members cannot decrypt** messages sent after their removal (epoch rotation)
6. **No silent downgrade** — if the secure adapter fails, the user sees an error, not plaintext
7. **Passphrase is set once** via UnlockScreen during PQC setup — no repeated prompts during normal flow
8. **879+ tests pass**, 0 svelte-check errors, production build succeeds
9. **An adversary reading relay traffic** sees only encrypted content and ML-KEM ciphertexts — no plaintext
