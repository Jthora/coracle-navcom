# Architecture Patterns

> Cross-cutting patterns used across all Transmutation specs
> Reference for implementors — explains the how-it-works-here conventions
> so each spec doesn't have to repeat the same codebase context.

---

## Table of Contents

1. [Synced Store Persistence](#synced-store-persistence)
2. [Derived Store Chains](#derived-store-chains)
3. [The signAndPublish Pipeline](#the-signandpublish-pipeline)
4. [deriveEvents: Reactive Event Subscriptions](#deriveevents)
5. [Kind 30078 d-tag Namespacing](#kind-30078-dtag-namespacing)
6. [Gate vs. Audit: Composable Pure Functions](#gate-vs-audit)
7. [Mode Switching in Routes.svelte](#mode-switching)
8. [Leaflet Integration](#leaflet-integration)
9. [Offline Queue Architecture](#offline-queue-architecture)
10. [Error Handling and Toast](#error-handling-and-toast)
11. [CSS/Tailwind Token System](#css-tailwind-token-system)

---

## 1. Synced Store Persistence {#synced-store-persistence}

### What it is

`synced()` from `@welshman/store` creates a Svelte writable store that auto-persists to `localStorage` via `localStorageProvider`. It's the standard way NavCom saves UI state across page reloads.

### Signature

```typescript
import {synced} from "@welshman/store"
import {localStorageProvider} from "@welshman/app"

const store = synced<T>({
  key: string,
  defaultValue: T,
  storage: localStorageProvider,
})
```

Returns a standard Svelte writable. Reads from localStorage on initialization, writes on every `set()` or `update()`. JSON serialization is implicit.

### Current Registry

All existing `synced()` instances in the codebase:

| Key | Type | File | Purpose |
|-----|------|------|---------|
| `"ui/navcom-mode"` | `NavComMode` (`"comms"∣"map"∣"ops"`) | `src/app/navcom-mode.ts` | Active operational mode |
| `"ui/navcom-active-channel"` | `Record<NavComMode, string∣null>` | `src/app/navcom-mode.ts` | Selected channel per mode |
| `"ui/navcom-compose-drafts"` | `Record<string, string>` | `src/app/navcom-mode.ts` | Message draft text per channel |
| `"ui/navcom-map-viewport"` | `{center: [number, number]; zoom: number}` | `src/app/navcom-mode.ts` | Map center + zoom level |
| `"ui/map-layers"` | `MapLayerConfig` | `src/app/navcom-mode.ts` | Map layer visibility toggles |
| `"ui/map-tileset"` | `"street"∣"satellite"∣"terrain"` | `src/app/navcom-mode.ts` | Active tile imagery |
| `"ui/map-time-range"` | `"1h"∣"24h"∣"7d"∣"all"` | `src/app/navcom-mode.ts` | Map temporal filter |
| `"onboarding/state"` | `OnboardingState` | `src/app/state/onboarding.ts` | Full onboarding flow state |
| `"benchmark"` | `number` | `src/util/pow.ts` | PoW benchmark (device speed) |
| `"checked"` | `Record<string, number>` | `src/engine/state-social.ts` | Last-read timestamps per context |
| `"feed/promptDismissed"` | `number` | `src/app/shared/Feed.svelte` | Feed prompt dismissal timestamp |
| `"Feed.shouldHideReplies"` | `boolean` | `src/app/shared/Feed.svelte` | Reply visibility toggle |
| `"FeedControls/expanded"` | `boolean` | `src/app/shared/FeedControls.svelte` | Controls panel state |

### New keys added by Transmutation specs

| Key | Spec | Purpose |
|-----|------|---------|
| `"ui/board-layout"` | [05-the-board.md](05-the-board.md) | Board tile layout configuration |

### Convention

- Keys are namespaced: `"ui/..."` for visual state, `"engine/..."` if engine-level persistence were needed.
- Default values must be valid — the store may be read before any user interaction.
- Never store secrets. `localStorage` is readable by any script on the same origin.

---

## 2. Derived Store Chains {#derived-store-chains}

### What it is

NavCom uses Svelte `derived()` stores to build computation chains. A change at the root (e.g., new event in `repository`) propagates through intermediate derived stores to UI-visible stores. This is the reactive backbone.

### The Group Chain (src/app/groups/state.ts)

The most complex derived chain in the app:

```
repository  (from @welshman/app — in-memory event cache)
    │
    ▼
groupEvents = deriveEvents({repository, filters: [{kinds: groupKinds}], includeDeleted: true})
    │   → Reactive store of TrustedEvent[] matching ~16 NIP-29/NIP-EE group kinds
    │
    ▼
ensureGroupsHydrated()
    │   → Subscribes to groupEvents, calls buildGroupProjection(events)
    │   → Imperatively sets:
    │
    ▼
groupProjections  (writable<Map<string, GroupProjection>>)
    │
    ├──▶ groupSummaries = derived([groupProjections, pubkey], ...)
    │       → selectGroupListItems($groupProjections, {currentPubkey})
    │       → UI-ready list of groups with role, protocol, unread info
    │
    └──▶ unreadGroupMessageCounts = derived([groupProjections, checked, pubkey], ...)
            │   → Iterates sourceEvents per projection, counts messages after seenAt
            │
            ├──▶ hasUnreadGroupMessages = derived(...)   // boolean
            └──▶ totalUnreadGroupMessages = derived(...)  // number
```

Key types at the `groupProjections` level:

```typescript
type GroupProjection = {
  group: GroupEntity
  members: Record<string, GroupMembership>
  audit: GroupAuditEvent[]
  sourceEvents: TrustedEvent[]  // ← raw events, used by presence derivation
}
```

### The Pattern

1. **Root:** `repository` (global event store from `@welshman/app`)
2. **Filter:** `deriveEvents()` creates a reactive filtered view
3. **Transform:** An imperative function (`buildGroupProjection`) does complex computation
4. **Fan-out:** Multiple `derived()` stores consume the transformed data for different purposes

Transmutation adds parallel chains from `groupProjections`:

| Spec | New derived store | What it derives |
|------|-------------------|-----------------|
| [02-presence](02-presence-from-publishing.md) | `groupMemberPresence` | Presence levels from `sourceEvents` timestamps |
| [06-trust-attestation](06-trust-attestation.md) | `attestationsByTarget` | Attestation events from `deriveEvents({kinds: [30078]})` |

### Convention

- `derived()` stores are read-only and auto-update when inputs change.
- `writable` stores that are populated imperatively (like `groupProjections`) are the exception, used when computation is too complex for a pure derivation.
- Keep derivation chains shallow (2-3 levels max) to avoid cascading recomputation.
- Heavy transforms should be throttled (see `throttled(800, deriveEvents(...))` in `notifications.ts`).

---

## 3. The signAndPublish Pipeline {#the-signandpublish-pipeline}

### What it is

The single choke point for creating-and-publishing Nostr events in the general case. Defined in `src/engine/commands.ts`:

```typescript
export const signAndPublish = async (template, {anonymous = false} = {}) => {
  const event = await sign(template, {anonymous})
  const relays = Router.get().PublishEvent(event).policy(addMinimalFallbacks).getUrls()
  return await publishThunk({event, relays})
}
```

Three steps:
1. **Sign** — `sign(template, {anonymous})` from `src/engine/state` signs the event template using the active signer.
2. **Route** — `Router.get().PublishEvent(event).policy(addMinimalFallbacks).getUrls()` determines target relays via Welshman's routing logic.
3. **Publish** — `publishThunk({event, relays})` from `@welshman/app` dispatches the signed event to relays.

### Why it matters for Transmutation

[04-sovereign-mode.md](04-sovereign-mode.md) modifies this exact choke point. The change is one if-statement:

```typescript
if (get(isSovereign)) {
  return enqueueSignedEvent(event, relays)
}
```

Because `signAndPublish` is the general-purpose pipeline, adding sovereign-mode awareness here catches most event types. This is the "one change, many benefits" pattern.

### Other publish paths

Not everything goes through `signAndPublish`. Knowing the exceptions is important:

| Function | Path | Why separate |
|----------|------|--------------|
| `publishDeletion` | `sign() → publishThunk()` directly | Needs custom tag construction |
| `sendMessage` (DMs) | `sendWrapped()` from `@welshman/app` | NIP-44 encrypted DM protocol, already has offline queue |
| `setAppData` | NIP-04 encrypt → `publishThunk()` | Encrypted content, custom key derivation |
| `publishGroupMessage` | `dispatchGroupTransportMessage()` | Group transport layer (NIP-29/NIP-EE protocol-specific) |
| `publishGroupCreate` | `dispatchGroupTransportAction()` | Group transport layer |
| `broadcastUserData` | `publishThunk()` with pre-signed events | Republishing, no signing needed |
| Feed favorites | `publishThunk()` with NIP-44 reconciliation | Custom encryption flow |

For Sovereign Mode, `sendMessage` already has offline awareness (it calls `enqueueOffline` when `navigator.onLine` is false). Group messages route through the transport layer and would need separate sovereign-mode handling. `signAndPublish` covers the remainder.

---

## 4. deriveEvents: Reactive Event Subscriptions {#deriveevents}

### What it is

`deriveEvents()` from `@welshman/store` creates a Svelte readable store of `TrustedEvent[]` that reactively updates when matching events enter the repository.

```typescript
import {deriveEvents} from "@welshman/store"
import {repository} from "@welshman/app"

const events: Readable<TrustedEvent[]> = deriveEvents({
  repository,
  filters: Filter[],
  includeDeleted?: boolean,
})
```

### Usage examples in the codebase

```typescript
// Group events (src/app/groups/state.ts)
deriveEvents({repository, filters: [{kinds: groupKinds}], includeDeleted: true})

// Settings (src/engine/state.ts)
deriveEvents({repository, filters: [{kinds: [APP_DATA]}]})

// DM messages (src/engine/state-social.ts)
deriveEvents({repository, filters: [{kinds: [4, DIRECT_MESSAGE]}]})

// Notifications — with throttle wrapper (src/engine/notifications.ts)
throttled(800, deriveEvents({repository, filters: [{kinds: noteKinds}]}))

// Reply context for feed items (src/app/shared/FeedItem.svelte)
deriveEvents({repository, filters: getReplyFilters([event], {kinds: replyKinds})})

// Intel report events (src/app/MainStatusBar.svelte)
deriveEvents({repository, filters: [{"#t": [intelTag]}]})
```

### Transmutation additions

| Spec | Filter | Purpose |
|------|--------|---------|
| [06-trust-attestation](06-trust-attestation.md) | `{kinds: [30078]}` | Attestation events (post-filtered by d-tag prefix in `parseAttestation()`) |

### Convention

- `deriveEvents` returns ALL matching events. Post-filtering (e.g., by d-tag prefix) happens in the consumer.
- For performance-sensitive paths, wrap in `throttled()` to batch rapid updates.
- Avoid overly broad filters (e.g., `{kinds: [1]}` would match every short text note in the repository).
- When subscribing in a component, the store auto-unsubscribes on component destroy (standard Svelte behavior via `$store` syntax).

---

## 5. Kind 30078 d-tag Namespacing {#kind-30078-dtag-namespacing}

### What it is

NIP-78 defines kind 30078 as a "generic application data" event. It's a NIP-33 parameterized replaceable event, meaning for a given pubkey + d-tag combination, only the latest event is retained. NavCom uses different d-tag prefixes to namespace unrelated data types within the same kind.

### Current d-tag values

| d-tag value | File | Purpose | Content |
|-------------|------|---------|---------|
| `"delegation"` | `src/engine/trust/delegation.ts` | Delegation certificates | p-tag, permissions, valid-until |
| `"revocation"` | `src/engine/trust/delegation.ts` | Revocation of delegation | p-tag, certification reference |
| `"nostr-engine/User/settings/v1"` | `src/engine/commands.ts` via `setAppData()` | Encrypted user settings | NIP-04 encrypted JSON |

### Transmutation addition

| d-tag value | Spec | Purpose |
|-------------|------|---------|
| `"attestation:<target-pubkey>"` | [06-trust-attestation](06-trust-attestation.md) | Peer trust attestation |

### Why this works

Because kind 30078 is **parameterized replaceable** (NIP-33), the d-tag is part of the uniqueness key:
- `(pubkey, kind: 30078, d: "delegation")` → one event per pubkey
- `(pubkey, kind: 30078, d: "attestation:abc123...")` → one event per (pubkey, target) pair
- `(pubkey, kind: 30078, d: "nostr-engine/User/settings/v1")` → one event per pubkey

These don't collide. The relay replaces only events with the same (pubkey, kind, d-tag) tuple.

### Convention

- Prefix d-tags with their purpose: `delegation`, `revocation`, `attestation:`.
- For per-target events, append the target identifier: `attestation:<pubkey>`.
- Parse events defensively — check the d-tag prefix before assuming event structure.
- The `content` field should be empty for public events (delegation, attestation) and encrypted for private data (settings).

---

## 6. Gate vs. Audit: Composable Pure Functions {#gate-vs-audit}

### What it is

The codebase separates **decision functions** (gates) from **enforcement actions** (policy). A gate function takes input, returns a verdict. The caller decides what to do with the verdict. This makes gates testable, composable, and reusable.

### Existing examples

**`evaluateTierPolicy()`** in `src/engine/group-tier-policy.ts`:

```typescript
type TierPolicyInput = {
  currentTier: number
  requestedProtocol: "nip29" | "nip-ee"
  isDowngrade: boolean
  overrideRequested: boolean
}

type TierPolicyResult =
  | {ok: true; overrideAuditEvent?: AuditEvent}
  | {ok: false; reason: string}

export function evaluateTierPolicy(input: TierPolicyInput): TierPolicyResult
```

Pure function. No side effects. No store access. No relay calls. The caller (group settings UI) handles the result: blocking the action if `ok: false`, proceeding if `ok: true`.

### Transmutation addition

**`evaluateRelayFingerprintGate()`** from [03-relay-fingerprint-gate](03-relay-fingerprint-gate.md):

```typescript
type FingerprintGateInput = {
  groupTier: number
  groupRelays: NormalizedUrl[]
  memberRelays: NormalizedUrl[]
}

type FingerprintGateResult =
  | {ok: true}
  | {ok: false; violations: Array<{relay: NormalizedUrl; reason: string}>}

export function evaluateRelayFingerprintGate(input: FingerprintGateInput): FingerprintGateResult
```

Same pattern: pure input → pure output. No side effects. Callers compose both gate functions:

```typescript
const tierResult = evaluateTierPolicy(tierInput)
if (!tierResult.ok) return showError(tierResult.reason)

const gateResult = evaluateRelayFingerprintGate(gateInput)
if (!gateResult.ok) return showWarning(formatViolations(gateResult.violations))
```

### Convention

- Gate functions are **pure**: no store reads, no relay calls, no DOM manipulation.
- Input types are explicit: the caller assembles the input from stores and context.
- Result types use `{ok: true} | {ok: false; reason/violations}` discriminated union.
- Gates compose through sequential evaluation, not nesting.
- Unit tests for gates don't need mocking — just construct inputs and assert outputs.

---

## 7. Mode Switching in Routes.svelte {#mode-switching}

### What it is

The "/" route in `src/app/Routes.svelte` conditionally renders one of three mode views based on `$navcomMode`. This uses `{#if}` blocks, not dynamic `<svelte:component>`.

### Implementation

```svelte
{#if isModePage}
  {#if $navcomMode === "comms"}
    <div class="m-auto w-full max-w-2xl">
      <div class="flex max-w-2xl flex-grow flex-col gap-4 p-4">
        <CommsView />
      </div>
    </div>
  {:else if $navcomMode === "map"}
    <div class="h-[calc(100dvh-8rem)] w-full lg:h-[calc(100dvh-4rem-var(--main-status-height))]">
      <MapView />
    </div>
  {:else if $navcomMode === "ops"}
    <div class="m-auto w-full max-w-4xl">
      <div class="flex max-w-4xl flex-grow flex-col gap-4 p-4">
        <OpsView />
      </div>
    </div>
  {/if}
{:else}
  <!-- Normal routes via LazyRouteHost -->
{/if}
```

Key details:
- `isModePage` is `modePaths.has($page.path)` where `modePaths = new Set(["/"])`
- `$navcomMode` is the `synced()` store from `src/app/navcom-mode.ts`
- All three views are **eagerly imported** (not lazy-loaded like other routes)
- Container CSS varies by mode: map mode uses `overflow-hidden` + `pb-0`; others use `overflow-auto` + `pb-32`
- Container width varies: comms and ops use `max-w-2xl`/`max-w-4xl`; map uses full width

### Transmutation changes

| Spec | Change |
|------|--------|
| [05-the-board](05-the-board.md) | Replace `OpsView` import with `BoardView`. Change `max-w-4xl` to `max-w-6xl`. One import line + one class change. |

### Convention

- Adding a new mode means adding a new `{:else if}` branch in Routes.svelte.
- Mode views are always mounted at "/". Other routes go through `LazyRouteHost`.
- The `navcomMode` store is the single source of truth for which view is active.

---

## 8. Leaflet Integration {#leaflet-integration}

### What it is

Leaflet is loaded via dynamic `import()` (lazy loading), not bundled in the main chunk. Each component that uses a map initializes its own Leaflet instance.

### Current instances

| Component | File | Interactive | Notes |
|-----------|------|-------------|-------|
| MapView | `src/app/views/MapView.svelte` | Yes | Full interactive map with markers, layers, clustering |
| OpsView (thumbnail) | `src/app/views/OpsView.svelte` | No | Non-interactive (`zoomControl: false, dragging: false`) |
| MapPickerModal | `src/app/shared/MapPickerModal.svelte` | Yes | Location picker in modals, includes CDN fallback |

### Loading pattern

```typescript
const mod = await import("leaflet")
await import("leaflet/dist/leaflet.css")
leaflet = (mod as any).default ?? mod
```

The `.default` fallback handles ESM/CJS interop differences.

### No shared utility

Each component initializes its own `leaflet.map()` with component-specific options. Tile URLs (OpenStreetMap, Esri, OpenTopoMap) are defined locally in each component. This means:

- No single source of truth for tile configurations.
- Adding a new map type (e.g., Board map tile) means copying the tile URL setup pattern.
- If tile providers change, multiple files need updating.

### Transmutation implications

| Spec | Impact |
|------|--------|
| [05-the-board](05-the-board.md) | The `map-overview` Board tile needs its own Leaflet instance (non-interactive, like OpsView thumbnail). |
| [02-presence](02-presence-from-publishing.md) | No new map instances, but presence data may feed into existing MapView markers. |
| [04-sovereign-mode](04-sovereign-mode.md) | Map mode in sovereign state shows cached tiles only. No Leaflet API change needed — it degrades naturally when offline. |

### Convention

- Always use dynamic `import("leaflet")` — never static import.
- Guard `onMount` with the async import before creating map instances.
- Clean up instances in `onDestroy` (`map.remove()`).
- Non-interactive thumbnails should disable all interaction handlers: `zoomControl: false, dragging: false, scrollWheelZoom: false, touchZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false`.

---

## 9. Offline Queue Architecture {#offline-queue-architecture}

### What it is

An IndexedDB-backed queue with AES-GCM encryption for holding messages when offline. Currently only wired to `sendMessage()` (DMs). Sovereign Mode extends it to `signAndPublish()`.

### Components

| File | Purpose |
|------|---------|
| `src/engine/offline/outbox.ts` | IndexedDB storage ("navcom-outbox", v1, "messages" store) + AES-GCM encryption |
| `src/engine/offline/queue-drain.ts` | Watches online status, drains queue with exponential backoff (2s→60s, max 5 retries) |
| `src/engine/offline/sw-sync.ts` | Service Worker background sync registration — **dead code, no SW handler exists** |
| `src/engine/offline/queue-status.ts` | `outboxStatus` writable store for UI status display |

### QueuedMessage type

```typescript
interface QueuedMessage {
  id: string                // "outbox-{timestamp}-{counter}"
  channelId: string
  content: string           // plaintext or AES-GCM ciphertext
  createdAt: number
  status: "queued" | "sending" | "sent" | "failed" | "quarantined"
  retryCount: number
  lastRetryAt: number | null
  encrypted?: boolean       // true when content is ciphertext
  encryptedIv?: string      // base64-encoded AES-GCM IV
}
```

### Encryption

- Algorithm: AES-GCM (Web Crypto API)
- Key derivation: PBKDF2 from passphrase with salt `"navcom-outbox-queue-encryption-v1"`
- IV: 12 random bytes per message via `crypto.getRandomValues`
- Content stored as base64 ciphertext with separate IV field

### Drain logic

- Checks `navigator.onLine` before attempting drain
- Classifies failures: `passphrase-needed`, `network-down`, `relay-rejection`
- Exponential backoff: `BASE_DELAY_MS = 2000`, doubling up to 60s max
- After `MAX_RELAY_RETRIES = 5`, message status moves to `"quarantined"`
- Listens to `window "online"` event to trigger drain on reconnection

### Connection detection gap

There are **4 independent `navigator.onLine` check sites** in the codebase:
1. `src/engine/commands.ts` → `sendMessage()`
2. `src/engine/offline/queue-drain.ts` → 3 checks + `window "online"` listener
3. `src/partials/Toast.svelte` → shows "offline" toast
4. `src/app/state/onboarding.ts` → flush queues after onboarding

No centralized connection state store exists. [04-sovereign-mode](04-sovereign-mode.md) introduces `connectionState` to unify these.

### Transmutation implications

| Spec | Change |
|------|--------|
| [04-sovereign-mode](04-sovereign-mode.md) | Extends `QueuedMessage` with `signedEvent` + `targetRelays` fields. Extends drain to handle pre-signed events (skip re-signing, publish directly). Adds centralized `connectionState` store. |

---

## 10. Error Handling and Toast {#error-handling-and-toast}

### Global error boundary

`src/app/ErrorBoundary.svelte` listens to `window "error"` and `window "unhandledrejection"` events. Shows fallback UI with "Try Again" and "Reload App" buttons. This is the catch-all for uncaught errors.

### Component-level pattern

The dominant pattern is `try/catch` in async functions with Toast notification:

```typescript
import {showError, showWarning, showInfo} from "src/partials/Toast.svelte"

try {
  await signAndPublish(template)
  showInfo("Published")
} catch (e) {
  console.error(e)
  showError("Failed to publish")
}
```

No global error store. No error aggregation. Errors are handled locally where they occur.

### Toast API

`src/partials/Toast.svelte` exports module-level functions:

| Function | Use |
|----------|-----|
| `showInfo(message, opts?)` | Informational (blue/default) |
| `showWarning(message, opts?)` | Warning (amber) |
| `showError(message, opts?)` | Error (red) |
| `showActionToast(message, opts?)` | Toast with action button |
| `showPublishInfo(thunk)` | Relay publish progress via `ThunkStatus` |

Options:
- `id: string` — deduplication key (prevents duplicate toasts)
- `timeout: number | null` — auto-dismiss delay (default 5s, `null` = persistent)
- Auto-dismiss via timeout
- Touch swipe to dismiss

### Offline toast

Toast.svelte auto-shows an offline notification:
```typescript
showInfo("You are currently offline.", {id: "offline", timeout: null})
```
This fires on `window "offline"` event. The `id: "offline"` deduplicates so only one offline toast shows.

### Convention

- Use `showError` for failures the user should know about.
- Use `showWarning` for non-fatal issues (e.g., relay fingerprint gate violations).
- Use `showInfo` for confirmations (e.g., "Attestation published").
- Don't swallow errors silently — at minimum `console.error` + toast.
- For publish operations, use `showPublishInfo(thunk)` to show relay-by-relay progress.

---

## 11. CSS/Tailwind Token System {#css-tailwind-token-system}

### Token architecture

NavCom uses a **runtime theme system** — CSS custom properties are injected at runtime from a `themeVariables` derived store in `src/partials/state.ts`. The Tailwind config references these variables, creating the bridge between dynamic themes and utility classes.

### Custom properties (set at runtime)

```css
--nc-shell-bg          /* Main background */
--nc-shell-deep        /* Deeper background (sidebars, insets) */
--nc-shell-border      /* Border color */
--nc-shell-bg-rgb      /* RGB values for alpha compositing */
--nc-shell-deep-rgb
--nc-shell-border-rgb
--nc-surface-card      /* Card backgrounds */
--nc-surface-hover     /* Hover states */
--nc-surface-input     /* Input field backgrounds */
--nc-surface-elevated  /* Elevated surfaces (modals, popovers) */
--nc-surface-divider   /* Divider lines */
--nc-surface-card-rgb
--nc-accent-primary    /* Primary accent color */
--nc-accent-hover      /* Accent hover state */
--nc-accent-glow       /* Accent glow effect */
--nc-text              /* Primary text */
--nc-text-muted        /* Secondary/muted text */
```

### Tailwind config (tailwind.config.cjs)

Maps CSS variables to Tailwind utilities:

```javascript
colors: {
  "nc-shell":        "var(--nc-shell-bg)",
  "nc-shell-deep":   "var(--nc-shell-deep)",
  "nc-shell-border": "var(--nc-shell-border)",
  "nc-card":         "var(--nc-surface-card)",
  "nc-card-hover":   "var(--nc-surface-hover)",
  "nc-input":        "var(--nc-surface-input)",
  "nc-elevated":     "var(--nc-surface-elevated)",
  "nc-divider":      "var(--nc-surface-divider)",
  "nc-accent":       "var(--nc-accent-primary)",
  "nc-accent-hover": "var(--nc-accent-hover)",
  "nc-accent-glow":  "var(--nc-accent-glow)",
  "nc-text":         "var(--nc-text)",
  "nc-text-muted":   "var(--nc-text-muted)",
}
```

### z-index scale

Semantic z-index values instead of arbitrary numbers:

```javascript
zIndex: {
  none: 0,
  feature: 1,
  nav: 2,
  chat: 3,
  popover: 4,
  modal: 5,
  sidebar: 6,
  overlay: 7,
  toast: 8,
}
```

Usage: `z-nav`, `z-modal`, `z-toast`, etc.

### Additional color system

- `neutral-*` and `tinted-*` scales (50-950) with `-l` (lighter) and `-d` (darker) variants
- Auto-generated from base color values
- Used alongside `nc-*` tokens for fine-grained color control

### Map marker CSS

Map markers use `:global()` selectors to escape Svelte scoping:

```css
:global(.navcom-marker-icon) { /* marker container */ }
:global(.navcom-marker-shell) { /* inner colored circle */ }
```

Inline styles reference CSS variables for theme integration:
```css
background: rgba(var(--nc-shell-bg-rgb), 0.96);
```

### Convention for new components

- Use `nc-*` Tailwind utilities for all colors: `text-nc-text`, `bg-nc-card`, `border-nc-shell-border`.
- Use semantic z-index: `z-popover`, `z-modal`, not `z-50`.
- Never hardcode color values — always go through CSS variables via Tailwind tokens.
- For opacity compositing, use the `-rgb` variables: `rgba(var(--nc-shell-bg-rgb), 0.8)`.
- Map-related global CSS uses the `.navcom-marker-*` namespace.

---

## Pattern Interaction Map

How Transmutation specs use these patterns together:

```
                        ┌─────────────────────┐
                        │   synced() stores    │
                        │  (01,04,05 use these)│
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐
                        │   Routes.svelte      │
                        │   mode switching     │
                        │   (05 modifies)      │
                        └──────────┬──────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
     ┌───────▼───────┐    ┌───────▼───────┐    ┌───────▼───────┐
     │   CommsView    │    │   MapView     │    │ BoardView(05) │
     │                │    │  Leaflet      │    │               │
     │                │    │  markers(06)  │    │ tiles from    │
     │                │    │               │    │ derived stores│
     └───────┬───────┘    └───────┬───────┘    └───────┬───────┘
             │                     │                     │
             └─────────┬───────────┘                     │
                       │                                 │
             ┌─────────▼─────────┐              ┌───────▼───────┐
             │  groupProjections │              │ attestations-  │
             │  (derived chain)  │              │ ByTarget(06)   │
             │                   │              │                │
             │ ├→ summaries      │              │ deriveEvents   │
             │ ├→ unread counts  │              │ ({kinds:30078})│
             │ └→ presence(02)   │              │                │
             └─────────┬─────────┘              └───────┬───────┘
                       │                                 │
                       └──────────┬──────────────────────┘
                                  │
                       ┌──────────▼──────────┐
                       │  signAndPublish()   │
                       │  choke point        │
                       │  (04 adds sovereign │
                       │   mode branch)      │
                       └──────────┬──────────┘
                                  │
                       ┌──────────▼──────────┐
                       │  offline queue      │
                       │  (04 extends)       │
                       │  IndexedDB + AES-GCM│
                       └─────────────────────┘
```

| Spec | Primary patterns used |
|------|-----------------------|
| [01-the-briefing](01-the-briefing.md) | synced (onboarding state), toast (security notifications), CSS tokens |
| [02-presence](02-presence-from-publishing.md) | derived store chain (from groupProjections.sourceEvents), CSS tokens |
| [03-relay-fingerprint-gate](03-relay-fingerprint-gate.md) | gate vs. audit pattern, toast (violation warnings) |
| [04-sovereign-mode](04-sovereign-mode.md) | signAndPublish choke point, offline queue extension, synced (connection pref), toast |
| [05-the-board](05-the-board.md) | synced (board layout), Routes.svelte mode switching, Leaflet (map tile), derived stores (tile data), CSS tokens |
| [06-trust-attestation](06-trust-attestation.md) | deriveEvents (kind 30078), kind 30078 d-tag namespacing, Leaflet (marker overlay), CSS tokens |
