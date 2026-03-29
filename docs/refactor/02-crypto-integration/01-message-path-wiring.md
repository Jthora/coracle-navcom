# 02-01: Wire PQC into Message Path

> Connect the existing PQC crypto engine to the live message send/receive pipeline.

**Priority**: CRITICAL — PQC engine exists (556 tests passing) but zero messages are actually encrypted.  
**Effort**: MEDIUM (plumbing, not cryptographic invention)  
**Depends on**: Nothing (engine-layer work, independent of UI rewrite)  
**Source**: [navcom-gap-analysis.md](../../navcom-gap-analysis.md) §Top 10 Gap #2

> **NIP Reference**: This task touches NIP-EE (experimental, kinds 443/444/445), NIP-17 (kind 14, DMs), NIP-59 (kind 1059, gift wrapping), and NIP-44 (XChaCha20-Poly1305 encryption primitive). See [NIP Inventory](../nip-inventory.md) for the full protocol map.

---

## Current State

The PQC crypto engine on branch `feat/real-pqc-crypto` is complete:
- `src/engine/pqc/crypto-provider.ts` — ML-KEM-768 + AES-GCM-256
- `src/engine/pqc/epoch-key-manager.ts` — key rotation management
- `src/engine/pqc/dm-envelope.ts` — DM encryption envelope
- `@noble/post-quantum@0.2.1` installed
- 556 unit tests passing

**The gap**: No message in the application actually flows through this engine. The send path writes plaintext Nostr events. The receive path reads plaintext.

---

## Implementation

### 1. Identify the Send Path

Trace the message send flow from compose → Nostr event publication:
- `Compose.svelte` (or equivalent) → calls a send function
- **Group chat**: `sendGroupMessage()` in `group-transport-baseline.ts` creates a kind **445** event (`GROUP_KINDS.NIP_EE.GROUP_EVENT`) — this is the NIP-EE group event kind, used for both baseline and secure group transport
- **DMs**: `sendMessage()` in `commands.ts` creates a kind **14** event (`DIRECT_MESSAGE`, NIP-17), then wraps it in a kind **1059** gift wrap (NIP-59) via `sendWrapped()`
- **Legacy DMs**: kind **4** (`DEPRECATED_DIRECT_MESSAGE`, NIP-04) — read-only for backward compatibility, never used for new messages
- Events are published to relays

**Insert encryption between**: event creation and relay publication.

For groups with Tier 1 or Tier 2 encryption enabled:
```
compose text → create event → encrypt payload via crypto-provider → publish encrypted event
```

For Tier 0 (open) groups:
```
compose text → create event → publish plaintext event (no change)
```

### 2. Identify the Receive Path

Trace the message receive flow from relay event → display:
- Relay delivers event via subscription
- Event is processed, stored in local state
- Feed/message components render the event content

**Insert decryption between**: relay delivery and local state storage.

For encrypted events:
```
receive event → detect encryption marker → decrypt via crypto-provider → store plaintext in state → render
```

For plaintext events:
```
receive event → store in state → render (no change)
```

### 3. Compose with Existing Wrapping Layers

**Critical**: The DM path already has a wrapping layer (NIP-59 gift wrapping via `sendWrapped()`). PQC encryption must compose with — not replace — this layer:

```
DM path:  compose → kind 14 event → PQC encrypt content → sendWrapped() → kind 1059 gift wrap → relay
Group path: compose → kind 445 event → PQC encrypt content → publish (no gift wrap needed)
```

For DMs, PQC replaces the NIP-44 encryption primitive (XChaCha20-Poly1305 shared-secret derivation) with ML-KEM-768 + AES-GCM-256, but the NIP-59 gift-wrap envelope remains unchanged.

### 4. Encryption Marker

Encrypted events need a way to signal "this is encrypted." The approach depends on the transport:
- **Groups (kind 445)**: The `group-transport-secure-ops.ts` already tags epochs — the NIP-EE envelope structure itself serves as the marker
- **DMs (kind 14)**: The PQC dm-envelope in `dm-envelope.ts` has a recognizable JSON structure with `algorithm` and `ciphertext` fields
- Clients that don't support PQC will see the opaque ciphertext and can display a fallback message

### 5. Tier Policy Enforcement

The existing `group-tier-policy.ts` defines encryption tiers per group:
- **T0**: No encryption (plaintext)
- **T1**: Encrypted, but downgrade allowed (warn user)
- **T2**: Enforced encryption, cannot send plaintext

Wire the tier check into the send path:
```
if tier === T2 and cannot encrypt → block send, show error
if tier === T1 and cannot encrypt → warn, allow plaintext with user consent
if tier === T0 → send plaintext
```

### 6. Key Availability

Before encrypting, the sender needs the group's epoch key (from `epoch-key-manager.ts`). If no key is available:
- For T2 groups: block send, prompt "Encryption key not available"
- For T1 groups: warn and fall back to plaintext

Before decrypting, the receiver needs the epoch key for the epoch the message was encrypted under. If key is missing:
- Display: "[Encrypted message — key not available]" with an option to request the key

---

## Files to Modify

| File | Change |
|------|--------|
| `src/engine/group-transport-baseline.ts` | Insert PQC encryption before `makeEvent(GROUP_KINDS.NIP_EE.GROUP_EVENT, ...)` publish |
| `src/engine/group-transport-secure-ops.ts` | Verify PQC is used in the secure send path (may already be partially wired) |
| `src/engine/commands.ts` (`sendMessage`) | Insert PQC encryption for DM content before `sendWrapped()` (preserve NIP-59 gift wrap layer) |
| Message receive/process function | Insert decryption step after relay delivery / gift-wrap unwrapping |
| Group state | Store encryption capability (has key? which epoch?) |
| `group-tier-policy.ts` | Already exists — wire into send path |

## Files Referenced (Read-Only)

| File | Contains |
|------|----------|
| `src/engine/pqc/crypto-provider.ts` | `encrypt()` / `decrypt()` functions |
| `src/engine/pqc/epoch-key-manager.ts` | Key retrieval by epoch |
| `src/engine/pqc/dm-envelope.ts` | DM-specific envelope format |

---

## Verification

- [ ] Send a message in a T1 group → message is encrypted on the wire (verify via relay raw event)
- [ ] Receive an encrypted message in a T1 group → message decrypts and displays correctly
- [ ] Send in a T2 group without key → blocked with error message
- [ ] Send in a T0 group → plaintext (no change from current behavior)
- [ ] Receive message from old epoch → decrypts if key available, shows placeholder if not
- [ ] All 556 existing PQC tests still pass
- [ ] New integration tests: send encrypted → receive decrypted round-trip
