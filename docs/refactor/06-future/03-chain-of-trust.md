# 06-03: Chain of Trust & Operator Verification

> Establish cryptographic trust chains for operator identity, group authority, and device attestation.

**Priority**: MEDIUM — becomes critical when NavCom is used by organizations with real adversaries  
**Effort**: HIGH (protocol design, key management, UI for trust gestures)  
**Depends on**: 05-05 (key storage), 02-01 (message path wiring), 02-02 (key generation UI)  
**Source**: [navcom-gap-analysis.md](../../navcom-gap-analysis.md) §AUTH pillar, [navcom-vision.md](../../navcom-vision.md) §AUTH pillar

> **NIP Reference**: NIP-26 (Delegated Event Signing) is **deprecated** from the Nostr protocol and cannot be used. This spec requires a custom delegation protocol using parameterized replaceable events (kind 30078, NIP-33). NIP-51 follow lists inform but don't replace the trust chain. See [NIP Inventory](../nip-inventory.md).

---

## Problem

Currently, NavCom relies on Nostr's identity model:
- Identity = keypair
- Trust = follows/mutes (social graph)
- Groups = NIP-29 relay-enforced membership

This model has no concept of:
- **Operator authority**: Who runs this NavCom instance? How do users verify they're on the real deployment?
- **Delegation**: Can an operator authorize sub-admins?
- **Device binding**: Is this message from the person's device, or from a stolen key?
- **Revocation**: What happens when a key is compromised?

For organizational use, users need to trust not just "this pubkey signed this message" but "this person, authorized by this organization, sent this from a verified device."

---

## Solution: Three-Layer Trust

### Layer 1: Operator Root of Trust

The operator (organization deploying NavCom) has a root keypair:

```
Operator Root Key
  ├── Signs: deployment manifest (app version, relay list, group list)
  ├── Signs: admin delegation certificates
  └── Signs: group creation events
```

The operator root public key is embedded in the NavCom build (via env var). Users implicitly trust it by using this instance.

```env
VITE_OPERATOR_ROOT_PUBKEY=npub1...
```

### Layer 2: Delegation Certificates

Operators delegate authority to admins via signed certificates. **NIP-26 (Delegated Event Signing) is deprecated** — we use a custom protocol based on NIP-33 parameterized replaceable events (kind 30078) instead:

```json
{
  "kind": 30078,
  "content": "",
  "tags": [
    ["d", "delegation"],
    ["p", "<delegate-pubkey>"],
    ["permissions", "group-admin,user-invite"],
    ["valid-until", "<timestamp>"]
  ]
}
```

- Signed by the operator root key
- Grants specific permissions to the delegate
- Time-bound (expires, must be renewed)
- Revocable (operator publishes a revocation event)

### Layer 3: Device Attestation (Future)

Bind a key to a specific device:
- On enrollment, device generates a device-specific keypair
- Operator (or admin) signs a certificate binding `user pubkey + device pubkey`
- Messages include both signatures (user + device)
- If a device is lost/stolen, revoke the device certificate without revoking the user key

---

## Key Ceremonies

### Operator Setup

1. Operator generates root keypair offline (air-gapped recommended)
2. Root public key embedded in NavCom build config
3. Root private key stored securely (HSM, hardware wallet, or offline)
4. Operator signs initial deployment manifest

### Admin Delegation

1. Operator creates delegation certificate for admin
2. Admin's NavCom verifies certificate against root public key
3. Admin gains authorized permissions (e.g., create groups, invite users)
4. Delegation can be revoked by publishing a revocation event

### User Enrollment Verification

1. User generates keypair during enrollment
2. Admin (or invite link) creates a membership certificate
3. Other users can verify: "This person was authorized by an admin, who was authorized by the operator"
4. Chain: `Operator Root → Admin Delegation → User Membership`

---

## Revocation

Revocation events are kind-specific and reference the revoked certificate:

```json
{
  "kind": 30078,
  "tags": [
    ["d", "revocation"],
    ["e", "<certificate-event-id>"],
    ["p", "<revoked-pubkey>"]
  ]
}
```

Clients must check for revocations before trusting a certificate.

Cache revocation checks — don't query on every message, but do check periodically and on new connections.

---

## Trust UI

- **Verified badge**: members with valid chain show ✓ next to name
- **Trust info**: tap to see the chain (Operator → Admin → User)
- **Unknown identity warning**: messages from non-chain pubkeys show ⚠
- **Revocation alert**: if a previously trusted member is revoked, show notification

---

## Implementation Phases

### Phase A: Operator Root Embed

1. Add `VITE_OPERATOR_ROOT_PUBKEY` to env config
2. On startup, verify operator signature on deployment manifest
3. Display "Verified deployment" in settings

### Phase B: Admin Delegation

1. Define delegation certificate event kind
2. UI for operator to create/revoke delegations
3. UI for admins to prove their authority

### Phase C: Membership Certificates

1. On enrollment, admin signs membership certificate
2. Other members verify chain on profile view
3. Unverified members shown with ⚠ indicator

### Phase D: Device Attestation

1. Device keypair generation on enrollment
2. Dual-signature on messages
3. Device revocation flow

---

## Files to Create (Phase A-B)

| File | Purpose | Lines |
|------|---------|-------|
| `src/engine/trust/chain.ts` | Certificate verification, chain walking | ~100 |
| `src/engine/trust/delegation.ts` | Delegation certificate creation/verification | ~80 |
| `src/engine/trust/revocation.ts` | Revocation checking and caching | ~60 |

## Files to Modify

| File | Change |
|------|--------|
| `.env.template` | Add `VITE_OPERATOR_ROOT_PUBKEY` |
| Member display components | Show verified/unverified badge |
| Profile/member detail view | Show trust chain |
| Admin settings | Delegation management UI |

---

## Open Questions

- [x] ~~Use NIP-26 for delegation or define a custom kind?~~ **Resolved**: NIP-26 is deprecated. Using custom parameterized replaceable events (kind 30078, NIP-33) with NavCom-specific tags.
- [ ] How to handle certificate distribution to offline/mesh users?
- [ ] Should device attestation use WebAuthn/FIDO2?
- [ ] How to bootstrap trust when operator root key is rotated?
- [ ] Integration with existing Nostr web-of-trust (NIP-51 follow lists)?
- [ ] Should delegation events use NIP-32 labeling for discoverability?

---

## Verification

- [ ] Operator root pubkey in env → deployment marked "verified" in settings
- [ ] Admin with valid delegation → can create groups, invite users
- [ ] Admin with expired delegation → permissions denied
- [ ] Revoked member → ⚠ shown, trust chain broken
- [ ] User taps verified badge → sees full chain (Operator → Admin → User)
- [ ] Non-chain pubkey messages → "Unknown identity" indicator
