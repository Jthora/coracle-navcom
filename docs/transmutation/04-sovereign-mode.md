# 04 — Sovereign Mode

> Phase 2 Implementation Spec · Innovation 1 from [playbook.md](playbook.md)
> **Collapses:** Gap 3 (no offline posture) + Gap 2 (relay fragility)
> **Effort:** Medium · **Risk:** Medium · **Architecture changes:** One new store, one choke point modification, one new status bar component, outbox activation for group messages, optional custom service worker

---

## Table of Contents

1. [Why Sovereign Mode Exists](#why-sovereign-mode-exists)
2. [The Current Gap: Four Independent Disconnection Sites](#the-current-gap)
3. [Design Philosophy: Mode, Not Feature](#design-philosophy)
4. [How It Works](#how-it-works)
5. [Connection State Detection](#connection-state-detection)
6. [New Files](#new-files)
7. [Modified Files](#modified-files)
8. [The Choke Point: `signAndPublish`](#the-choke-point)
9. [Queue Integration Architecture](#queue-integration-architecture)
10. [Status Bar Component](#status-bar-component)
11. [Transition Management](#transition-management)
12. [Service Worker Enhancement (Optional)](#service-worker-enhancement)
13. [Per-Mode Behavior in Sovereign State](#per-mode-behavior)
14. [What Does NOT Change](#what-does-not-change)
15. [Phase Dependencies](#phase-dependencies)
16. [Risks and Mitigations](#risks-and-mitigations)
17. [Testing Plan](#testing-plan)
18. [Acceptance Criteria](#acceptance-criteria)

---

## Why Sovereign Mode Exists

SWITCHBLADE is in a tunnel. No cell signal. They compose a situation report, hit send, and the app... does nothing. No toast. No error. The event was signed, `publishThunk` was called, the relays didn't respond, and the message vanished. When SWITCHBLADE emerges from the tunnel 20 minutes later, they have no idea the message never sent. They think the team saw it.

OVERWATCH is monitoring from a café with unreliable Wi-Fi. The connection drops every few minutes. Each drop triggers a storm of "offline" toasts and relay health demotions. When it reconnects, there's no recovery — messages composed during the gap are gone. The relay health tracker demoted 3 of 5 relays, so even when the connection is fine, publishing targets fewer relays.

The vision says: *"Resilience is architecture, not a feature."* The current disconnection handling is neither. It's four independent checks (`navigator.onLine`), four independent event listeners, and two different failure modes:
- `sendMessage()` (DMs) enqueues to the offline outbox → recoverable
- `signAndPublish()` (everything else) fires into the void → irrecoverable

Sovereign Mode makes disconnection a first-class **application state** with coherent behavior across all publishing paths.

---

## The Current Gap: Four Independent Disconnection Sites {#the-current-gap}

The codebase has no centralized online/offline state. Instead, four locations independently check `navigator.onLine` and add their own event listeners:

| Location | What it does | Problem |
|----------|-------------|---------|
| `src/engine/commands.ts` (`sendMessage`) | If `!navigator.onLine`, enqueue DM to outbox | Only covers DMs, not group messages or other event types |
| `src/engine/offline/queue-drain.ts` | 3× checks `navigator.onLine`; adds `window.addEventListener("online")` for drain trigger | Only manages drain timing, not app-wide state |
| `src/partials/Toast.svelte` | Adds `online`/`offline` listeners → shows "You are currently offline" toast | Cosmetic only — no state coordination |
| `src/app/views/Onboarding.svelte` | Adds `online`/`offline` listeners → flush queues on reconnect | Onboarding-specific, not app-wide |

**What's missing:**
1. A single reactive `connectionState` store that components can subscribe to
2. A unified offline → online transition that triggers all recovery actions
3. Group messages routed through the outbox when offline
4. `signAndPublish()` offline awareness (currently has zero)
5. A persistent status indicator (not just a transient toast)

---

## Design Philosophy: Mode, Not Feature {#design-philosophy}

Sovereign Mode is not a "retry mechanism" or an "offline banner." It's a **mode** — like COMMS/MAP/OPS, it changes the app's behavioral posture.

| Aspect | Connected | Sovereign |
|--------|-----------|-----------|
| Publishing | Sign → publish to relays immediately | Sign → enqueue to outbox → display "queued" status |
| Status bar | Hidden or "Connected" | Visible: "SOVEREIGN — N queued" |
| Relay health | Track success/failure | Pause tracking (failures during disconnect are not relay quality signals) |
| Drain | Active (process outbox) | Paused (no point trying relays that are unreachable) |
| Recovery | N/A | On reconnect: resume drain, flush all queued events, optionally re-enable paused relays |

**Why "Sovereign" and not "Offline":**
- "Offline" implies broken. "Sovereign" implies autonomous operation.
- "Offline mode" suggests limited functionality. Sovereign Mode means you can compose, sign, queue, and continue operating. The app is sovereign — independent of its relays.
- Doctrine: *"NavCom does not degrade to a spinner."* Sovereign Mode is the operational state when relays are unavailable. The operator continues working.

---

## How It Works

```
navigator.onLine changes OR relay health degrades below threshold
  ↓
connectionState store transitions to "sovereign"
  ↓
Status bar appears: "SOVEREIGN — 0 queued"
  ↓
Operator composes and sends messages normally
  ↓
signAndPublish() detects sovereign mode → enqueues to outbox
  ↓
Status bar updates: "SOVEREIGN — 3 queued"
  ↓
navigator.onLine returns OR relays recover
  ↓
connectionState store transitions to "connected"
  ↓
Status bar changes: "RECONNECTING — draining 3 queued"
  ↓
Queue drain fires: sends all queued events
  ↓
Status bar shows: "CONNECTED" briefly, then hides
```

---

## Connection State Detection

### Detection Signals

| Signal | API | Reliability | When it fires |
|--------|-----|------------|---------------|
| Browser online/offline | `navigator.onLine` + `window "online"/"offline"` events | High for total disconnection; misses partial/degraded | Connection drops completely |
| Relay health circuit breaker | `relayHealthTracker.filterHealthy(urls).length === 0` | Medium — depends on recent publish attempts | All relays demoted |
| WebSocket failure | Relay connection errors (already tracked by relay health) | High — concrete evidence of unreachability | Publish attempt fails |

### Decision Logic

The connection state is derived from two inputs: browser online status and relay health.

```typescript
// Sovereign if browser says offline
if (!navigator.onLine) → "sovereign"

// Sovereign if all relays are demoted (browser says online but nothing works)
if (allRelaysDemoted) → "sovereign"

// Otherwise connected
→ "connected"
```

The relay health check catches the case where `navigator.onLine` is `true` but the network is actually down (captive portals, DNS failure, ISP issues). The browser's online/offline events are famously unreliable for partial failures — a laptop connected to a router with no upstream Internet will report `navigator.onLine === true`.

### Debounce

Transitions are debounced:
- **CONNECTED → SOVEREIGN:** 3-second debounce. Brief connection hiccups (switching Wi-Fi, momentary packet loss) don't trigger sovereign mode. If connection returns within 3 seconds, no transition.
- **SOVEREIGN → CONNECTED:** No debounce. Reconnection is good news — start draining immediately.

---

## New Files

### `src/engine/connection-state.ts` — The Centralized Connection State Store

```typescript
import {writable, derived, type Readable} from "svelte/store"
import {relayHealthTracker} from "src/engine/relay/relay-health"

// ── Types ──────────────────────────────────────────────────

export type ConnectionMode = "connected" | "sovereign"

export type ConnectionState = {
  mode: ConnectionMode
  since: number             // Unix timestamp when current mode started
  queuedCount: number       // Number of events in outbox
  lastConnectedAt: number   // When we were last in "connected" mode
}

// ── Store ──────────────────────────────────────────────────

const DEBOUNCE_TO_SOVEREIGN_MS = 3000

const initialState: ConnectionState = {
  mode: navigator?.onLine !== false ? "connected" : "sovereign",
  since: Math.floor(Date.now() / 1000),
  queuedCount: 0,
  lastConnectedAt: Math.floor(Date.now() / 1000),
}

export const connectionState = writable<ConnectionState>(initialState)

// ── Derived convenience stores ─────────────────────────────

export const isSovereign: Readable<boolean> = derived(
  connectionState,
  $state => $state.mode === "sovereign",
)

export const connectionMode: Readable<ConnectionMode> = derived(
  connectionState,
  $state => $state.mode,
)

// ── Queue count updater ────────────────────────────────────

export const updateQueuedCount = (count: number) => {
  connectionState.update(s => ({...s, queuedCount: count}))
}

// ── Transition functions ───────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const transitionToSovereign = () => {
  connectionState.update(s => {
    if (s.mode === "sovereign") return s
    return {
      ...s,
      mode: "sovereign",
      since: Math.floor(Date.now() / 1000),
    }
  })
}

const transitionToConnected = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  connectionState.update(s => {
    if (s.mode === "connected") return s
    return {
      ...s,
      mode: "connected",
      since: Math.floor(Date.now() / 1000),
      lastConnectedAt: Math.floor(Date.now() / 1000),
    }
  })
}

const evaluateConnection = () => {
  if (!navigator.onLine) {
    // Browser says offline — debounce transition
    if (!debounceTimer) {
      debounceTimer = setTimeout(transitionToSovereign, DEBOUNCE_TO_SOVEREIGN_MS)
    }
    return
  }

  // Browser says online — check relay health
  // If all tracked relays are demoted, we're effectively sovereign
  const metrics = relayHealthTracker.getAllMetrics()
  if (metrics.length > 0 && metrics.every(m => m.demoted)) {
    if (!debounceTimer) {
      debounceTimer = setTimeout(transitionToSovereign, DEBOUNCE_TO_SOVEREIGN_MS)
    }
    return
  }

  // Clear pending sovereign transition if we're actually fine
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  transitionToConnected()
}

// ── Lifecycle ──────────────────────────────────────────────

let cleanupFn: (() => void) | null = null

/**
 * Start monitoring connection state.
 * Call once at app startup (e.g., in main.js or state initialization).
 * Returns a cleanup function.
 */
export const startConnectionMonitor = (): (() => void) => {
  if (cleanupFn) return cleanupFn

  const onOnline = () => {
    evaluateConnection()
  }

  const onOffline = () => {
    evaluateConnection()
  }

  window.addEventListener("online", onOnline)
  window.addEventListener("offline", onOffline)

  // Hook into relay health demotion
  relayHealthTracker.onDemotion(() => evaluateConnection())

  // Initial evaluation
  evaluateConnection()

  cleanupFn = () => {
    window.removeEventListener("online", onOnline)
    window.removeEventListener("offline", onOffline)
    if (debounceTimer) clearTimeout(debounceTimer)
    cleanupFn = null
  }

  return cleanupFn
}
```

### `src/partials/SovereignBar.svelte` — Status Bar Component

```svelte
<script lang="ts">
  import {fade} from "svelte/transition"
  import {connectionState, isSovereign} from "src/engine/connection-state"

  $: mode = $connectionState.mode
  $: queuedCount = $connectionState.queuedCount
  $: sinceDate = new Date($connectionState.since * 1000)
  $: elapsed = formatElapsed(sinceDate)

  function formatElapsed(since: Date): string {
    const seconds = Math.floor((Date.now() - since.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  // Update elapsed every 30 seconds
  let tick = 0
  const interval = setInterval(() => tick++, 30_000)
  import {onDestroy} from "svelte"
  onDestroy(() => clearInterval(interval))

  // Re-derive elapsed whenever tick changes
  $: tick, elapsed = formatElapsed(sinceDate)
</script>

{#if $isSovereign}
  <div
    transition:fade={{duration: 200}}
    class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
           bg-warning/90 px-4 py-1.5 text-xs font-mono text-warning-content
           backdrop-blur-sm"
  >
    <div class="flex items-center gap-2">
      <span class="animate-pulse text-sm">◆</span>
      <span class="font-bold tracking-wider">SOVEREIGN</span>
      <span class="text-warning-content/70">— operating independently for {elapsed}</span>
    </div>
    <div class="flex items-center gap-3">
      {#if queuedCount > 0}
        <span class="rounded bg-warning-content/20 px-2 py-0.5">
          {queuedCount} queued
        </span>
      {/if}
      <span class="text-warning-content/50">
        awaiting relay connection
      </span>
    </div>
  </div>
{/if}
```

---

## Modified Files

### `src/engine/commands.ts` — The Choke Point {#the-choke-point}

This is the most important change in Sovereign Mode. Currently:

```typescript
export const signAndPublish = async (template, {anonymous = false} = {}) => {
  const event = await sign(template, {anonymous})
  const relays = Router.get().PublishEvent(event).policy(addMinimalFallbacks).getUrls()
  return await publishThunk({event, relays})
}
```

This function has **zero offline awareness**. If relays are unreachable, the event is signed, `publishThunk` is called, the publish silently fails, and the signed event is lost.

**Modified version:**

```typescript
import {get} from "svelte/store"
import {isSovereign, updateQueuedCount} from "src/engine/connection-state"
import {enqueue as enqueueOffline, getQueuedCount} from "src/engine/offline/outbox"

export const signAndPublish = async (template, {anonymous = false} = {}) => {
  const event = await sign(template, {anonymous})

  // SOVEREIGN MODE: queue instead of publish
  if (get(isSovereign)) {
    // Serialize the signed event + relay targets for later publishing
    const relays = Router.get().PublishEvent(event).policy(addMinimalFallbacks).getUrls()
    await enqueueSignedEvent(event, relays)
    updateQueuedCount(await getQueuedCount())
    return event
  }

  const relays = Router.get().PublishEvent(event).policy(addMinimalFallbacks).getUrls()
  return await publishThunk({event, relays})
}
```

**Why this is one `if` statement:** The choke point is narrow by design. All publishing flows through `signAndPublish`. Adding one branch at this point captures all event types (messages, follows, relay lists, metadata updates, deletions) without touching any caller. The callers don't know whether the event was published or queued — they get the signed event back either way.

**The `enqueueSignedEvent` function:** The existing `enqueue()` in `outbox.ts` expects `(channelId, content)` — it's designed for DM content queuing, not arbitrary signed events. Sovereign Mode needs to queue the full signed event (including kind, tags, pubkey, sig) plus the target relay list. This requires either:

*Option A:* Extend `outbox.ts` to accept a `QueuedSignedEvent` type alongside `QueuedMessage`
*Option B:* Create a parallel `signed-event-outbox.ts` for full events

**Recommended: Option A** — extend the existing `QueuedMessage` type with optional `signedEvent` and `targetRelays` fields. Keeps a single IndexedDB database and single drain loop.

```typescript
// Extension to QueuedMessage in outbox.ts:
export interface QueuedMessage {
  // ...existing fields...
  signedEvent?: object     // The full signed TrustedEvent, serialized
  targetRelays?: string[]  // Relay URLs to publish to when draining
}
```

When draining a queued item with `signedEvent`, the drain calls `publishThunk({event: signedEvent, relays: targetRelays})` directly instead of `sendMessage()`.

### `src/engine/offline/queue-drain.ts` — Drain Extension

The drain loop currently calls `sendMessageFn(msg.channelId, msg.content, delay)` for each queued message. Sovereign Mode adds a second path:

```typescript
// In the drain loop, for each message:
if (msg.signedEvent && msg.targetRelays) {
  // Sovereign Mode queued event — publish directly
  await publishThunk({event: msg.signedEvent, relays: msg.targetRelays})
} else {
  // Legacy DM queue — use sendMessage
  await sendMessageFn(msg.channelId, msg.content, delay)
}
```

### `src/engine/relay/relay-health.ts` — Pause During Sovereign

When transitioning to Sovereign Mode, relay health tracking should pause. Failures during disconnection are not indicative of relay quality — they're connectivity failures. Recording them would unfairly demote healthy relays.

```typescript
// Add to RelayHealthTracker class:
private paused = false

pause() { this.paused = true }
resume() { this.paused = false }

recordSuccess(url: string) {
  if (this.paused) return      // Ignore during sovereign mode
  // ...existing implementation...
}

recordFailure(url: string) {
  if (this.paused) return      // Ignore during sovereign mode
  // ...existing implementation...
}
```

The connection state monitor calls `relayHealthTracker.pause()` on sovereign transition and `relayHealthTracker.resume()` on connected transition.

### `src/partials/Toast.svelte` — Remove Independent Online/Offline Toast

The existing Toast component has its own `online`/`offline` event listeners that show "You are currently offline." With Sovereign Mode's status bar, this toast is redundant. Remove the toast listeners and let the `SovereignBar` component handle connectivity display.

### `src/main.js` — Start Connection Monitor

Add to app initialization:

```typescript
import {startConnectionMonitor} from "src/engine/connection-state"

// After other initialization...
startConnectionMonitor()
```

---

## Queue Integration Architecture

### Data Flow: Publishing in Sovereign Mode

```
┌──────────────────────────────────────────────────────────────────┐
│  Operator sends message / follows user / updates profile         │
│  ↓                                                               │
│  signAndPublish(template)                                        │
│  ├─ sign(template) → event with id, pubkey, sig, tags            │
│  ├─ get(isSovereign) === true?                                   │
│  │  ├─ YES → enqueueSignedEvent(event, relays)                   │
│  │  │        → IndexedDB "navcom-outbox" (AES-GCM encrypted)     │
│  │  │        → updateQueuedCount()                                │
│  │  │        → SovereignBar shows "N queued"                      │
│  │  │        → return event (caller doesn't know it's queued)     │
│  │  └─ NO  → publishThunk({event, relays}) (immediate)           │
│  └─ return event                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow: Draining on Reconnect

```
┌──────────────────────────────────────────────────────────────────┐
│  connectionState transitions: sovereign → connected              │
│  ↓                                                               │
│  relayHealthTracker.resume()                                     │
│  ↓                                                               │
│  drainQueue()                                                    │
│  ├─ getPending() → all "queued" messages from IndexedDB          │
│  ├─ For each message:                                            │
│  │  ├─ Has signedEvent? → publishThunk({event, relays})          │
│  │  └─ No signedEvent?  → sendMessageFn(channelId, content)      │
│  ├─ On success: dequeue(id), updateQueuedCount()                 │
│  ├─ On failure: retry with backoff (existing logic)              │
│  └─ SovereignBar shows progress, then hides                      │
│                                                                   │
│  updateQueuedCount(0) when drain completes                        │
│  ↓                                                               │
│  SovereignBar fades out                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Why the Outbox Is Already Built

The offline outbox (`src/engine/offline/outbox.ts`) has:
- IndexedDB persistence ✅
- AES-GCM encryption at rest (PBKDF2-derived key from passphrase) ✅
- Status tracking (queued → sending → sent/failed/quarantined) ✅
- Retry counting ✅
- Quota handling ✅
- Quarantine for undecryptable messages ✅

The queue drain (`src/engine/offline/queue-drain.ts`) has:
- Concurrent drain protection ✅
- Error classification (passphrase needed / network down / relay rejection) ✅
- Exponential backoff (2s → 60s, max 5 retries) ✅
- Stuck message recovery ✅
- `window "online"` event trigger ✅
- Quarantine notification ✅

The only gap is that `signAndPublish` doesn't use it. Sovereign Mode wires the choke point to the outbox. The infrastructure is ~90% built; we're connecting the last pipe.

---

## Status Bar Component {#status-bar-component}

The `SovereignBar` renders as a fixed bar at the top of the viewport. It is **always visible** in Sovereign Mode, regardless of which mode-view (COMMS/MAP/OPS) the operator is in.

### Visual States

| State | Appearance | Duration |
|-------|-----------|----------|
| SOVEREIGN (0 queued) | `◆ SOVEREIGN — operating independently for Xm` | Until reconnect |
| SOVEREIGN (N queued) | `◆ SOVEREIGN — operating independently for Xm | N queued` | Until reconnect |
| RECONNECTING | `◆ RECONNECTING — draining N queued` | During drain |
| CONNECTED (post-drain) | `◆ CONNECTED — all events delivered` | 5 seconds, then hides |

### Color scheme

- Sovereign: `bg-warning/90` (amber) — attention without alarm
- Reconnecting: `bg-info/90` (blue) — progress
- Connected: `bg-success/90` (green) — confirmation

### Layout impact

The bar is `fixed top-0` with `z-50`. Content below it needs `pt-8` when the bar is visible to prevent overlap. The app shell should conditionally add top padding:

```svelte
<div class:pt-8={$isSovereign}>
  <!-- App content -->
</div>
```

---

## Transition Management

### CONNECTED → SOVEREIGN

1. `navigator.onLine` fires `"offline"` event OR all relays demoted
2. 3-second debounce timer starts
3. If still offline/demoted after 3 seconds:
   - `connectionState.mode` → `"sovereign"`
   - `relayHealthTracker.pause()`
   - `SovereignBar` appears
   - Queue drain pauses (existing behavior: drain checks `navigator.onLine` before each message)

### SOVEREIGN → CONNECTED

1. `navigator.onLine` fires `"online"` event (no debounce)
2. `connectionState.mode` → `"connected"`
3. `relayHealthTracker.resume()`
4. `drainQueue()` fires immediately
5. `SovereignBar` shows "RECONNECTING — draining N queued"
6. As events drain: `updateQueuedCount()` decrements
7. When drain completes: `SovereignBar` shows "CONNECTED" for 5 seconds, then hides

### Flapping Prevention

If the connection flaps (offline → online → offline rapidly):
- The 3-second debounce to sovereign prevents rapid mode switching
- If already sovereign and an online event fires but connection drops again within 3 seconds, we stay sovereign (debounce prevents false connected transition... wait — connected transition has NO debounce)
- **Safeguard:** The drain loop already checks `navigator.onLine` before each message. If the connection drops mid-drain, the drain stops and messages stay queued. No data loss.

### Edge Case: Passphrase Not Available

The outbox encrypts at rest using a key derived from the user's passphrase. If the app is in Sovereign Mode and the passphrase is not available:
- Existing behavior: `enqueue()` falls back to unencrypted storage with a console warning
- This is acceptable for Phase 2. Phase 4 (PQC integration) may change this.

---

## Service Worker Enhancement (Optional) {#service-worker-enhancement}

The existing `sw-sync.ts` scaffolding registers a `"navcom-outbox-drain"` sync tag but no service worker handler catches it. This is dead code.

### Phase 2 Optional Enhancement

Add a custom service worker that handles background sync:

1. **Create `src/sw-custom.ts`** — custom service worker with sync event handler
2. **Update `vite.config.js`** — add `swSrc` to VitePWA config to use custom SW
3. **Wire `sw-sync.ts`** — the existing `requestBackgroundSync()` will now work

```typescript
// src/sw-custom.ts (conceptual)
import {precacheAndRoute} from "workbox-precaching"

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener("sync", (event) => {
  if (event.tag === "navcom-outbox-drain") {
    event.waitUntil(drainFromServiceWorker())
  }
})
```

**Why this is optional for Phase 2:** Background sync only fires when the browser is open or the user navigates to the app. For the primary use case (operator is using the app, connection drops and returns), the `window "online"` event + `drainQueue()` already handles recovery. Background sync adds value only when the app tab is in the background or closed — a nice-to-have, not critical path.

---

## Per-Mode Behavior in Sovereign State {#per-mode-behavior}

### COMMS Mode

| Action | Connected behavior | Sovereign behavior |
|--------|-------------------|-------------------|
| Send message | `publishGroupMessage` → relay | `signAndPublish` → outbox queue |
| Signal (check-in) | `publishGroupMessage` → relay | `signAndPublish` → outbox queue |
| Alert | `publishGroupMessage` → relay | `signAndPublish` → outbox queue |
| Receive messages | Live via relay subscriptions | No new messages (subscriptions disconnected) |
| Channel list | Shows existing channels from `groupProjections` | Same — `groupProjections` is in-memory, persists |
| Compose | Works normally | Works normally — composition is local |

### MAP Mode

| Action | Connected behavior | Sovereign behavior |
|--------|-------------------|-------------------|
| View map | Tile layer from CDN | Cached tiles (if PWA cached) or blank map |
| View markers | Derived from `groupProjections.sourceEvents` | Same — in-memory data persists |
| GPS location | Reads `navigator.geolocation` | Same — GPS is local, independent of network |
| Add marker (check-in) | Publishes event → appears on map | Queues event → marker does NOT appear until drain + re-derivation |

**Map tile concern:** Leaflet loads tiles from CDN (`street`/`satellite`/`terrain`). Offline = no new tiles. Previously loaded tiles may be in browser cache or service worker cache. If no tiles load, the map shows a grid of grey squares. This is acceptable — the operator knows they're in Sovereign Mode from the status bar. A future enhancement could pre-cache tile regions.

### OPS Mode

| Action | Connected behavior | Sovereign behavior |
|--------|-------------------|-------------------|
| Group status grid | Live from `groupSummaries` | Stale — shows last-known state |
| Presence badges (Phase 1) | Updates from `groupMemberPresence` | Stale — `now` doesn't update, badges freeze at last derivation |
| Activity feed | Last 8 events from `groupProjections` | Same — shows last-known events |
| Map thumbnail | Tiles from CDN | Cached or blank |
| Queue status | Hidden | Visible — shows outbox queue depth |

---

## What Does NOT Change

1. **`navcomMode` store is unchanged.** COMMS/MAP/OPS mode selection is orthogonal to connection state.
2. **`synced()` store pattern is unchanged.** All localStorage-backed stores (navcomMode, activeChannelByMode, composeDrafts, mapViewport, etc.) continue to work offline — they don't depend on relays.
3. **`groupProjections` is unchanged.** The in-memory projection continues to hold all loaded events. It doesn't receive new events during Sovereign Mode, but existing data persists.
4. **`publishGroupMessage()` is unchanged.** It calls `signAndPublish()` internally. The sovereign branch is inside `signAndPublish`, invisible to callers.
5. **The DM offline path is unchanged.** `sendMessage()` already enqueues offline DMs. Sovereign Mode adds the same capability to `signAndPublish()` for non-DM events.
6. **`evaluateTierPolicy()` is unchanged.** Tier policy operates on transport mode, not connection state.
7. **Relay fingerprint gate is unchanged.** It operates on relay config, not connection state.
8. **Marker derivation is unchanged.** `deriveMarkers()` processes events from `groupProjections`. During Sovereign Mode, it shows the last-known state.
9. **Onboarding is unchanged.** Onboarding flows don't publish events that need offline queuing.
10. **PQC crypto is unchanged.** Encryption happens at sign time, which occurs normally in Sovereign Mode.

---

## Phase Dependencies

### What Phase 1 provides to Sovereign Mode

- **02-Presence-from-Publishing:** The presence store shows stale/cold badges during Sovereign Mode, which is correct — operators go cold when disconnected. On reconnect, drained events update `groupProjections`, which triggers presence recomputation. The status bar + presence badges together tell the full story: "You were sovereign for 15m; now connected; drain complete; members showing fresh presence."

- **03-Relay-Fingerprint-Gate:** No interaction. Relay config editing is unlikely during Sovereign Mode (no relay connectivity to test against).

### What Sovereign Mode provides to later phases

- **Phase 3 (The Board):** The Board can show a "Connection Status" tile that reads `connectionState` and displays mode, queue depth, time in current mode, relay health (paused/demoted/healthy). The Board's tiles read Svelte stores — `connectionState` is just another store.

- **Phase 4 (Trust Attestation):** Attestation events queued during Sovereign Mode will drain to relays on reconnect. The attestation's `created_at` timestamp reflects when it was signed (during Sovereign Mode), not when it was published. This is correct — the attestation's validity period starts at signing, not publishing.

### What Sovereign Mode requires from prior work

- **Offline outbox** (exists, orphaned) — must be wired to `signAndPublish`
- **Queue drain** (exists, orphaned) — must handle signed events, not just DMs
- **Relay health tracker** (exists) — must add `pause()`/`resume()`
- **`sign()` function** (exists) — works offline (signs with local key)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `signAndPublish` branch is wrong — events queued but never drained | Low | High | Comprehensive E2E test: queue 3 events in sovereign mode, reconnect, verify all 3 published |
| IndexedDB quota exceeded with many queued events | Low | Medium | Existing `QuotaExceededError` handling in `enqueue()` shows user-friendly error |
| Passphrase not available → events queued unencrypted | Medium | Medium | Existing fallback behavior; acceptable for Phase 2. Log warning. |
| `relayHealthTracker.pause()` causes stale metrics post-reconnect | Low | Low | `resume()` only re-enables tracking; existing data stays. Metrics naturally refresh with subsequent operations. |
| Flapping connection causes multiple drain starts | Medium | Low | Drain guard (`draining` boolean) prevents concurrent drains. Messages in "sending" status are recovered on next drain. |
| Queued events have stale `created_at` (signed minutes/hours ago) | Medium | Low | Events are signed immediately — `created_at` reflects true composition time. Relays may reject events with old timestamps if >1h. Mitigation: if drain fails with "event too old," re-sign the template and retry. (Phase 2 enhancement, not required.) |
| Map tiles unavailable offline → blank map | High | Low | Expected, acceptable. Status bar communicates mode. Future: tile pre-caching. |
| Toast.svelte still shows "You are offline" toast alongside SovereignBar | Low | Low | Remove the toast's independent online/offline listeners |
| `navigator.onLine` reports `true` when behind captive portal | Medium | Low | Relay health circuit-breaker catches this — if all relays are demoted, transition to sovereign regardless of `navigator.onLine` |

---

## Testing Plan

### Unit Tests (Vitest) — `tests/unit/engine/connection-state.spec.ts`

```typescript
describe("engine/connection-state", () => {
  describe("connectionState store", () => {
    it("initializes to 'connected' when navigator.onLine is true")
    it("initializes to 'sovereign' when navigator.onLine is false")
  })

  describe("transitions", () => {
    it("transitions to 'sovereign' when offline event fires (after debounce)")
    it("transitions to 'connected' immediately when online event fires")
    it("does not transition to 'sovereign' if connection returns within debounce window")
    it("updates 'since' timestamp on each transition")
    it("preserves 'lastConnectedAt' during sovereign mode")
  })

  describe("queue count", () => {
    it("updateQueuedCount() updates the store's queuedCount")
    it("queue count persists across mode transitions")
  })
})
```

### Unit Tests — `tests/unit/engine/commands-sovereign.spec.ts`

```typescript
describe("signAndPublish in sovereign mode", () => {
  it("enqueues to outbox when isSovereign is true")
  it("publishes normally when isSovereign is false")
  it("updates queued count after enqueue")
  it("returns the signed event regardless of mode")
})
```

### Cypress E2E — `sovereign-mode.cy.ts`

```typescript
describe("Sovereign Mode", () => {
  it("status bar appears when connection drops", () => {
    // Simulate offline (cy.intercept + navigator.onLine mock)
    // Assert SovereignBar visible
    // Assert "SOVEREIGN" text present
  })

  it("messages queue in sovereign mode and drain on reconnect", () => {
    // Simulate offline
    // Send a message in COMMS view
    // Assert "1 queued" in SovereignBar
    // Simulate online
    // Assert drain completes
    // Assert SovereignBar shows "CONNECTED" then hides
  })

  it("status bar shows queue depth", () => {
    // Simulate offline
    // Send 3 messages
    // Assert "3 queued" displayed
  })

  it("does not trigger sovereign mode for brief connection hiccups", () => {
    // Simulate offline → wait 1 second → simulate online
    // Assert SovereignBar NEVER appeared (debounce prevented it)
  })

  it("relay health pause prevents false demotions during sovereign mode", () => {
    // Enter sovereign mode
    // Verify relay health tracking is paused
    // Reconnect
    // Verify relay health tracking is resumed
  })
})
```

---

## Acceptance Criteria

1. ✅ `connectionState` writable store exists in `src/engine/connection-state.ts` with `mode`, `since`, `queuedCount`, `lastConnectedAt`
2. ✅ `isSovereign` derived store available for component subscriptions
3. ✅ Connection transitions to "sovereign" after 3-second debounce when `navigator.onLine` is false OR all relays demoted
4. ✅ Connection transitions to "connected" immediately when `navigator.onLine` returns true and relays available
5. ✅ `signAndPublish()` enqueues to outbox when `isSovereign === true`
6. ✅ Queued events include full signed event + target relay URLs
7. ✅ Queue drain publishes signed events via `publishThunk()` on reconnect
8. ✅ `SovereignBar` component displays mode, elapsed time, and queue depth
9. ✅ `SovereignBar` is visible in all mode-views (COMMS/MAP/OPS)
10. ✅ `relayHealthTracker.pause()` called on sovereign transition
11. ✅ `relayHealthTracker.resume()` called on connected transition
12. ✅ `updateQueuedCount()` keeps SovereignBar in sync with outbox
13. ✅ Toast.svelte's independent online/offline listeners removed
14. ✅ `startConnectionMonitor()` called at app startup
15. ✅ Existing beta test suite (243 tests) passes
16. ✅ Unit tests for connection-state store and signAndPublish sovereign branch pass
17. ✅ Cypress sovereign-mode spec passes
18. ✅ No new Nostr event kinds
19. ✅ Composition, navigation, and store persistence work normally in Sovereign Mode
