# 01-01: Mode Store & Routing

> Core infrastructure: the `NavComMode` store and mode-driven viewport switching.

**Priority**: CRITICAL — everything in Phase 1 depends on this.  
**Effort**: LOW (~100 lines)  
**Depends on**: Nothing  
**Source**: [navcom-two-modes.md](../../navcom-two-modes.md), [navcom-ux-critique.md](../../navcom-ux-critique.md) §Fundamental Fix

---

## Architecture Decision

NavCom has three modes that share one app shell: **Comms**, **Map**, **Ops**. These are application states, not separate pages or routes. All modes share the same identity, relay connections, subscriptions, and data.

The existing `GroupAdminMode = "guided" | "expert"` pattern in `src/app/groups/admin-mode.ts` proves this pattern — extend it to the app level.

---

## Implementation

### 1. Create Mode Store

**New file**: `src/app/navcom-mode.ts`

```typescript
import {synced, localStorageProvider} from "@welshman/store"

export type NavComMode = "comms" | "map" | "ops"

export const navcomMode = synced<NavComMode>({
  key: "ui/navcom-mode",
  defaultValue: "comms",
  storage: localStorageProvider,
})

export function setMode(mode: NavComMode) {
  navcomMode.set(mode)
}
```

- Persisted to localStorage via the same `synced()` pattern used by `theme` and `GroupAdminMode`
- Default is always "comms" (Signal-like messaging)
- No conditional logic — the store is a single source of truth

### 2. Modify App.svelte

The center viewport becomes mode-driven. Replace the current route-based content area with a mode switch:

```svelte
<script>
  import {navcomMode} from "src/app/navcom-mode"
  import CommsView from "./views/CommsView.svelte"
  import MapView from "./views/MapView.svelte"  
  import OpsView from "./views/OpsView.svelte"
</script>

{#if $navcomMode === "comms"}
  <CommsView />
{:else if $navcomMode === "map"}
  <MapView />
{:else if $navcomMode === "ops"}
  <OpsView />
{/if}
```

**Important**: Existing routes (group settings, user profiles, modals) remain as overlay routes — they open on top of the current mode, not instead of it. The router continues handling deep links, settings pages, and modals.

### 3. Route Preservation

Current `fullBleedPaths` in the layout system (only `/intel/map` registered) needs updating:
- Map mode should be full-bleed (no `max-w-2xl` constraint)
- Comms mode uses the existing content width
- Ops dashboard uses a wider layout but not full-bleed

### 4. State Persistence Across Mode Switches

These must survive mode switches:
- Selected channel (which group conversation is active)
- Compose draft (text the user was typing)
- Scroll position in message stream
- Map viewport (center, zoom level)

These reset on switch:
- Ops dashboard data (it's a fresh summary each time)

### 5. Keyboard Shortcuts (Optional)

```typescript
// Only if keyboard shortcuts are desired
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === "1") setMode("comms")
    if (e.key === "2") setMode("map")
    if (e.key === "3") setMode("ops")
  }
})
```

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/navcom-mode.ts` | Mode store + setter | ~15 |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/App.svelte` | Mode-driven center viewport |
| `src/app/Nav.svelte` | Add mode awareness for layout adjustments |

---

## Verification

- [ ] `navcomMode` defaults to "comms" on fresh install
- [ ] Switching modes persists across page refresh
- [ ] Existing routes (settings, profiles) still work as overlays
- [ ] No component unmount/remount between mode switches (or state is properly preserved if they do)
