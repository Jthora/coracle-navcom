# 02-02: PQC Key Generation & Publication UI

> Let users generate and publish PQC public keys so others can encrypt messages to them.

**Priority**: HIGH — without this, nobody can initiate encrypted communication.  
**Effort**: MEDIUM  
**Depends on**: 02-01 (message path wiring — so keys have a purpose)  
**Source**: [navcom-gap-analysis.md](../../navcom-gap-analysis.md) §Top 10 Gap #3

> **NIP Reference**: Kind 10051 (`KEY_PACKAGE_RELAYS`) is defined in the experimental NIP-EE spec — it has **no finalized NIP number**. This kind is already used in the codebase (`GROUP_KINDS.NIP_EE.KEY_PACKAGE_RELAYS = 10051`). If NIP-EE is superseded by a ratified NIP, this kind number may change. See [NIP Inventory](../nip-inventory.md).

---

## Problem

The PQC engine can encrypt/decrypt, but there's no way for a user to:
1. Generate their PQC keypair
2. Publish their public key so others can find it
3. Discover other users' PQC public keys

Without published keys, encrypted DMs and group key exchange can't happen.

---

## Implementation

### 1. Key Generation

Add to Settings → Identity/Security section:

```
┌──────────────────────────────────┐
│ Post-Quantum Encryption          │
│                                  │
│ Status: ⚠ No PQC key generated  │
│                                  │
│ [Generate PQC Key]               │
│                                  │
│ Your relay connections support   │
│ post-quantum key exchange using  │
│ ML-KEM-768.                      │
└──────────────────────────────────┘
```

After generation:

```
┌──────────────────────────────────┐
│ Post-Quantum Encryption          │
│                                  │
│ Status: ✅ Active                │
│ Algorithm: ML-KEM-768            │
│ Generated: 2026-03-20            │
│ Published: ✅                    │
│                                  │
│ [Rotate Key] [Revoke Key]        │
└──────────────────────────────────┘
```

### 2. Key Publication (kind 10051 — NIP-EE experimental)

Publish the PQC public key as a replaceable Nostr event. The codebase already defines this as `GROUP_KINDS.NIP_EE.KEY_PACKAGE_RELAYS = 10051`:

```json
{
  "kind": 10051,
  "content": "<ML-KEM-768 public key, base64-encoded>",
  "tags": [
    ["algorithm", "ml-kem-768"],
    ["version", "1"]
  ]
}
```

The kind number aligns with the existing NIP-EE constants in `src/domain/group-kinds.ts`. **Interoperability warning**: No other Nostr client currently recognizes kind 10051. Until NIP-EE is ratified, this is NavCom-proprietary.

### 3. Key Discovery

When viewing a user's profile or initiating a DM:
- Query relay for that user's kind-10051 event
- If found: DMs can be PQC-encrypted
- If not found: fall back to NIP-17 DM encryption using NIP-44 primitive (XChaCha20-Poly1305), or plaintext with warning

Display in profile/DM header:
```
🔒 PQC encryption available  (if they have a published key)
⚠ Standard encryption only   (if no PQC key published)
```

### 4. Key Rotation

The `group-key-rotation-service.ts` handles group key rotation. For personal PQC keys:
- User clicks [Rotate Key]
- New keypair generated
- New public key published (replaces kind-10051 event)
- Old private key retained for decrypting messages encrypted under old key

### 5. Auto-Generation During Onboarding (Future)

Once PQC key generation is stable, integrate it into the enrollment flow (01-08):
- Generate PQC keypair alongside standard Nostr keypair
- Publish PQC key automatically
- User never knows it happened

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/PqcKeySettings.svelte` | Settings UI for key management | ~150 |

## Files to Modify

| File | Change |
|------|--------|
| Settings view | Add PQC section linking to `PqcKeySettings` |
| Profile/DM components | Show PQC availability indicator |
| `crypto-provider.ts` | Add key generation function if not already present |

---

## Verification

- [ ] Generate key → key appears in settings with correct algorithm label
- [ ] Key is published to relays (verify via raw event query)
- [ ] Other users' PQC keys are discoverable
- [ ] DM to PQC-enabled user uses PQC encryption
- [ ] DM to non-PQC user falls back to standard encryption
- [ ] Key rotation publishes new key and retains old for decryption
- [ ] Existing PQC unit tests still pass
