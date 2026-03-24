# 02 — Presence-from-Publishing

> Phase 1 Implementation Spec · Innovation 4 from [playbook.md](playbook.md)
> **Collapses:** Gap 7 (no temporal currency)
> **Effort:** Low · **Risk:** Minimal · **Architecture changes:** One new derived store, two new UI components

---

## Table of Contents

1. [Why This Matters](#why-this-matters)
2. [The Rejected Alternative: Heartbeat System](#the-rejected-alternative-heartbeat-system)
3. [How Presence-from-Publishing Works](#how-presence-from-publishing-works)
4. [Current State: What Already Exists](#current-state-what-already-exists)
5. [New Files](#new-files)
6. [Modified Files](#modified-files)
7. [Store Architecture](#store-architecture)
8. [UI Components](#ui-components)
9. [Reactivity and Performance](#reactivity-and-performance)
10. [The "Signal" Reframe](#the-signal-reframe)
11. [What Does NOT Change](#what-does-not-change)
12. [Phase Dependencies](#phase-dependencies)
13. [Risks and Mitigations](#risks-and-mitigations)
14. [Testing Plan](#testing-plan)
15. [Acceptance Criteria](#acceptance-criteria)

---

## Why This Matters

OVERWATCH looks at the map and sees 12 check-in markers across a region. How many of those operators are still there? The map doesn't say. A check-in from 5 minutes ago renders identically to one from 23 hours ago (both within the 24h time-range filter). Marker derivation (`deriveMarkers()` in `marker-derivation.ts`) extracts `timestamp: event.created_at` but this timestamp is only used for time-range *filtering* (cut off events older than 1h/24h/7d). Within the filter window, every marker looks the same.

ARCHITECT manages 5 groups. In OPS view, each group shows member count, role distribution, message-type tallies, and unread count. But ARCHITECT cannot see: "Cell Alpha: 6/8 members active in last 15 minutes, 2 cold." The data exists — every event in `GroupProjection.sourceEvents` has `pubkey` and `created_at` — but it's not aggregated by operator freshness.

The vision document says *"The map is the territory."* A map without temporal context is a map that lies about its certainty. The doctrine demands epistemic integrity: every piece of displayed information should carry a freshness signal.

---

## The Rejected Alternative: Heartbeat System

The instinctive solution to "I need to know who's alive" is a heartbeat: publish a keep-alive event every N minutes. This is how most presence systems work (XMPP, IRC, game servers).

**Why we're not doing this:**

1. **New event kind required.** A heartbeat event (kind-????) would need to be defined, published, subscribed to, and filtered. Every relay would receive these events. For 100 operators checking in every 5 minutes, that's 28,800 events/day of pure chatter.

2. **Battery drain on mobile.** SWITCHBLADE has their phone in their pocket. A heartbeat timer means the app must wake periodically — exactly the kind of background process that drains battery on mobile. The VitePWA service worker config uses `CacheFirst` for static assets but has no background sync integration for periodic events.

3. **The data already exists.** Every check-in, message, alert, sitrep, and spotrep is a signed event with a timestamp and pubkey. If Operator X sent a check-in 3 minutes ago, we know Operator X was active 3 minutes ago. We don't need a *separate* "I'm here" event — the check-in *is* the proof of activity.

4. **Dock trine alignment.** The vision says *"Resilience is architecture, not a feature."* A heartbeat system adds a feature (periodic event publishing) that could fail independently. Presence-from-publishing is architecture — it derives state from data that already flows through the system.

**What we do instead:** Derive presence from the MAX(created_at) of any event published by a given pubkey within a given group. Zero new events. Zero new subscriptions. ~30 lines of derived store.

---

## How Presence-from-Publishing Works

```
GroupProjection.sourceEvents → for each event, extract (pubkey, created_at)
                             → for each pubkey, keep MAX(created_at) = lastSeen
                             → classify lastSeen into: active | stale | cold
                             → expose as reactive Svelte store
```

**Thresholds:**

| Level | Symbol | Threshold | Meaning |
|-------|--------|-----------|---------|
| Active | 🟢 | < 15 minutes since last event | Operator published recently; likely present |
| Stale | 🟡 | 15 min – 1 hour | Operator may be offline, silent, or in transit |
| Cold | 🔴 | > 1 hour | No recent activity; status unknown |

**Group health (aggregate):**

| Level | Condition | Meaning |
|-------|-----------|---------|
| 🟢 Healthy | ≥50% of members are Active | Group is operationally responsive |
| 🟡 Degraded | >0% Active but <50% | Group has some responsive members |
| 🔴 Cold | 0% Active | No recent activity from any member |

---

## Current State: What Already Exists

### GroupProjection (the data source)

From `src/domain/group-projection.ts` and `src/domain/group.ts`:

```typescript
type GroupProjection = {
  group: GroupEntity
  members: Record<string, GroupMembership>    // pubkey → role/status
  audit: GroupAuditEvent[]
  sourceEvents: TrustedEvent[]               // ALL raw Nostr events for this group
}
```

`sourceEvents` contains every event that built the projection: metadata changes, membership changes, messages, moderation actions, welcomes. Every event has:
- `pubkey: string` — who published it
- `created_at: number` — Unix timestamp of publication
- `kind: number` — Nostr event kind
- `id: string` — unique event identifier

The projection is built via `applyGroupEvent()` which pushes each validating event to `sourceEvents`. This means `sourceEvents` is the complete chronological record of group activity.

### groupProjections store (the reactive wrapper)

From `src/app/groups/state.ts`:

```typescript
export const groupProjections = writable<Map<string, GroupProjection>>(new Map())
```

This is a writable Svelte store containing the Map of all group projections. It updates when new events arrive via the hydration system. Any derived store that reads `$groupProjections` will recompute when events change.

### What already derives from groupProjections

```typescript
// Group summaries — used in OPS view channel cards
export const groupSummaries = derived([groupProjections, pubkey], ...)

// Unread counts — used for badges
export const unreadGroupMessageCounts = derived([groupProjections, checked, pubkey], ...)

// Total unread — used for mode tab badge
export const totalUnreadGroupMessages = derived(unreadGroupMessageCounts, ...)
```

Our `groupMemberPresence` store follows the same pattern: derived from `groupProjections`, reactive, used by UI components.

### Map marker system

From `src/app/views/marker-derivation.ts`:

```typescript
interface ChannelMarker {
  id: string          // event ID
  lat: number
  lng: number
  type: "check-in" | "alert" | "sitrep" | "spotrep" | "message"
  author: string      // event.pubkey
  timestamp: number   // event.created_at
  preview: string
}

function deriveMarkers(messages: TrustedEvent[]): ChannelMarker[]
function deriveMemberPositions(markers): ChannelMarker[]
  // Filters check-ins → groups by author → keeps latest per member
```

`deriveMemberPositions` already computes "latest position per operator" — but only for map rendering. It doesn't classify freshness.

### Check-in button (CommsView.svelte)

```typescript
async function sendCheckIn() {
  const extraTags: string[][] = [["msg-type", "check-in"]]
  // Try GPS (5s timeout, silent failure)
  if (navigator.geolocation) {
    const pos = await new Promise(...)
    extraTags.push(["location", `${lat},${lng}`])
    extraTags.push(["g", geohash])
  }
  await publishGroupMessage({
    groupId: $activeChannel,
    content: "Check-in",
    requestedMode: transportMode,
    extraTags,
  })
  showInfo("Check-in sent")
}
```

This is the existing deliberate presence mechanism. It works. We're not changing the event — just relabeling the button and adding derived state.

---

## New Files

### `src/app/groups/presence.ts` — Core Presence Store

```typescript
import {derived} from "svelte/store"
import {groupProjections} from "src/app/groups/state"

// ── Types ──────────────────────────────────────────────────

export type PresenceLevel = "active" | "stale" | "cold"

export type MemberPresence = {
  pubkey: string
  lastSeen: number        // Unix timestamp (seconds)
  level: PresenceLevel
}

// ── Thresholds ─────────────────────────────────────────────

const ACTIVE_THRESHOLD_SECONDS = 15 * 60   // 15 minutes
const STALE_THRESHOLD_SECONDS = 60 * 60    // 1 hour

export const classifyPresence = (lastSeen: number, now: number): PresenceLevel => {
  const age = now - lastSeen
  if (age < ACTIVE_THRESHOLD_SECONDS) return "active"
  if (age < STALE_THRESHOLD_SECONDS) return "stale"
  return "cold"
}

// ── Derived Store ──────────────────────────────────────────

/**
 * Per-group, per-member presence derived from existing event timestamps.
 *
 * For each group in groupProjections, iterates sourceEvents and computes
 * MAX(created_at) per pubkey. Classifies into active/stale/cold.
 *
 * Returns Map<groupId, Map<pubkey, MemberPresence>>.
 *
 * Recomputes when groupProjections updates (new events arrive).
 * The `now` timestamp is captured at derivation time. For the badge
 * to update without new events, consuming components should set a
 * 60-second interval that triggers a re-read.
 */
export const groupMemberPresence = derived(groupProjections, $groupProjections => {
  const now = Math.floor(Date.now() / 1000)
  const result = new Map<string, Map<string, MemberPresence>>()

  for (const [groupId, projection] of $groupProjections.entries()) {
    const memberMap = new Map<string, MemberPresence>()

    for (const event of projection.sourceEvents) {
      const existing = memberMap.get(event.pubkey)
      const lastSeen = existing
        ? Math.max(existing.lastSeen, event.created_at)
        : event.created_at

      memberMap.set(event.pubkey, {
        pubkey: event.pubkey,
        lastSeen,
        level: classifyPresence(lastSeen, now),
      })
    }

    result.set(groupId, memberMap)
  }

  return result
})

// ── Helpers ────────────────────────────────────────────────

/**
 * Get presence for a specific member in a specific group.
 * Returns null if the member has no events in the group.
 */
export const getMemberPresence = (
  presenceMap: Map<string, Map<string, MemberPresence>>,
  groupId: string,
  pubkey: string,
): MemberPresence | null => {
  return presenceMap.get(groupId)?.get(pubkey) ?? null
}

/**
 * Get aggregate group health based on member presence distribution.
 *
 * - 🟢 "active" if ≥50% of members with events are Active
 * - 🟡 "stale" if >0% Active but <50%
 * - 🔴 "cold" if 0% Active or no members
 */
export const getGroupHealth = (
  presenceMap: Map<string, Map<string, MemberPresence>>,
  groupId: string,
): PresenceLevel => {
  const members = presenceMap.get(groupId)
  if (!members || members.size === 0) return "cold"

  let activeCount = 0
  for (const member of members.values()) {
    if (member.level === "active") activeCount++
  }

  const ratio = activeCount / members.size
  if (ratio >= 0.5) return "active"
  if (ratio > 0) return "stale"
  return "cold"
}

/**
 * Get a summary of member presence for a group.
 * Returns counts per level and total.
 */
export const getGroupPresenceSummary = (
  presenceMap: Map<string, Map<string, MemberPresence>>,
  groupId: string,
): {active: number; stale: number; cold: number; total: number} => {
  const members = presenceMap.get(groupId)
  if (!members) return {active: 0, stale: 0, cold: 0, total: 0}

  let active = 0, stale = 0, cold = 0
  for (const member of members.values()) {
    if (member.level === "active") active++
    else if (member.level === "stale") stale++
    else cold++
  }

  return {active, stale, cold, total: members.size}
}
```

### `src/partials/PresenceBadge.svelte` — Freshness Badge

```svelte
<script lang="ts">
  import type {PresenceLevel} from "src/app/groups/presence"

  export let level: PresenceLevel
  export let showLabel = false
  export let size: "sm" | "md" = "sm"

  const config: Record<PresenceLevel, {emoji: string; label: string; title: string}> = {
    active: {emoji: "🟢", label: "Active", title: "Active — published within 15 minutes"},
    stale: {emoji: "🟡", label: "Stale", title: "Stale — last activity 15 min to 1 hour ago"},
    cold: {emoji: "🔴", label: "Cold", title: "Cold — no activity for over 1 hour"},
  }

  $: display = config[level]
  $: sizeClass = size === "md" ? "text-sm" : "text-xs"
</script>

<span class="inline-flex items-center gap-1 {sizeClass}" title={display.title}>
  <span>{display.emoji}</span>
  {#if showLabel}
    <span class="text-nc-text-muted">{display.label}</span>
  {/if}
</span>
```

### `src/partials/GroupHealthBadge.svelte` — Group-Level Health

```svelte
<script lang="ts">
  import type {PresenceLevel} from "src/app/groups/presence"
  import {getGroupHealth, getGroupPresenceSummary, groupMemberPresence} from "src/app/groups/presence"

  export let groupId: string

  $: health = getGroupHealth($groupMemberPresence, groupId)
  $: summary = getGroupPresenceSummary($groupMemberPresence, groupId)

  const healthConfig: Record<PresenceLevel, {emoji: string; label: string}> = {
    active: {emoji: "🟢", label: "Healthy"},
    stale: {emoji: "🟡", label: "Degraded"},
    cold: {emoji: "🔴", label: "Cold"},
  }

  $: display = healthConfig[health]
  $: tooltip = `${display.label} — ${summary.active} active, ${summary.stale} stale, ${summary.cold} cold of ${summary.total}`
</script>

<span class="inline-flex items-center gap-1 text-xs" title={tooltip}>
  <span>{display.emoji}</span>
  <span class="text-nc-text-muted">{summary.active}/{summary.total}</span>
</span>
```

---

## Modified Files

### `src/app/groups/state.ts` — Re-export presence from group state barrel

Add at the bottom of the file:

```typescript
// Re-export presence store for convenience
export {groupMemberPresence, getMemberPresence, getGroupHealth, getGroupPresenceSummary} from "src/app/groups/presence"
```

### `src/app/views/CommsView.svelte` — Relabel "Check-In" to "Signal"

Change the check-in button label:

```svelte
<!-- Current -->
<button on:click={sendCheckIn} disabled={!$signer}>
  <i class="fa fa-map-pin text-xs text-success" />
  Check-In
</button>

<!-- New -->
<button on:click={sendCheckIn} disabled={!$signer}>
  <i class="fa fa-satellite-dish text-xs text-success" />
  Signal
</button>
```

Change the success toast:

```typescript
// Current
showInfo("Check-in sent")

// New
showInfo("Signal transmitted")
```

Change the failure toast:

```typescript
// Current
showWarning("Failed to send check-in")

// New
showWarning("Signal failed — no relay connection")
```

**Why `fa-satellite-dish`:** The satellite dish icon conveys "broadcasting" rather than "dropping a pin." It reinforces the shift from social check-in to operational transmission. If FA doesn't have this icon in the loaded set, `fa-broadcast-tower` or `fa-signal` are alternatives.

### `src/app/views/OpsView.svelte` — Add group health badges

In the channel status grid, add `GroupHealthBadge` next to each group card:

```svelte
<script>
  // Add to imports:
  import GroupHealthBadge from "src/partials/GroupHealthBadge.svelte"
</script>

{#each $groupSummaries as ch (ch.id)}
  <div class="...existing group card classes...">
    <!-- Existing: group title, member count, encryption badge -->
    <div class="flex items-center gap-2">
      <span class="font-semibold">{ch.title}</span>
      <GroupHealthBadge groupId={ch.id} />
    </div>
    <!-- ...rest of card... -->
  </div>
{/each}
```

### OPS view member list — Add per-member presence badges

Wherever OPS view displays member lists within groups:

```svelte
<script>
  import PresenceBadge from "src/partials/PresenceBadge.svelte"
  import {getMemberPresence, groupMemberPresence} from "src/app/groups/presence"
</script>

{#each members as member}
  <div class="flex items-center gap-2">
    <span>{member.displayName || member.pubkey.slice(0, 8)}</span>
    {@const presence = getMemberPresence($groupMemberPresence, groupId, member.pubkey)}
    {#if presence}
      <PresenceBadge level={presence.level} />
    {/if}
  </div>
{/each}
```

---

## Store Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Relay Events (TrustedEvent[])                                   │
│  ↓                                                               │
│  hydrateGroupsFromEvents() → buildGroupProjection()              │
│  ↓                                                               │
│  groupProjections (writable store)                               │
│  ├→ groupSummaries (existing derived)                            │
│  ├→ unreadGroupMessageCounts (existing derived)                  │
│  └→ groupMemberPresence (NEW derived)                            │
│      ├→ PresenceBadge (per-member: 🟢🟡🔴)                      │
│      ├→ GroupHealthBadge (per-group: 🟢X/Y)                      │
│      └→ [Phase 3: Board tiles]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Why derived and not computed on-demand

Three reasons:

1. **Reactive.** When `groupProjections` updates (new event arrives), all presence data recomputes. Components subscribing to `groupMemberPresence` automatically re-render.

2. **Consistent.** Every component sees the same presence data for the same point in time. No risk of two badges showing different states for the same operator.

3. **Follows existing pattern.** `groupSummaries` and `unreadGroupMessageCounts` are both derived from `groupProjections` in exactly this way. The presence store is architecturally identical.

---

## Reactivity and Performance

### When does the store recompute?

The store recomputes when `groupProjections` fires (i.e., when any group receives a new event). This is the same trigger as `groupSummaries` and `unreadGroupMessageCounts` — well-trodden ground.

### What about the `now` timestamp?

The `now` value is captured at derivation time: `Math.floor(Date.now() / 1000)`. This means:

- When a new event arrives → store recomputes with fresh `now` → badges update correctly
- When NO events arrive for 15+ minutes → `now` is stale → an Active member could still show 🟢 even after 15 minutes

**Solution: Periodic re-derivation.** Components that display presence should trigger a re-read every 60 seconds. Two approaches:

**Option A: Interval in consuming component** (simpler, recommended for Phase 1):

```svelte
<script>
  import {onMount} from "svelte"
  import {groupMemberPresence} from "src/app/groups/presence"

  let presenceSnapshot = $groupMemberPresence
  
  // Force re-read every 60 seconds to update classification
  onMount(() => {
    const interval = setInterval(() => {
      presenceSnapshot = $groupMemberPresence
    }, 60_000)
    return () => clearInterval(interval)
  })
</script>
```

**Option B: Tick store** (if multiple components need it):

```typescript
// A store that ticks every 60 seconds, forcing re-derivation
const presenceTick = readable(0, set => {
  const interval = setInterval(() => set(Date.now()), 60_000)
  return () => clearInterval(interval)
})

export const groupMemberPresence = derived(
  [groupProjections, presenceTick],
  ([$groupProjections, _tick]) => {
    const now = Math.floor(Date.now() / 1000)
    // ...same derivation logic...
  }
)
```

Option A is sufficient for Phase 1. If Phase 3 (The Board) needs multiple tiles reading presence, Option B avoids per-component intervals.

### Performance on large groups

For a group with 100 members and 10,000 source events, the derivation iterates 10,000 events and maintains a Map of 100 entries. This is ~microseconds in JavaScript. The existing `unreadGroupMessageCounts` derivation does the same thing (iterates sourceEvents, classifies, counts). No performance concern at current scale.

For extreme scale (1000+ members, 100,000+ events), the derivation could be optimized with an incremental approach (track lastSeen per pubkey as events arrive rather than re-scanning). But this is premature optimization — Phase 1 ships with the simple approach.

---

## The "Signal" Reframe

The check-in button is renamed "Signal" throughout the UI. This is more than a label change — it's a conceptual reframe that aligns with the transmutation doctrine.

### Why "Signal" instead of "Check-In"

| "Check-In" | "Signal" |
|-------------|----------|
| Social media metaphor ("checking in" at a location) | Military/operational metaphor (broadcasting a signal) |
| Implies casual, optional | Implies deliberate, purposeful |
| Passive ("I'm here") | Active ("I'm transmitting my status") |
| No urgency | Can carry urgency |

### What changes

| Location | Current | New |
|----------|---------|-----|
| CommsView button label | "Check-In" | "Signal" |
| CommsView button icon | `fa-map-pin` (📍) | `fa-satellite-dish` (📡) or `fa-signal` |
| Success toast | "Check-in sent" | "Signal transmitted" |
| Failure toast | "Failed to send check-in" | "Signal failed — no relay connection" |
| Tooltip (if exists) | — | "Broadcast your position and status. Updates your presence on the map and in group views." |

### What does NOT change

The underlying event structure is unchanged:
- Event kind: 445 (group message)
- Tags: `["msg-type", "check-in"]`, `["location", "lat,lng"]`, `["g", geohash]` (if GPS available)
- Content: "Check-in"
- Publishing path: `publishGroupMessage()` → `signAndPublish()` → relays

The tag value `"check-in"` remains `"check-in"` because it's a protocol-level identifier used by marker derivation and filtering. The UI label "Signal" is display-only.

---

## What Does NOT Change

1. **No new Nostr event kinds.** The check-in event (kind 445 with `["msg-type", "check-in"]`) is unchanged.
2. **No new relay subscriptions.** Presence is derived from events already loaded into `groupProjections`.
3. **No new IndexedDB databases.** No persistence beyond what `groupProjections` already manages.
4. **No map layer changes.** Map marker rendering, styling, and filtering are unchanged in Phase 1. (Marker opacity based on presence is a Phase 3/4 enhancement.)
5. **No check-in behavior changes.** GPS capture, geohash computation, group message publishing — all unchanged.
6. **No background processes.** No periodic publishing, no heartbeat, no timer that publishes events.

---

## Phase Dependencies

### What Phase 1 provides to later phases

- **Phase 2 (Sovereign Mode):** The status bar can show "Last sync: 5m ago" using the operator's own `lastSeen` from the presence store. When transitioning SOVEREIGN → CONNECTED, presence data shows which groups had activity during the sovereign period.

- **Phase 3 (The Board):** Multiple tiles depend on presence:
  - Group Status tile uses `GroupHealthBadge` (🟢🟡🔴 per group)
  - Personnel Status tile uses `PresenceBadge` (🟢🟡🔴 per member in selected group)
  - Activity Stream tile can annotate events with member freshness
  - Map Overview tile can shade markers by presence level

- **Phase 4 (Trust Attestation):** Combined with attestation, presence creates a two-dimensional trust picture: "This operator is attested (trust) AND was active 3 minutes ago (freshness)" vs. "This operator is unattested AND cold." The Board can display both dimensions.

### What Phase 1 does NOT need from other phases

Presence-from-Publishing is fully independent. It requires only `groupProjections` (already exists) and Svelte's derived store mechanism. No dependency on any other innovation.

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `now` becomes stale when no events arrive | High | Low | 60-second interval re-read in consuming components (Option A) |
| Large groups with many sourceEvents cause slow derivation | Low | Low | Same iteration pattern as existing `unreadGroupMessageCounts`; optimize only if measured |
| "Signal" label confuses users expecting "Check-In" | Medium | Low | Tooltip explains purpose; underlying action unchanged |
| Threshold values (15m/1h) poorly calibrated for real ops | Medium | Medium | Constants at top of `presence.ts`; easily tuned based on field testing |
| sourceEvents may not include all event types (e.g., metadata-only events) | Low | Low | All events in sourceEvents have pubkey + created_at; any event type is presence signal |
| `fa-satellite-dish` icon may not be in the loaded Font Awesome subset | Medium | Low | Fallback to `fa-signal` or `fa-broadcast-tower` |

---

## Testing Plan

### Unit Tests (Vitest)

```typescript
describe("classifyPresence", () => {
  it("returns 'active' for events within 15 minutes", () => {
    const now = 1711152000
    expect(classifyPresence(now - 60, now)).toBe("active")        // 1 min ago
    expect(classifyPresence(now - 14 * 60, now)).toBe("active")   // 14 min ago
  })

  it("returns 'stale' for events between 15 min and 1 hour", () => {
    const now = 1711152000
    expect(classifyPresence(now - 15 * 60, now)).toBe("stale")    // exactly 15 min
    expect(classifyPresence(now - 59 * 60, now)).toBe("stale")    // 59 min
  })

  it("returns 'cold' for events older than 1 hour", () => {
    const now = 1711152000
    expect(classifyPresence(now - 60 * 60, now)).toBe("cold")     // exactly 1 hour
    expect(classifyPresence(now - 24 * 60 * 60, now)).toBe("cold") // 24 hours
  })
})

describe("getGroupHealth", () => {
  it("returns 'active' when ≥50% of members are active", () => { ... })
  it("returns 'stale' when >0% but <50% are active", () => { ... })
  it("returns 'cold' when 0% are active", () => { ... })
  it("returns 'cold' for empty groups", () => { ... })
})

describe("getGroupPresenceSummary", () => {
  it("counts members by presence level", () => { ... })
  it("returns zeros for unknown groups", () => { ... })
})
```

### Cypress E2E: `presence-badges.cy.ts`

```typescript
describe("Presence-from-Publishing", () => {
  it("Signal button exists in CommsView with correct icon", () => {
    // Navigate to COMMS mode
    // Assert "Signal" button visible
    // Assert satellite-dish (or signal) icon present
  })

  it("Signal sends check-in event successfully", () => {
    // Click Signal button
    // Assert "Signal transmitted" toast appears
  })

  it("GroupHealthBadge renders on OPS view group cards", () => {
    // Navigate to OPS mode
    // Assert each group card has a health badge (🟢 or 🟡 or 🔴)
  })

  it("No social check-in language remains in CommsView", () => {
    // Navigate to COMMS
    // Assert "Check-In" text does not appear as button label
    // Assert "Check-in sent" does not appear in any visible toast
  })
})
```

---

## Acceptance Criteria

1. ✅ `groupMemberPresence` derived store computes per-group, per-member presence from `groupProjections.sourceEvents`
2. ✅ `classifyPresence()` correctly classifies events into active (<15m) / stale (15m–1h) / cold (>1h)
3. ✅ `PresenceBadge` renders 🟢🟡🔴 with correct title text
4. ✅ `GroupHealthBadge` renders aggregate group health (🟢🟡🔴 + active/total ratio) on OPS view group cards
5. ✅ OPS view member lists show per-member `PresenceBadge`
6. ✅ Check-in button relabeled to "Signal" with updated icon
7. ✅ Success toast reads "Signal transmitted"
8. ✅ Failure toast reads "Signal failed — no relay connection"
9. ✅ No new Nostr event kinds published
10. ✅ No new relay subscriptions opened
11. ✅ Check-in event structure unchanged (kind 445, `["msg-type", "check-in"]`)
12. ✅ Existing beta test suite (243 tests) passes
13. ✅ Unit tests for `classifyPresence`, `getGroupHealth`, `getGroupPresenceSummary` pass
14. ✅ New `presence-badges.cy.ts` Cypress spec passes
