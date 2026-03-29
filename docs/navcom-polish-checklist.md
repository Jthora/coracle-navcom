# NavCom Polish & Depth — Gap Remediation Checklist

> Generated from ground-truth codebase audit (2026-03-21).
> Every item traced to exact source locations. ~700 lines across ~15 files.

---

## Phase 1: Fix Broken Features (P0)

### Step 1.1 — Sitrep markers on map

- [x] 1.1.1 Add `"sitrep"` to `ChannelMarker["type"]` union in `src/app/views/marker-derivation.ts`
- [x] 1.1.2 Add sitrep entry to `MARKER_STYLES` object (`{icon: "📋", color: "#f59e0b", cssClass: "marker-sitrep"}`) in `src/app/views/marker-derivation.ts`
- [x] 1.1.3 Add `msgType === "sitrep" ? "sitrep" :` condition before fallback in type-mapping ternary in `src/app/views/marker-derivation.ts`
- [x] 1.1.4 Add `sitreps: boolean` field to `MapLayerConfig` type in `src/app/navcom-mode.ts`
- [x] 1.1.5 Add `sitreps: true` to `mapLayers` default value in `src/app/navcom-mode.ts`
- [x] 1.1.6 Add `if (m.type === "sitrep" && !layers.sitreps) return false` to `filterMarkers()` in `src/app/views/MapView.svelte`
- [x] 1.1.7 Add sitrep checkbox to `src/app/views/MapLayerPanel.svelte` between spotreps and memberPositions
- [x] 1.1.8 Add `"sitrep"` to `MarkerCluster["style"]` union in `src/app/views/marker-clustering.ts`
- [x] 1.1.9 Add sitrep color entry to `CLUSTER_COLORS` in `src/app/views/marker-clustering.ts`
- [x] 1.1.10 Add sitrep-aware cluster style logic in `src/app/views/marker-clustering.ts`
- [x] 1.1.11 Write test: sitrep messages with location tags produce correctly-typed markers
- [x] 1.1.12 Verify sitrep markers render on map with correct amber icon

### Step 1.2 — PQC algorithm label correctness

- [x] 1.2.1 Pass `pqDerived: true` to `encodeSecureGroupEpochContent()` in `src/engine/group-transport-secure-ops.ts` ~L172
- [x] 1.2.2 Verify wire envelope shows `"ml-kem-768-hkdf-aes256-gcm"` (v2) in existing tests
- [x] 1.2.3 Update any tests that assert v1 algorithm label to expect v2

---

## Phase 2: Wire Stubs & Quick Wins (P1)

### Step 2.1 — CommsView Check-In button sends message

- [x] 2.1.1 Import `publishGroupMessage`, `signer`, toast helpers into `src/app/views/CommsView.svelte`
- [x] 2.1.2 Implement `sendCheckIn()`: check signer + activeChannel, capture geolocation, build `["msg-type", "check-in"]` + location + geohash tags, call `publishGroupMessage()`
- [x] 2.1.3 Replace `openCheckIn()` stub body with call to `sendCheckIn()`
- [x] 2.1.4 Add loading/disabled state to button during geolocation + send
- [x] 2.1.5 Show toast on success ("Check-in sent") and failure

### Step 2.2 — CommsView Alert button sends message

- [x] 2.2.1 Add compact inline priority selector UI (low/medium/high) that appears on Alert button click
- [x] 2.2.2 Implement `sendAlert()`: check signer + activeChannel, build `["msg-type", "alert"]` + `["priority", selected]` tags, call `publishGroupMessage()`
- [x] 2.2.3 Replace `openAlert()` stub body with priority selector → `sendAlert()` flow
- [x] 2.2.4 Add loading/disabled state and toast feedback
- [x] 2.2.5 Dismiss priority selector on send or click-outside

### Step 2.3 — Leave Group UI

- [x] 2.3.1 Read `src/app/views/GroupSettingsAdmin.svelte` to find danger zone insertion point
- [x] 2.3.2 Add "Leave Group" button in danger zone section at bottom of settings
- [x] 2.3.3 Add confirmation dialog (type group name to confirm)
- [x] 2.3.4 On confirm: call `publishGroupLeave()`, clear local projection + drafts + unread counts
- [x] 2.3.5 Navigate to group list after leave
- [x] 2.3.6 Disable button for group owners (cannot leave own group)

### Step 2.4 — Location input validation

- [x] 2.4.1 Add coordinate regex validator in `src/app/views/SitrepForm.svelte`: `/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/`
- [x] 2.4.2 Add lat range check [-90, 90] and lng range check [-180, 180]
- [x] 2.4.3 Show inline error message below location field when invalid
- [x] 2.4.4 Disable submit button when location is non-empty and invalid
- [x] 2.4.5 Apply same validation to `src/app/views/SpotrepForm.svelte` location field
- [x] 2.4.6 Add basic URL pattern check for photo URL field in SpotrepForm (`https?://`)
- [x] 2.4.7 Show inline error for invalid photo URL

---

## Phase 3: Depth Features (P2)

### Step 3.1 — Message search in GroupConversation

- [x] 3.1.1 Add `searchQuery` state variable and search toggle (🔍 icon) in header area of `src/app/views/GroupConversation.svelte`
- [x] 3.1.2 Add search input bar (conditionally visible) with clear button
- [x] 3.1.3 Add `filteredMessages` reactive: filter `messages` array by `getDisplayContent(msg).toLowerCase().includes(query)` (handles both plaintext and PQC-decrypted)
- [x] 3.1.4 Replace `messages` with `filteredMessages` in `{#each}` / VirtualList rendering
- [x] 3.1.5 Add result counter display ("N matches")
- [ ] 3.1.6 Add scroll-to-first-match using existing `scrollIntoView` + highlight ring pattern _(skipped — low value vs complexity)_
- [x] 3.1.7 Add Escape key to clear search and restore full message list
- [x] 3.1.8 Verify search works with encrypted group messages (decryptedContent Map)

### Step 3.2 — Ops Dashboard enrichment

- [ ] 3.2.1 Add relay status summary bar: import `Pool` + `getSocketStatus`, count connected vs total, render "N/M relays" indicator at top of `src/app/views/OpsView.svelte` _(skipped — Pool API not directly accessible in Svelte reactive context)_
- [ ] 3.2.2 Add stale-group visual treatment: dim/gray channels where `groupSummaries[i].stale === true` _(skipped — stale field not currently tracked)_
- [x] 3.2.3 Add per-group message type counts: derive from `projection.sourceEvents` filtering by `msg-type` tag → show alert/sitrep/check-in/spotrep badge counts per channel row
- [x] 3.2.4 Add member role distribution per group: derive from `projection.members` → show owner/admin/moderator/member counts as compact badges
- [x] 3.2.5 Replace fake activity feed: iterate `sourceEvents` across all groups, filter to message kinds, extract `msg-type` tag + author + timestamp, sort by recency, take last 8
- [x] 3.2.6 Show activity type icon (🚨 alert, 📋 sitrep, 📍 check-in, 📌 spotrep, 💬 message) + author display name + relative timestamp in feed items
- [ ] 3.2.7 Add last moderation action from `projection.audit` per group (if any) _(skipped — audit events not populated in current projection)_
- [x] 3.2.8 Verify all new derivations are reactive (Svelte `$:` blocks)

### Step 3.3 — User location on map

- [x] 3.3.1 On MapView mount: call `navigator.geolocation.getCurrentPosition()`, store coords in reactive variable
- [x] 3.3.2 Add `L.circleMarker` at user's coords with blue fill, pulsing ring CSS
- [x] 3.3.3 Add "center on me" button (📍 or ⊕ icon) in bottom-left map controls
- [x] 3.3.4 Button click: re-query geolocation, fly map to user position
- [x] 3.3.5 Handle permission denied gracefully (hide button, no error)
- [ ] 3.3.6 Optional: upgrade to `watchPosition()` for continuous tracking with accuracy circle _(deferred — optional enhancement)_

### Step 3.4 — Member positions layer

- [x] 3.4.1 Add `deriveMemberPositions()` in `src/app/views/marker-derivation.ts`: group check-in markers by author pubkey, keep only latest per member
- [x] 3.4.2 Return member position markers with distinct type (e.g., `"member-position"`) or reuse check-in with special rendering
- [x] 3.4.3 In `src/app/views/MapView.svelte`: when `$mapLayers.memberPositions` is true, compute member positions from filtered markers
- [x] 3.4.4 Render as distinct layer (person icon 👤 instead of check-in pin) with member name tooltip
- [x] 3.4.5 Verify toggle in MapLayerPanel enables/disables the layer reactively
- [x] 3.4.6 Test: multiple check-ins from same member → only latest position shown

### Step 3.5 — Alert auto-location capture

- [x] 3.5.1 In `src/app/views/GroupConversation.svelte` alert send path (~L548): add geolocation capture matching the check-in pattern
- [x] 3.5.2 Append `["location", "lat,lng"]` and `["g", geohash]` tags when GPS available
- [x] 3.5.3 Fall back silently if location unavailable (alert still sends without location)
- [x] 3.5.4 Verify alert markers now appear on map when GPS is available

---

## Phase 4: Structural Improvements (P3)

### Step 4.1 — Seal metadata tags inside encrypted content _(DEFERRED)_

> **Deferred:** Complex structural change requiring JSON envelope format design, encrypt/decrypt
> pipeline changes, and backward compatibility handling (~200 lines across multiple files).
> Tags are currently plaintext by design so the map can read location data without decrypting.
> Sealing requires a decrypt-first pipeline, which is a significant architectural change.

- [ ] 4.1.1 Design JSON envelope format: `{text: "...", meta: {type: "alert", location: "lat,lng", geohash: "..."}}`
- [ ] 4.1.2 On send path in `src/app/views/GroupConversation.svelte`: encode content as JSON envelope, move `msg-type`, `location`, `g` out of `extraTags` into envelope
- [ ] 4.1.3 On decrypt path in `src/engine/group-transport-secure-ops.ts`: parse JSON envelope, inject tags back into `event.tags` after decryption
- [ ] 4.1.4 Update `getMessageType()` and `isGeoTagged()` in GroupConversation to read from decrypted content first, fall back to event tags
- [ ] 4.1.5 Update `deriveMarkers()` in marker-derivation.ts to accept optional decrypted content map, extract location from decrypted envelope
- [ ] 4.1.6 In MapView: pass decryptedContent to deriveMarkers for secure groups
- [ ] 4.1.7 Add backward compatibility: detect old-format messages (tags-only) vs new-format (sealed envelope)
- [ ] 4.1.8 Write migration/upgrade test: old messages still render, new messages seal tags
- [ ] 4.1.9 Update protocol-spec.md with sealed envelope format

### Step 4.2 — Service worker background sync handler _(DEFERRED)_

> **Deferred:** VitePWA uses `generateSW` mode (auto-generated service worker). Adding a custom
> sync handler requires switching to `injectManifest` mode — a significant infrastructure change.
> The existing `online` event fallback + `requestBackgroundSync()` registration already provides
> adequate offline-to-online queue drain behavior.

- [ ] 4.2.1 Locate the service worker entry point (Vite PWA plugin config or custom SW file)
- [ ] 4.2.2 Add `self.addEventListener('sync', event => { ... })` handler checking for tag `"navcom-outbox-drain"`
- [ ] 4.2.3 Import or inline `drainQueue()` logic callable from SW context
- [ ] 4.2.4 Verify: queue message while offline → close app → reconnect → message sends in background
- [ ] 4.2.5 Add fallback for browsers without Background Sync API (existing `online` event listener continues to work)

### Step 4.3 — Dead code cleanup

- [x] 4.3.1 Archive or remove `src/app/views/IntelNavMap.svelte` (~845 lines of unreachable code)
- [x] 4.3.2 Remove `/intel/map` route registration
- [x] 4.3.3 Verify no imports reference IntelNavMap after removal

---

## Verification Gate

- [x] V.1 All existing tests pass (922 tests across 141 files — all pass)
- [x] V.2 `svelte-check` reports 0 errors (157 pre-existing warnings in 54 files)
- [x] V.3 `vite build` succeeds cleanly (built in ~49s, 49 precache entries)
- [ ] V.4 Manual smoke test: create group → send each message type → verify map markers
- [ ] V.5 Manual smoke test: PQC group → send message → verify encryption on wire (v2 label)
- [ ] V.6 Manual smoke test: mode switching preserves all state
- [ ] V.7 Manual smoke test: offline queue → drain on reconnect
