# NIP Inventory — NavCom Protocol Map

> Complete catalog of Nostr Implementation Possibilities (NIPs) used, planned, or relevant to NavCom.

This document is the single source of truth for which NIPs are active in the codebase, which are planned in the refactor, and which are NavCom-proprietary extensions.

---

## Active NIPs (Already Implemented)

These are operational in the current codebase via `@welshman/*` packages and NavCom code.

| NIP | Name | Kind(s) | Status | Implementation |
|-----|------|---------|--------|----------------|
| **NIP-01** | Basic Protocol | 0, 1 | ✅ Operational | `@welshman/net` relay connections, event signing, subscription filters |
| **NIP-02** | Follow List | 3 | ✅ Operational | `@welshman/util`, used in `PersonFollowers.svelte` |
| **NIP-05** | DNS Identity | — | ⚠ Partial | `nip05` field stored in profiles (`handler.ts`), no verification UI |
| **NIP-07** | Browser Extension Signer | — | ✅ Operational | `@welshman/signer` Nip07Signer, used in onboarding |
| **NIP-17** | Private Direct Messages | 14 | ✅ Operational | `DIRECT_MESSAGE` constant, `sendMessage()` in `commands.ts` |
| **NIP-19** | bech32 Encoding | — | ✅ Operational | `@welshman/util` npub/nsec/naddr encoding |
| **NIP-25** | Reactions | 7 | ✅ Operational | `NoteContentKind7`, `NoteReactions.svelte` |
| **NIP-29** | Relay-Based Groups | 9000-9009, 9021-9022, 39000-39003 | ✅ Operational | `group-kinds.ts`, `group-commands.ts`, `group-projection.ts` |
| **NIP-32** | Labeling | — | ❌ Not used | Available for future structured message tagging |
| **NIP-33** | Parameterized Replaceable Events | 30000-39999 | ✅ Operational | Group metadata (kinds 39000-39003) |
| **NIP-42** | Relay Authentication | — | ✅ Operational | Challenge-response auth for closed relays |
| **NIP-44** | Encryption Primitive | — | ✅ Operational | XChaCha20-Poly1305 shared-secret encryption, used inside NIP-17 DMs |
| **NIP-46** | Nostr Connect (Remote Signing) | — | ✅ Operational | `@welshman/signer` bunker signing |
| **NIP-51** | Lists | 10000-10005, 30000+ | ✅ Operational | Named people/relay lists, `list.ts` |
| **NIP-55** | Android Signer | — | ✅ Operational | `@welshman/signer` mobile app signing |
| **NIP-57** | Zaps | 9735 | ✅ Operational | `NoteContentKind9735` rendering |
| **NIP-59** | Gift Wrapping | 1059 | ✅ Operational | `WrapManager`, `sendWrapped()`, DM privacy layer |
| **NIP-65** | Relay List Metadata | 10002 | ✅ Operational | `RelayList.svelte`, user-managed relay preferences |
| **NIP-92** | Media Attachments (inline) | — | ⚠ Partial | `imeta` tags supported in content rendering |
| **NIP-94** | File Metadata | 1063 | ✅ Operational | `NoteContentKind1063.svelte` rendering |
| **NIP-98** | HTTP Auth | — | ✅ Operational | Relay authentication challenges |

---

## NIP-EE: Experimental Encrypted Groups

**Status**: Experimental — no finalized NIP number assigned.

NIP-EE extends NIP-29 groups with end-to-end encryption. It is the foundation of NavCom's secure communications.

| Kind | Constant | Purpose | Status |
|------|----------|---------|--------|
| **443** | `GROUP_KINDS.NIP_EE.KEY_PACKAGE` | ML-KEM-768 key package for group key exchange | Engine built, not in live path |
| **444** | `GROUP_KINDS.NIP_EE.WELCOME` | Welcome message for new group members (contains epoch key) | Engine built, not in live path |
| **445** | `GROUP_KINDS.NIP_EE.GROUP_EVENT` | Encrypted group message — **the primary group chat kind** | ✅ Used for ALL group messages (both baseline and secure transport) |
| **10051** | `GROUP_KINDS.NIP_EE.KEY_PACKAGE_RELAYS` | PQC public key publication (replaceable event) | Defined in code, not yet published by any user |

**Interoperability**: No other Nostr client currently implements NIP-EE. Until ratified as an official NIP, these kinds are effectively NavCom-proprietary.

**PQC Layer**: NavCom extends NIP-EE with post-quantum cryptography (ML-KEM-768 + AES-GCM-256) via `@noble/post-quantum@0.2.1`. The PQC engine has 556 tests passing on the `feat/real-pqc-crypto` branch but is not yet wired into the live message path (see [02-01](02-crypto-integration/01-message-path-wiring.md)).

---

## Deprecated NIPs (Read-Only or Removed)

| NIP | Name | Kind | Status | Notes |
|-----|------|------|--------|-------|
| **NIP-04** | Encrypted Direct Messages (legacy) | 4 | 📖 Read-only | `DEPRECATED_DIRECT_MESSAGE` — only used to read old DMs, never for new messages. Superseded by NIP-17 + NIP-44. |
| **NIP-26** | Delegated Event Signing | — | ❌ Deprecated | Removed from the Nostr protocol. Not used in codebase. The chain-of-trust spec ([06-03](06-future/03-chain-of-trust.md)) uses custom NIP-33 parameterized replaceable events instead. |
| **NIP-28** | Public Chat Channels | 42 | ❌ Not used | Kind 42 is NOT used by NavCom. Group messages use kind 445 (NIP-EE). |

---

## NavCom-Proprietary Extensions

These tags and conventions are specific to NavCom. No other Nostr client will interpret them.

### Custom Tags

| Tag | Values | Used By | NIP-32 Migration Path |
|-----|--------|---------|----------------------|
| `["msg-type", value]` | `"check-in"`, `"alert"`, `"sitrep"`, `"spotrep"`, `"geo-annotation"` | Structured comms (Phase 3), draw tools (Phase 4) | `["L", "navcom.msg-type"]` + `["l", value, "navcom.msg-type"]` |
| `["priority", value]` | `"low"`, `"medium"`, `"high"` | Alert messages | `["L", "navcom.priority"]` + `["l", value, "navcom.priority"]` |
| `["severity", value]` | `"routine"`, `"important"`, `"urgent"` | SITREP messages | Same pattern as priority |
| `["location", "lat,lng"]` | Coordinate string | Geo-tagged messages | Consider `["geo", "lat,lng"]` or rely on `["g", geohash]` alone |
| `["geo-type", value]` | `"Point"`, `"LineString"`, `"Polygon"`, `"Circle"` | Map annotations | `["L", "navcom.geo-type"]` + `["l", value, "navcom.geo-type"]` |
| `["geojson", json]` | GeoJSON string | Map annotations | No NIP equivalent — keep as-is |
| `["label", text]` | Free text | Map annotations | No migration needed |

### Custom Event Types (via kind 30078)

| Purpose | Kind | Tags | Used By |
|---------|------|------|---------|
| Operator delegation certificate | 30078 | `["d", "delegation"]`, `["p", pubkey]`, `["permissions", ...]`, `["valid-until", ts]` | Chain of trust ([06-03](06-future/03-chain-of-trust.md)) |
| Delegation revocation | 30078 | `["d", "revocation"]`, `["e", cert-id]`, `["p", pubkey]` | Chain of trust ([06-03](06-future/03-chain-of-trust.md)) |

---

## NIP Protocol Flow Diagrams

### DM Send Path (NIP-17 + NIP-59 + NIP-44)

```
Compose text
    ↓
Create kind 14 event (NIP-17 DIRECT_MESSAGE)
    ↓
Encrypt content with NIP-44 (XChaCha20-Poly1305)
    ↓                    ↓ (future: PQC replaces this step)
              ML-KEM-768 + AES-GCM-256 via crypto-provider.ts
    ↓
sendWrapped() wraps in kind 1059 (NIP-59 GIFT_WRAP)
    ↓
Publish kind 1059 to relays
    ↓
Recipient subscribes to kind 1059 tagged to their pubkey
    ↓
Unwrap → Decrypt → Display kind 14 content
```

### Group Message Send Path (NIP-EE)

```
Compose text
    ↓
Create kind 445 event (NIP-EE GROUP_EVENT)
  + ["h", groupId] tag (NIP-29 group identifier)
    ↓
Tier check (group-tier-policy.ts):
  T0 → publish plaintext
  T1 → encrypt content, publish (fallback if no key)
  T2 → encrypt content, publish (block if no key)
    ↓
group-transport-baseline.ts or group-transport-secure-ops.ts
    ↓
Publish to group relay
```

### Structured Message Path (NavCom Extension)

```
Compose → select type (Check-In, Alert, etc.)
    ↓
Create kind 445 event
  + ["h", groupId]
  + ["msg-type", type]        ← NavCom-proprietary tag
  + ["g", geohash]            ← Standard Nostr geohash tag
  + ["location", "lat,lng"]   ← NavCom-proprietary tag
  + type-specific tags
    ↓
Same encryption/publish path as regular group messages
```

---

## @welshman Package NIP Coverage

The `@welshman/*` framework (imported throughout the codebase) provides NIP support transparently:

| Package | NIPs Implemented |
|---------|-----------------|
| `@welshman/net` | NIP-01 (relay protocol), NIP-42 (relay auth), NIP-59 (gift wrap manager) |
| `@welshman/signer` | NIP-07 (browser extension), NIP-46 (remote signing), NIP-55 (mobile signer), NIP-59 (Nip59 class) |
| `@welshman/util` | NIP-19 (bech32 encoding), NIP-01 (event creation), NIP-65 (relay list helpers) |
| `@welshman/content` | NIP-01 (event content parsing), mention/link rendering |
| `@welshman/store` | NIP-01 (event repository), synced stores with localStorage |

---

## NIP Gaps & Future Considerations

| NIP | Relevance | Status |
|-----|-----------|--------|
| **NIP-32** (Labeling) | Could standardize NavCom's `msg-type`/`priority` tags for cross-client discovery | Not yet adopted — migration path documented above |
| **NIP-52** (Calendar Events) | Precedent for structured events with time/location | Not relevant unless NavCom adds calendar features |
| **NIP-96** (HTTP File Storage) | Standard file upload API for relays | Consider for SPOTREP photo uploads if relay supports it |
| **NIP-36** (Sensitive Content) | Content warnings | Could apply to Alert messages in public channels |

---

*Last updated: 2026-03-20*
