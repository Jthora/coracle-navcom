# 03 — Relay Fingerprint Gate

> Phase 1 Implementation Spec · Innovation 5 from [playbook.md](playbook.md)
> **Collapses:** Gap 5 (cells are not isolated)
> **Effort:** Low · **Risk:** Minimal · **Architecture changes:** One new pure function, one integration point, one UI surface

---

## Table of Contents

1. [The Threat Model](#the-threat-model)
2. [Why a Gate, Not an Audit](#why-a-gate-not-an-audit)
3. [Current State: What Already Exists](#current-state-what-already-exists)
4. [How the Fingerprint Gate Works](#how-the-fingerprint-gate-works)
5. [New Files](#new-files)
6. [Modified Files](#modified-files)
7. [Integration Architecture](#integration-architecture)
8. [URL Normalization Deep Dive](#url-normalization-deep-dive)
9. [Edge Cases](#edge-cases)
10. [What Does NOT Change](#what-does-not-change)
11. [Phase Dependencies](#phase-dependencies)
12. [Risks and Mitigations](#risks-and-mitigations)
13. [Testing Plan](#testing-plan)
14. [Acceptance Criteria](#acceptance-criteria)

---

## The Threat Model

ARCHITECT creates Cell Alpha (Tier 2) on `wss://relay-alpha.example`. The relay operator for `relay-alpha.example` can see:
- Which pubkeys connect
- When they connect
- How large their ciphertext blobs are
- Timing correlation between messages

This is acceptable — Cell Alpha's operators chose that relay. The NIP-EE encryption means the relay sees ciphertext, not cleartext. But the relay operator knows *who* is in the cell and *when* they talk.

Now ARCHITECT creates Cell Bravo (Tier 2) on `wss://relay-bravo.example`. Different relay, different operator. Good: the operator of relay-alpha cannot see Cell Bravo traffic, and vice versa.

**The violation:** A new member joins both cells. When configuring Cell Bravo's relay, they accidentally use `wss://relay-alpha.example` (perhaps auto-filled, perhaps suggested by a share link). Now `relay-alpha.example`'s operator can see:
- This pubkey participates in Cell Alpha **and** in whatever traffic flows to relay-alpha from Bravo
- Timing correlation across both cells
- If the same relay serves both cells, the relay operator can correlate membership across cells without decrypting anything

This is a **metadata correlation attack**. No encryption is broken — the relay still sees only ciphertext. But the metadata (who, when, which groups) is fully visible. For Tier 2 (mandatory encryption), the vision doc promises metadata isolation. Without enforcing relay uniqueness per cell, the Tier 2 badge is lying.

**The current gap:** `evaluateTierPolicy()` in `src/engine/group-tier-policy.ts` enforces:
- Tier 2 requires `secure-nip-ee` transport mode
- Tier 2 blocks downgrades without override
- Tier 2 override requires confirmation + generates audit event

It does **not** check relay URLs. It cannot — it operates on transport mode, not relay config. The relay config lives in `RoomRelayPolicy` (per-group localStorage), orthogonal to the tier policy. There is no cross-group relay check anywhere in the system.

---

## Why a Gate, Not an Audit

Two approaches to this problem:

**Audit approach:** Show a warning panel: "You have overlapping relays across Tier 2 groups." Let the operator decide. Add a relay audit view to GroupSettingsAdmin.svelte that highlights overlaps.

**Gate approach:** Block the action. If the relay config for a Tier 2 group overlaps with any other Tier 2 group, prevent save/create/join. Show explanation. Require resolution (change relay or downgrade tier).

We choose the gate because:

1. **Audits depend on operators noticing.** SWITCHBLADE is configuring a group on a phone between tasks. They're not going to read an audit panel. A gate prevents the violation regardless of attention level.

2. **The violation is silent and severe.** Unlike a transport downgrade (obvious — messages aren't encrypted), relay overlap is invisible to participants. Only the relay operator benefits. An invisible threat demands a proactive control.

3. **The existing pattern is gate, not audit.** `evaluateTierPolicy()` returns `{ok: false, reason}` and blocks the action. The relay fingerprint gate follows the same pattern. Operators already understand "you can't do this because..." from tier policy.

4. **Doctrine alignment.** The vision says *"Resilience is architecture, not a feature."* A gate is architecture — it structurally prevents the violation. An audit is a feature — it informs but doesn't prevent.

5. **Reversibility is preserved.** The gate doesn't permanently lock anything. The operator can change the relay URL, downgrade from Tier 2, or split the groups. All paths are available; only the metadata-leaking path is blocked.

---

## Current State: What Already Exists

### `evaluateTierPolicy()` — The Gate Pattern

From `src/engine/group-tier-policy.ts`:

```typescript
export type EvaluateTierPolicyInput = {
  missionTier: GroupMissionTier    // 0 | 1 | 2
  groupId: string
  actorRole: string
  requestedMode: GroupTransportModeId
  resolvedMode: GroupTransportModeId
  downgradeConfirmed?: boolean
  allowTier2Override?: boolean
  now?: number
}

export type EvaluateTierPolicyResult =
  | { ok: true; overrideAuditEvent?: GroupTierOverrideAuditEvent }
  | { ok: false; reason: string }
```

The pattern: pure function, takes input, returns `{ok: true}` or `{ok: false, reason}`. No side effects. Caller decides what to do with the result (block UI, show toast, log audit). The relay fingerprint gate follows exactly this pattern.

### `RoomRelayPolicy` — Per-Group Relay Config

From `src/app/groups/relay-policy.ts`:

```typescript
export type RoomRelayPolicy = {
  groupId: string
  relays: RoomRelayPolicyEntry[]
}

export type RoomRelayPolicyEntry = {
  id: string
  url: string                // e.g., "wss://relay-alpha.example"
  role: RelayRole            // "read" | "write" | "read-write"
  isPrivate: boolean
  claim?: string
  health: RelayHealth        // "healthy" | "limited" | "unreachable" | "unknown"
  updatedAt: number
}
```

Stored in localStorage at key `group_relay_policy:{groupId}`. Loaded via `loadRoomRelayPolicy(groupId)`. Saved via `saveRoomRelayPolicy(policy)`.

**Crucially:** Relay policies are per-group and stored independently. There is no cross-group query. The fingerprint gate creates the first cross-group relay query.

### `normalizeRelayUrl()` — Existing Normalization

From `src/app/groups/relay-policy.ts`:

```typescript
const normalizeRelayUrl = (url: string) => {
  const trimmed = (url || "").trim()
  const lower = trimmed.toLowerCase()
  const cleaned = lower.replace(/^(wss?:\/\/)\/+/, "$1")  // collapse double-slash
  return cleaned.replace(/\/+$/, "")                        // strip trailing slashes
}
```

This is already used when creating relay entries. The fingerprint gate's normalization must be compatible — or better, should import the same function. Currently `normalizeRelayUrl` is not exported. **We must export it** for the gate to use.

### `isPrivateRelayUrl()` — SSRF Prevention

```typescript
const PRIVATE_IP_PATTERN =
  /^wss:\/\/(localhost|127\.[\d.]+|10\.[\d.]+|172\.(1[6-9]|2\d|3[01])\.[\d.]+|192\.168\.[\d.]+|\[?::1\]?|\[?::ffff:(10|127|192\.168)\.[\d.]+\]?)(:\d+)?(\/.*)?$/i

export const isPrivateRelayUrl = (url: string) => PRIVATE_IP_PATTERN.test(url)
```

Already blocks private-IP relays. The fingerprint gate's relay normalization operates on URLs that have already passed SSRF validation (they were stored successfully). No additional SSRF check needed in the gate itself.

### `validateRelayPolicy()` — Existing Validation

Checks: at least one relay, at least one writable, at least one readable, valid URLs, no private IPs, duplicate warnings, private relay claim warnings, unreachable relay warnings. Returns `{ok, errors, warnings}`.

The relay fingerprint gate is **not** part of `validateRelayPolicy()` because it requires cross-group context (other groups' relay configs). `validateRelayPolicy` is single-group validation. The fingerprint gate is multi-group validation.

### `evaluateSecureGroupSendTierPolicy()` — The Secure Tier Wrapper

From `src/engine/group-transport-secure-tier.ts`: wraps `evaluateTierPolicy()` for the send path. After the gate is integrated, this wrapper (or a parallel wrapper) would call the fingerprint gate for Tier 2 group creation/join paths.

---

## How the Fingerprint Gate Works

```
Operator attempts to save relay config for a Tier 2 group
  ↓
Collect proposed relay URLs from the relay editor
  ↓
Query all other groups the operator belongs to
  ↓
Filter to Tier 2 groups only
  ↓
Load each Tier 2 group's relay policy from localStorage
  ↓
Normalize all relay URLs (lowercase, strip trailing slash, collapse double-slash)
  ↓
For each proposed relay URL, check: does it appear in any other Tier 2 group?
  ↓
If overlap found → {ok: false, reason, overlaps[]}
  ↓
UI blocks save, displays overlapping relays and conflicting groups
  ↓
Operator must: change relay URL, remove conflicting relay, or downgrade from Tier 2
```

**When the gate runs:**

| Action | Gate runs? | Why |
|--------|-----------|-----|
| Create Tier 2 group with initial relays | ✅ | Prevents initial overlap |
| Edit Tier 2 group's relay config | ✅ | Prevents introduced overlap |
| Join existing Tier 2 group | ✅ | Prevents joining a group whose relays overlap with operator's existing Tier 2 groups |
| Create/edit Tier 0 or Tier 1 group | ❌ | No isolation requirement |
| Change group from Tier 1 to Tier 2 | ✅ | Tier upgrade triggers relay isolation check |
| Change group from Tier 2 to Tier 1 | ❌ | Downgrade relaxes isolation; gate check removed |

---

## New Files

### `src/engine/relay-fingerprint-gate.ts`

```typescript
/**
 * Relay Fingerprint Gate
 *
 * Enforces relay isolation for Tier 2 groups. Prevents an operator from
 * configuring a Tier 2 group with relay URLs that overlap with any other
 * Tier 2 group they participate in.
 *
 * The threat model: if two Tier 2 groups share a relay, the relay operator
 * can correlate membership across cells via metadata (pubkeys, timing,
 * payload sizes) without breaking encryption.
 *
 * Pure function. No side effects. Caller decides UI behavior.
 */

import {normalizeRelayUrl} from "src/app/groups/relay-policy"

// ── Types ──────────────────────────────────────────────────

export type RelayFingerprintGateInput = {
  /** Normalized relay URLs for the proposed group */
  proposedRelays: string[]
  /** Map of groupId → relay URLs for existing Tier 2 groups (not including proposed group) */
  existingTier2Groups: Map<string, string[]>
  /** Group ID being proposed (excluded from overlap check against itself) */
  proposedGroupId?: string
}

export type RelayOverlap = {
  relayUrl: string
  conflictingGroupId: string
  conflictingGroupTitle?: string
}

export type RelayFingerprintGateResult =
  | {ok: true}
  | {
      ok: false
      reason: string
      overlaps: RelayOverlap[]
    }

// ── Gate Function ──────────────────────────────────────────

/**
 * Evaluate whether a proposed Tier 2 group's relay set violates
 * relay isolation with any existing Tier 2 group.
 *
 * @param input - Proposed relay URLs, existing Tier 2 groups' relay URLs
 * @returns {ok: true} if no overlap, or {ok: false, reason, overlaps} if violation
 *
 * @example
 * const result = evaluateRelayFingerprintGate({
 *   proposedRelays: ["wss://relay-alpha.example"],
 *   existingTier2Groups: new Map([
 *     ["group-bravo", ["wss://relay-bravo.example"]],
 *     ["group-charlie", ["wss://relay-alpha.example"]], // ← overlap!
 *   ]),
 * })
 * // result.ok === false
 * // result.overlaps === [{relayUrl: "wss://relay-alpha.example", conflictingGroupId: "group-charlie"}]
 */
export const evaluateRelayFingerprintGate = (
  input: RelayFingerprintGateInput,
): RelayFingerprintGateResult => {
  const proposedSet = new Set(input.proposedRelays.map(normalizeRelayUrl))
  const overlaps: RelayOverlap[] = []

  for (const [groupId, relays] of input.existingTier2Groups.entries()) {
    // Skip self-comparison when editing an existing group's relays
    if (input.proposedGroupId && groupId === input.proposedGroupId) continue

    for (const relay of relays) {
      const normalized = normalizeRelayUrl(relay)
      if (proposedSet.has(normalized)) {
        overlaps.push({relayUrl: normalized, conflictingGroupId: groupId})
      }
    }
  }

  if (overlaps.length === 0) {
    return {ok: true}
  }

  const uniqueRelays = [...new Set(overlaps.map(o => o.relayUrl))]
  const uniqueGroups = [...new Set(overlaps.map(o => o.conflictingGroupId))]

  return {
    ok: false,
    reason: [
      `Tier 2 relay isolation violated.`,
      `${uniqueRelays.length} relay(s) shared with ${uniqueGroups.length} other Tier 2 group(s).`,
      `Shared relays allow the relay operator to correlate membership across cells.`,
      `Use dedicated relays for each Tier 2 group, or downgrade to Tier 1.`,
    ].join(" "),
    overlaps,
  }
}

// ── Assembly Helper ────────────────────────────────────────

/**
 * Assemble the gate input from the current state of group projections
 * and relay policies. This is the "glue" between the pure gate function
 * and the app-layer stores.
 *
 * @param proposedGroupId - Group being created/edited
 * @param proposedRelayUrls - Relay URLs from the relay editor form
 * @param allGroupIds - All group IDs the operator belongs to
 * @param getGroupTier - Function to look up a group's mission tier
 * @param getGroupRelays - Function to look up a group's relay URLs
 * @returns RelayFingerprintGateInput ready to pass to evaluateRelayFingerprintGate
 */
export const assembleGateInput = ({
  proposedGroupId,
  proposedRelayUrls,
  allGroupIds,
  getGroupTier,
  getGroupRelays,
}: {
  proposedGroupId: string
  proposedRelayUrls: string[]
  allGroupIds: string[]
  getGroupTier: (groupId: string) => number
  getGroupRelays: (groupId: string) => string[]
}): RelayFingerprintGateInput => {
  const existingTier2Groups = new Map<string, string[]>()

  for (const groupId of allGroupIds) {
    if (groupId === proposedGroupId) continue
    if (getGroupTier(groupId) !== 2) continue
    existingTier2Groups.set(groupId, getGroupRelays(groupId))
  }

  return {
    proposedRelays: proposedRelayUrls,
    existingTier2Groups,
    proposedGroupId,
  }
}
```

---

## Modified Files

### `src/app/groups/relay-policy.ts` — Export `normalizeRelayUrl`

The existing `normalizeRelayUrl` is module-private (`const`, not exported). The fingerprint gate needs to use the same normalization logic to avoid inconsistencies (e.g., one function lowercases and the other doesn't).

**Change:** Export the existing function:

```typescript
// Before:
const normalizeRelayUrl = (url: string) => { ... }

// After:
export const normalizeRelayUrl = (url: string) => { ... }
```

Also add the `extractRelayUrls` helper that the gate assembly uses:

```typescript
/**
 * Extract normalized relay URLs from a room relay policy.
 * Used by the relay fingerprint gate assembly.
 */
export const extractRelayUrls = (policy: RoomRelayPolicy): string[] =>
  policy.relays.map(r => normalizeRelayUrl(r.url))
```

### `src/app/views/GroupSettingsAdmin.svelte` — Gate Check on Relay Save

When the operator saves relay config changes on a Tier 2 group, run the fingerprint gate check before persisting. If the gate rejects, display the overlaps and disable save.

**New imports:**

```svelte
<script>
  import {evaluateRelayFingerprintGate, assembleGateInput} from "src/engine/relay-fingerprint-gate"
  import {loadRoomRelayPolicy, extractRelayUrls} from "src/app/groups/relay-policy"
</script>
```

**Gate check reactive block:**

```svelte
<script>
  // Run gate check reactively whenever relay editor state changes (Tier 2 only)
  $: gateResult = missionTier === 2
    ? evaluateRelayFingerprintGate(
        assembleGateInput({
          proposedGroupId: groupId,
          proposedRelayUrls: editingRelays.map(r => r.url),
          allGroupIds: [...$groupProjections.keys()],
          getGroupTier: (gid) => $groupProjections.get(gid)?.group?.missionTier ?? 0,
          getGroupRelays: (gid) => extractRelayUrls(loadRoomRelayPolicy(gid)),
        })
      )
    : {ok: true}

  $: gateBlocked = gateResult && !gateResult.ok
</script>
```

**Error display in relay editor section:**

```svelte
{#if gateBlocked && !gateResult.ok}
  <div class="mt-2 rounded-md border border-danger bg-danger/10 p-3 text-sm text-danger">
    <p class="font-semibold">⚠ Relay isolation violation</p>
    <p class="mt-1">{gateResult.reason}</p>
    {#if gateResult.overlaps?.length}
      <ul class="mt-2 list-disc pl-5 text-xs">
        {#each gateResult.overlaps as overlap}
          <li>
            <code class="font-mono">{overlap.relayUrl}</code> — shared with group
            <span class="font-semibold">{overlap.conflictingGroupId}</span>
          </li>
        {/each}
      </ul>
      <p class="mt-2 text-xs text-nc-text-muted">
        Change relay URLs to be unique per Tier 2 group, or downgrade this group to Tier 1.
      </p>
    {/if}
  </div>
{/if}
```

**Disable save button when gate blocks:**

```svelte
<button
  on:click={saveRelayConfig}
  disabled={!policyValid || gateBlocked}
  class="btn btn-primary"
>
  Save Relay Config
</button>
```

### `src/engine/group-tier-policy.ts` — Guard on Tier Upgrade to 2

When a group's tier is changed from 0 or 1 to Tier 2, the relay fingerprint gate must run. Add a note/hook point:

```typescript
// In the tier upgrade flow (if it exists), or document that the caller must
// run evaluateRelayFingerprintGate() when missionTier changes to 2.
// The gate should run AFTER tier policy passes but BEFORE the tier is persisted.
```

This is a call-site concern — wherever the tier is set, the caller assembles gate input and runs the check. The existing `evaluateTierPolicy()` function does not need to import the gate; they're composed at the call site.

---

## Integration Architecture

### Call Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  GroupSettingsAdmin.svelte (relay editor)                         │
│  ↓ operator changes relay URLs                                   │
│  ↓                                                               │
│  assembleGateInput({                                             │
│    proposedGroupId,                                              │
│    proposedRelayUrls: relays from editor form,                   │
│    allGroupIds: [...$groupProjections.keys()],                   │
│    getGroupTier: from groupProjections,                          │
│    getGroupRelays: loadRoomRelayPolicy → extractRelayUrls        │
│  })                                                              │
│  ↓                                                               │
│  evaluateRelayFingerprintGate(gateInput)                         │
│  ├─ {ok: true} → save button enabled → saveRoomRelayPolicy()    │
│  └─ {ok: false, reason, overlaps} → show error panel + disable   │
│                                                                   │
│  evaluateTierPolicy() ← runs independently for transport mode     │
│  Both must pass for the operation to proceed.                     │
└─────────────────────────────────────────────────────────────────┘
```

### Composition, Not Nesting

`evaluateTierPolicy()` and `evaluateRelayFingerprintGate()` are **not** nested. They are composed at the call site:

```typescript
// At the point where a Tier 2 group relay config is saved:

const tierResult = evaluateTierPolicy({ ... })
if (!tierResult.ok) return showError(tierResult.reason)

const gateResult = evaluateRelayFingerprintGate(assembleGateInput({ ... }))
if (!gateResult.ok) return showError(gateResult.reason)

// Both passed → proceed
saveRoomRelayPolicy(policy)
```

Why composition over nesting: `evaluateTierPolicy` checks transport mode (NIP-29 vs NIP-EE). `evaluateRelayFingerprintGate` checks relay URLs. They operate on different inputs. Nesting one inside the other would couple transport-mode validation to relay-URL validation, violating single responsibility.

---

## URL Normalization Deep Dive

Relay URL comparison is the core of this gate. Two relay URLs that look different but point to the same relay are the same threat:

| URL A | URL B | Same relay? | Without normalization |
|-------|-------|-------------|----------------------|
| `wss://relay.example` | `wss://Relay.Example` | ✅ Yes | Would miss (case differs) |
| `wss://relay.example/` | `wss://relay.example` | ✅ Yes | Would miss (trailing slash) |
| `wss:///relay.example` | `wss://relay.example` | ✅ Yes | Would miss (double slash) |
| `wss://relay.example` | `wss://relay.example:443` | ✅ Same host | **Not caught** — port normalization not in scope |
| `wss://relay.example` | `wss://1.2.3.4` (same IP) | ✅ Same host | **Not caught** — DNS resolution not in scope |

The existing `normalizeRelayUrl()` handles cases 1-3 (lowercase, strip trailing slash, collapse double-slash). By importing it, the gate gets the same normalization for free.

**Port normalization (`:443`):** Not in scope for Phase 1. The edge case is rare (operators don't typically add `:443` to `wss://` URLs) and the mitigation is disproportionate (would need URL parsing). If field use reveals this as a problem, a URL parsing step can be added.

**DNS resolution:** Out of scope entirely. Resolving hostnames to IPs to detect aliasing is a network operation, prone to timing issues (DNS changes), and overly complex for the threat model. The gate operates on URL strings, not network addresses.

---

## Edge Cases

| Scenario | Gate behavior | Rationale |
|----------|--------------|-----------|
| Group being edited overlaps with itself | Skip self | `proposedGroupId` is excluded from comparison |
| Zero other Tier 2 groups exist | `{ok: true}` | No possible overlap |
| Proposed group has zero relays | `{ok: true}` | Empty set can't overlap (relay editor won't allow saving zero relays, but gate is robust regardless) |
| Operator belongs to 50+ groups (many Tier 2) | Gate iterates all Tier 2 groups' relays | Performance: 50 groups × ~3 relays each = 150 comparisons, negligible |
| Two relays on the SAME group are duplicates | Not this gate's concern | `validateRelayPolicy()` already warns on duplicates within a group |
| Tier 1 group with relay overlap | Gate does not run | Only Tier 2 requires isolation |
| Group dowgraded from Tier 2 to Tier 1 | Gate no longer applies | Operator explicitly chose reduced isolation |
| Group UPGRADED from Tier 0/1 to Tier 2 | Gate runs at upgrade | Must verify relay isolation before granting Tier 2 badge |
| Relay URL contains path (e.g., `wss://relay.example/v1`) | Compared as full normalized URL | Different paths = different relays (correct assumption for relay routing) |
| Relay URL contains query params | Compared as full normalized URL | Unusual but safe |
| `localStorage` corrupted for a group's relay policy | `loadRoomRelayPolicy` returns default; gate compares against default relay | Safe — default relay (`wss://relay.example`) would only overlap if another Tier 2 group also uses the default, which would be flagged correctly |

---

## What Does NOT Change

1. **`evaluateTierPolicy()` is unchanged.** The existing function is not modified. The gate is composed alongside it, not nested inside it.
2. **`validateRelayPolicy()` is unchanged.** Single-group validation continues to check URLs, roles, SSRF, duplicates. The fingerprint gate is multi-group validation.
3. **Relay health tracking is unchanged.** The circuit-breaker in `relayHealthTracker` operates independently.
4. **No new Nostr event kinds.** The gate is client-side only.
5. **No new relay subscriptions.** The gate reads existing group projections and localStorage relay configs.
6. **Tier 0 and Tier 1 groups are unaffected.** No isolation requirement for lower tiers.
7. **Existing Tier 2 groups are not retroactively checked.** The gate runs on save/create/join, not on app start. (Phase 2 enhancement: startup audit scan.)
8. **Relay entry creation/deletion/update functions are unchanged.** `createRelayEntry`, `updateRelayEntry`, `removeRelayEntry` in `relay-policy.ts` are not modified.
9. **Group creation flow is non-blocking for non-Tier-2.** Only Tier 2 operations trigger the gate.
10. **Private relay claim system is unchanged.** `isPrivate`, `claim` on `RoomRelayPolicyEntry` are orthogonal.

---

## Phase Dependencies

### What Phase 1 provides to later phases

- **Phase 2 (Sovereign Mode):** When the app enters Sovereign Mode (disconnected/degraded), the relay fingerprint gate is irrelevant (no relay config changes while disconnected). But when reconnecting, if the operator was added to a new Tier 2 group while offline, the gate should run on first sync — that's a Phase 2 enhancement.

- **Phase 3 (The Board):** The Board's Security Status tile can show a "Relay Isolation: ✅" indicator per Tier 2 group, using the gate function as a read-only audit (call `evaluateRelayFingerprintGate` without blocking save, just displaying status). This transforms the gate from a write-time check to a continuous visibility indicator.

- **Phase 4 (Trust Attestation):** Relay isolation status could be included as a dimension in trust attestation: "This group's relay config passed fingerprint gate at <timestamp>" as attestable metadata.

### What Phase 1 needs from prior work

The fingerprint gate depends only on:
- `groupProjections` store (exists — provides group IDs and tier info)
- `loadRoomRelayPolicy()` (exists — provides per-group relay URLs)
- `normalizeRelayUrl()` (exists — needs to be exported)

Zero dependency on other Phase 1 innovations (01-the-briefing, 02-presence-from-publishing). Completely independent.

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `normalizeRelayUrl` export is a breaking change | Very Low | Low | It's adding `export` to an existing `const` — no consumers need changes |
| Gate runs on every keystroke in relay editor (reactive `$:`) | Medium | Low | Debounce the reactive statement if performance is noticeable; at ~150 comparisons max, unlikely |
| False positive: two different relays hosted by different operators on the same URL (CDN/proxy) | Very Low | Medium | Operator can downgrade to Tier 1 to bypass gate; edge case doesn't justify weakening the check |
| Operator confused by "relay isolation" terminology | Medium | Low | Error message includes plain English explanation: "Shared relays allow the relay operator to correlate membership across cells" |
| `loadRoomRelayPolicy` reads from localStorage synchronously | N/A | N/A | Already the existing pattern; not a new risk |
| Gate doesn't catch `:443` / DNS aliasing | Low | Low | Documented limitation; port normalization can be added if needed |
| Operator has many groups (100+) and gate iteration is slow | Very Low | Low | 100 × 5 relays = 500 string comparisons; sub-millisecond |

---

## Testing Plan

### Unit Tests (Vitest) — `tests/unit/engine/relay-fingerprint-gate.spec.ts`

```typescript
import {describe, expect, it} from "vitest"
import {evaluateRelayFingerprintGate, assembleGateInput} from "src/engine/relay-fingerprint-gate"

describe("engine/relay-fingerprint-gate", () => {
  describe("evaluateRelayFingerprintGate", () => {
    it("allows non-overlapping relay sets", () => {
      const result = evaluateRelayFingerprintGate({
        proposedRelays: ["wss://relay-alpha.example"],
        existingTier2Groups: new Map([
          ["group-bravo", ["wss://relay-bravo.example"]],
        ]),
      })
      expect(result.ok).toBe(true)
    })

    it("blocks overlapping relay URLs", () => {
      const result = evaluateRelayFingerprintGate({
        proposedRelays: ["wss://relay-alpha.example"],
        existingTier2Groups: new Map([
          ["group-bravo", ["wss://relay-alpha.example"]],
        ]),
      })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.overlaps).toHaveLength(1)
        expect(result.overlaps[0].relayUrl).toBe("wss://relay-alpha.example")
        expect(result.overlaps[0].conflictingGroupId).toBe("group-bravo")
      }
    })

    it("normalizes URLs before comparison (case, trailing slash)", () => {
      const result = evaluateRelayFingerprintGate({
        proposedRelays: ["wss://Relay-Alpha.Example/"],
        existingTier2Groups: new Map([
          ["group-bravo", ["wss://relay-alpha.example"]],
        ]),
      })
      expect(result.ok).toBe(false)
    })

    it("skips self-comparison when proposedGroupId matches", () => {
      const result = evaluateRelayFingerprintGate({
        proposedRelays: ["wss://relay-alpha.example"],
        existingTier2Groups: new Map([
          ["group-alpha", ["wss://relay-alpha.example"]],
        ]),
        proposedGroupId: "group-alpha",
      })
      expect(result.ok).toBe(true)
    })

    it("allows empty proposed relay set", () => {
      const result = evaluateRelayFingerprintGate({
        proposedRelays: [],
        existingTier2Groups: new Map([
          ["group-bravo", ["wss://relay-bravo.example"]],
        ]),
      })
      expect(result.ok).toBe(true)
    })

    it("allows when no existing Tier 2 groups", () => {
      const result = evaluateRelayFingerprintGate({
        proposedRelays: ["wss://relay-alpha.example"],
        existingTier2Groups: new Map(),
      })
      expect(result.ok).toBe(true)
    })

    it("detects multiple overlaps across multiple groups", () => {
      const result = evaluateRelayFingerprintGate({
        proposedRelays: ["wss://relay-alpha.example", "wss://relay-bravo.example"],
        existingTier2Groups: new Map([
          ["group-A", ["wss://relay-alpha.example"]],
          ["group-B", ["wss://relay-bravo.example"]],
        ]),
      })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.overlaps).toHaveLength(2)
      }
    })

    it("reason string includes count of overlapping relays and groups", () => {
      const result = evaluateRelayFingerprintGate({
        proposedRelays: ["wss://relay-alpha.example"],
        existingTier2Groups: new Map([
          ["group-A", ["wss://relay-alpha.example"]],
          ["group-B", ["wss://relay-alpha.example"]],
        ]),
      })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain("1 relay(s)")
        expect(result.reason).toContain("2 other Tier 2 group(s)")
      }
    })
  })

  describe("assembleGateInput", () => {
    it("filters to Tier 2 groups only", () => {
      const input = assembleGateInput({
        proposedGroupId: "group-new",
        proposedRelayUrls: ["wss://relay.example"],
        allGroupIds: ["group-new", "group-t0", "group-t1", "group-t2"],
        getGroupTier: (gid) => {
          if (gid === "group-t2") return 2
          if (gid === "group-t1") return 1
          return 0
        },
        getGroupRelays: (gid) => [`wss://${gid}-relay.example`],
      })

      expect(input.existingTier2Groups.size).toBe(1)
      expect(input.existingTier2Groups.has("group-t2")).toBe(true)
    })

    it("excludes the proposed group from existing groups", () => {
      const input = assembleGateInput({
        proposedGroupId: "group-t2",
        proposedRelayUrls: ["wss://relay.example"],
        allGroupIds: ["group-t2", "group-t2b"],
        getGroupTier: () => 2,
        getGroupRelays: (gid) => [`wss://${gid}-relay.example`],
      })

      expect(input.existingTier2Groups.has("group-t2")).toBe(false)
      expect(input.existingTier2Groups.has("group-t2b")).toBe(true)
    })
  })
})
```

### Cypress E2E — `relay-fingerprint-gate.cy.ts`

```typescript
describe("Relay Fingerprint Gate", () => {
  it("blocks relay config save when Tier 2 group overlaps with another Tier 2 group", () => {
    // Setup: Create Tier 2 group A with relay-alpha
    // Setup: Create Tier 2 group B, open relay editor
    // Action: Enter relay-alpha as group B's relay
    // Assert: Error panel visible with "Relay isolation violated"
    // Assert: Save button disabled
  })

  it("allows relay config save when Tier 2 groups have unique relays", () => {
    // Setup: Create Tier 2 group A with relay-alpha
    // Setup: Create Tier 2 group B, open relay editor
    // Action: Enter relay-bravo as group B's relay
    // Assert: No error panel
    // Assert: Save button enabled
  })

  it("does not run gate for Tier 1 groups", () => {
    // Setup: Create Tier 1 group A with relay-alpha
    // Setup: Create Tier 1 group B, open relay editor
    // Action: Enter relay-alpha as group B's relay
    // Assert: No error panel (Tier 1 groups don't require isolation)
  })

  it("error panel shows specific overlapping relays and groups", () => {
    // Setup: Trigger overlap
    // Assert: Panel lists the specific relay URL
    // Assert: Panel lists the conflicting group ID
  })
})
```

---

## Acceptance Criteria

1. ✅ `evaluateRelayFingerprintGate()` is a pure function in `src/engine/relay-fingerprint-gate.ts`
2. ✅ Returns `{ok: true}` when no overlap exists between proposed and existing Tier 2 group relays
3. ✅ Returns `{ok: false, reason, overlaps}` when any relay URL appears in both proposed and existing Tier 2 groups
4. ✅ URL comparison uses `normalizeRelayUrl` (now exported) for case, slash, and protocol consistency
5. ✅ Self-comparison is excluded via `proposedGroupId`
6. ✅ `assembleGateInput()` filters to Tier 2 groups only
7. ✅ GroupSettingsAdmin.svelte runs gate check reactively when editing Tier 2 group relays
8. ✅ Error panel displays in relay editor when gate rejects, showing specific overlapping relays and conflicting groups
9. ✅ Save button is disabled when gate rejects
10. ✅ Gate does not run for Tier 0 or Tier 1 groups
11. ✅ `normalizeRelayUrl` is exported from `relay-policy.ts` without changing behavior
12. ✅ `evaluateTierPolicy()` is unmodified
13. ✅ `validateRelayPolicy()` is unmodified
14. ✅ Existing beta test suite (243 tests) passes
15. ✅ Unit tests for `evaluateRelayFingerprintGate` and `assembleGateInput` pass
16. ✅ New Cypress spec `relay-fingerprint-gate.cy.ts` passes
