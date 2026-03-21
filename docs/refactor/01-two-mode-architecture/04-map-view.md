# 01-04: Map View

> Map mode — tactical map with integrated comms panel.

**Priority**: HIGH — the map is NavCom's operational differentiator from Signal/Telegram.  
**Effort**: MEDIUM (~350 lines: MapView + CommsDrawer)  
**Depends on**: 01-01 (mode store), 01-02 (channel sidebar)  
**Source**: [navcom-two-modes.md](../../navcom-two-modes.md), [navcom-interface-synthesis.md](../../navcom-interface-synthesis.md) §Tactical Map

---

## Design Principle

Map mode fuses geography and communication. The user sees the operational picture AND can communicate without switching views. Inspired by ATAK: map is primary, comms is always accessible.

---

## Layout

### Mobile (<1024px)

```
┌─────────────────────────┐
│ [Status] [🔧 Tools]     │
├─────────────────────────┤
│                         │
│      FULL-SCREEN MAP    │
│      (Leaflet)          │
│                         │
│                         │
├─────────────────────────┤
│ ▬▬▬ HQ Command ▬▬▬▬▬▬  │  ← Comms drawer handle (peek)
├─────────────────────────┤
│ 💬 Chat | 🗺 Map | 📋 Ops │
└─────────────────────────┘
```

The comms drawer is a bottom sheet that the user can:
- **Peek** (default): shows channel name + last message preview (~60px)
- **Half-expand**: drag up to see recent messages (~50% screen)
- **Full-expand**: drag up to full height (map still visible behind, blurred)

### Desktop (≥1024px)

```
┌──────────┬───────────────────────┬────────────┐
│ Sidebar  │                       │ COMMS PANE │
│ (channels│      LEAFLET MAP      │ (active    │
│  list)   │      (full height)    │  channel   │
│          │                       │  messages) │
│          │                       │            │
│          │                       │ [Compose]  │
├──────────┴───────────────────────┴────────────┤
│ 💬 Chat | 🗺 Map | 📋 Ops                      │
└───────────────────────────────────────────────┘
```

Desktop right panel: ~320px width, shows the active channel's message stream with compose bar. Same data as Comms Mode conversation — just narrower.

---

## Implementation

### New Component: `src/app/views/MapView.svelte`

```svelte
<script>
  import {activeChannel} from "src/app/navcom-state"
  // Import existing IntelNavMap component
  // Import CommsDrawer (mobile) or CommsPane (desktop)
  
  let innerWidth = 0
  $: isMobile = innerWidth < 1024
</script>

<svelte:window bind:innerWidth />

<div class="relative h-full">
  <!-- Map fills entire container -->
  <IntelNavMap />
  
  {#if isMobile}
    <CommsDrawer channel={$activeChannel} />
  {:else}
    <CommsPane channel={$activeChannel} />
  {/if}
</div>
```

### New Component: `src/app/views/CommsDrawer.svelte`

A bottom sheet component for mobile. No existing bottom-sheet/drawer component exists in the codebase, but `SliderMenu.svelte` (slides from bottom with `fly({y: 600})`) provides a pattern to extend.

**States**:
1. **Peek** (60px): channel name + "3 new messages" + drag handle
2. **Half** (50% viewport): scrollable message list + compose bar
3. **Full** (90% viewport): full conversation view

**Gesture**: Drag the handle bar. Snap to nearest state. Don't dismiss entirely — always show peek.

```svelte
<script>
  let drawerHeight = 60 // peek state
  let dragging = false
  
  const PEEK = 60
  const HALF = window.innerHeight * 0.5
  const FULL = window.innerHeight * 0.9
  
  function snapToNearest(y) {
    const distances = [PEEK, HALF, FULL].map(h => Math.abs(y - h))
    const closest = distances.indexOf(Math.min(...distances))
    return [PEEK, HALF, FULL][closest]
  }
</script>

<div class="comms-drawer" style="height: {drawerHeight}px">
  <div class="drag-handle" on:pointerdown={startDrag}>▬▬▬</div>
  {#if drawerHeight > PEEK}
    <!-- Message stream + compose -->
  {:else}
    <!-- Peek: channel name + unread count -->
  {/if}
</div>
```

### Desktop Comms Pane

Simpler than the drawer — a fixed-width right panel:

```svelte
<!-- src/app/views/CommsPane.svelte -->
<aside class="w-80 h-full border-l border-neutral-700 flex flex-col bg-neutral-900">
  <header class="p-3 border-b border-neutral-700">
    <!-- Channel name + encryption indicator -->
  </header>
  <div class="flex-1 overflow-y-auto">
    <!-- Message stream (reuse existing Feed component) -->
  </div>
  <footer class="p-3 border-t border-neutral-700">
    <!-- Compose bar -->
  </footer>
</aside>
```

### Full-Bleed Layout

Map mode must be full-bleed (no `max-w-2xl` wrapper). The current `fullBleedPaths` set in the layout system contains `/intel/map` — Map mode needs similar treatment. This is handled in 01-01 (mode store) by making layout mode-aware.

---

## Map ↔ Message Linking (Phase 3 prerequisite)

This view lays the groundwork for marker-message linking (Phase 3, task 03):
- Clicking a map marker should scroll the comms pane to the linked message
- Hovering a geo-tagged message should highlight its marker on the map
- This requires a shared store for selected-marker and selected-message

For now, the map and comms pane are independent. Linking comes in Phase 3.

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/MapView.svelte` | Map + comms drawer/pane orchestrator | ~100 |
| `src/app/views/CommsDrawer.svelte` | Mobile bottom sheet for messages | ~150 |
| `src/app/views/CommsPane.svelte` | Desktop side panel for messages | ~80 |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/App.svelte` | Render `MapView` when mode is "map", apply full-bleed |
| `src/app/Nav.svelte` | Adjust layout for full-bleed map mode |

---

## Verification

- [ ] Mobile: map fills screen, drawer shows in peek state
- [ ] Mobile: drag drawer to half — messages visible, map still visible above
- [ ] Mobile: drag drawer to full — full conversation with compose bar
- [ ] Desktop: three-column layout (sidebar + map + comms pane)
- [ ] Desktop: selecting a channel in sidebar updates the comms pane
- [ ] Map retains viewport (center, zoom) across mode switches
- [ ] Existing GEOINT markers render on the map
- [ ] Tools button opens layer controls (stub for now, implemented in Phase 4)
