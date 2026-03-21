# WS-01: Map Integration

> **Pillar 4 — "The map is the territory."**
> Operational awareness requires spatial context. Communications without location are incomplete.

## Status: NOT STARTED

**Priority**: CRITICAL — Highest-leverage single change remaining
**Effort**: ~280 lines across 3 files
**Blocks**: 10 verification items (lines 270-277, 293-294 in progress-tracker.md)
**Dependencies**: None — IntelNavMap.svelte is fully functional on `/intel/map`

---

## Problem

MapView.svelte renders a button list of markers with a globe icon, not a geographic map.
OpsView.svelte shows a static globe icon placeholder for the map thumbnail.
Every map-related feature built across turns 5-7 (layers, clustering, draw tools, marker derivation, temporal filtering) targets a Leaflet instance that doesn't exist in the NavCom views.

This is the single biggest gap between "social client" and "operational comms platform."

---

## Current State

### What works (on `/intel/map` route)
- `IntelNavMap.svelte` — fully self-contained Leaflet 1.9.4 map
- Dynamic import: `const mod = await import("leaflet")`
- Custom mil-spec markers via `L.divIcon()` with CSS styling
- Tile switching (street/satellite/terrain) via `mapTileSet` store subscription
- Marker layer group, fit-to-bounds, resize listener
- Full lifecycle management (mount/destroy/abort)

### What exists in MapView (placeholder)
- Responsive layout: mobile bottom-sheet drawer (peek/half/full), desktop side-panel
- Marker derivation from geo-tagged messages (real data)
- Layer filtering (checkIns/alerts/spotreps/memberPositions)
- Time range filtering (1h/24h/7d/all)
- `MapLayerPanel` panel toggle
- `MapDrawTools` tool selection
- `selectedMarkerId` ↔ `selectedMessageId` bidirectional linking

### Store bridge (already wired in navcom-mode.ts)
- `mapViewport` — `{center: [number, number]; zoom: number}` persisted to localStorage
- `mapLayers` — `MapLayerConfig` (4 boolean toggles)
- `mapTileSet` — `TileSetId` ("street"|"satellite"|"terrain")
- `mapTimeRange` — `"1h"|"24h"|"7d"|"all"`
- `selectedMarkerId` / `selectedMessageId` — writable stores for cross-linking

---

## Implementation Plan

### Task 1: Embed IntelNavMap in MapView.svelte

**File**: `src/app/views/MapView.svelte`
**Lines**: Replace 148-161 (marker list placeholder)

**Changes**:
1. Import IntelNavMap at top of script block
2. Replace placeholder div with `<IntelNavMap />` component
3. IntelNavMap is self-contained (no props needed) — it subscribes to `mapTileSet` internally
4. Wire `mapViewport` store: save center/zoom on map `moveend` event, restore on mount
5. Pass derived markers to IntelNavMap's marker layer (requires adding a `markers` prop or using a shared store)

**Decision point**: IntelNavMap currently manages its own data sources. Two options:
- **Option A** (minimal): Import IntelNavMap as-is, let it show its existing markers alongside NavCom markers
- **Option B** (clean): Add a `markers` prop to IntelNavMap, pass NavCom's derived markers, disable its internal data loading

**Recommended**: Option A first (gets map on screen), then Option B as refinement.

**Estimated lines**: ~40 lines changed in MapView.svelte

### Task 2: Wire marker interaction

**File**: `src/app/views/MapView.svelte` + `src/app/views/IntelNavMap.svelte`

**Changes**:
1. Add `on:markerclick` event to IntelNavMap (dispatch `selectedMarkerId` on marker tap)
2. Subscribe to `selectedMarkerId` in IntelNavMap — highlight/pulse selected marker
3. Subscribe to `selectedMessageId` in MapView — pan map to marker location when message hover

**Estimated lines**: ~60 lines across both files

### Task 3: Map thumbnail in OpsView

**File**: `src/app/views/OpsView.svelte`
**Lines**: Replace 31-37 (globe placeholder)

**Changes**:
1. Create inline read-only map: import Leaflet dynamically, create non-interactive `L.map()` with `{zoomControl: false, dragging: false, scrollWheelZoom: false}`
2. Size constrained to `h-48` container
3. Show markers from `groupSummaries` (same derivation as MapView)
4. On click: `setMode("map")`

**Estimated lines**: ~80 lines

### Task 4: Viewport persistence

**File**: `src/app/navcom-mode.ts` (already has `mapViewport` store)
**File**: `src/app/views/IntelNavMap.svelte`

**Changes**:
1. On IntelNavMap mount: read `$mapViewport` and call `map.setView(center, zoom)`
2. On IntelNavMap `moveend`: update `mapViewport.set({center: map.getCenter(), zoom: map.getZoom()})`

**Estimated lines**: ~20 lines

### Task 5: DrawTools + LayerPanel integration

Already functional — `MapDrawTools` and `MapLayerPanel` render in MapView.
Once IntelNavMap is embedded, need to:
1. Wire `mapLayers` store to show/hide marker categories on actual map
2. Wire draw tool events to create Leaflet draw overlays

**Estimated lines**: ~80 lines

---

## Verification Items Unblocked

After completion, these can be manually tested:

- [ ] Mobile: map fills screen, drawer shows in peek state (line 270)
- [ ] Mobile: drag drawer to half → messages visible, map still visible above (line 271)
- [ ] Mobile: drag drawer to full → full conversation with compose bar (line 272)
- [ ] Desktop: three-column layout (sidebar + map + comms pane) (line 273)
- [ ] Desktop: selecting channel in sidebar updates comms pane (line 274)
- [ ] Map retains viewport (center, zoom) across mode switches (line 275)
- [ ] Existing GEOINT markers render on map (line 276)
- [ ] Tools button opens layer controls (line 277)
- [ ] Map thumbnail shows actual GEOINT markers (line 293)
- [ ] Tapping map thumbnail switches to Map mode (line 294)

---

## Test Strategy

1. **Unit test**: `mapViewport` store persistence (read/write/localStorage round-trip)
2. **Integration test**: Marker derivation → marker count matches expected for test channel data
3. **Manual test**: All 10 verification items above require visual confirmation on mobile + desktop viewports

---

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `src/app/views/MapView.svelte` | Replace placeholder with IntelNavMap | ~100 |
| `src/app/views/IntelNavMap.svelte` | Add marker interaction events, viewport sync | ~60 |
| `src/app/views/OpsView.svelte` | Replace globe icon with map thumbnail | ~80 |
| `src/app/navcom-mode.ts` | No changes (stores already exist) | 0 |
| **Total** | | **~240** |
