# 04-01: Layer Controls

> Toggle map layers on/off — GEOINT markers, operator positions, alert zones, base tiles.

**Priority**: MEDIUM  
**Effort**: LOW–MEDIUM  
**Depends on**: 01-04 (Map View), 03-03 (marker-message linking)  
**Source**: [navcom-gap-analysis.md](../../navcom-gap-analysis.md) §Top 10 Gap #9, [navcom-interface-synthesis.md](../../navcom-interface-synthesis.md) §Layer Controls

---

## Design

A collapsible layer panel accessed via a [🔧 Tools] button on the map.

### Mobile

Tools button in the top-right of the map. Tap to expand a panel:

```
┌─────────────────────────┐
│ MAP LAYERS              │
│ ☑ Check-Ins             │
│ ☑ Alerts                │
│ ☑ SPOTREPs              │
│ ☐ All Members           │  ← Off by default (can be noisy)
│ ☑ Base Map: Street      │
│   ○ Satellite           │
│   ○ Terrain             │
│ [Close]                 │
└─────────────────────────┘
```

### Desktop

Same panel, positioned as a floating card in the top-right corner of the map area.

---

## Layer Types

### Data Layers (togglable)

| Layer | Default | Data Source |
|-------|---------|-------------|
| Check-Ins | ON | Messages with `msg-type: check-in` + location |
| Alerts | ON | Messages with `msg-type: alert` + location |
| SPOTREPs | ON | Messages with `msg-type: spotrep` + location |
| Member Positions | OFF | Last check-in per member (aggregated) |

### Base Map Tiles (radio select)

| Tile Set | Source |
|----------|--------|
| Street (default) | OpenStreetMap |
| Satellite | Requires tile provider (Mapbox, Esri, etc.) |
| Terrain | OpenTopoMap or similar |

### Future Layers (not in this phase)

- Custom drawn shapes (Phase 4 task 03)
- Historical markers with time filter (Phase 4 task 02)
- Relay coverage areas
- Custom GeoJSON imports

---

## Implementation

### Layer State Store

```typescript
// src/app/navcom-state.ts (expand)
import {synced, localStorageProvider} from "@welshman/store"

export const mapLayers = synced({
  key: "ui/map-layers",
  defaultValue: {
    checkIns: true,
    alerts: true,
    spotreps: true,
    memberPositions: false,
  },
  storage: localStorageProvider,
})

export const mapTileSet = synced({
  key: "ui/map-tileset",
  defaultValue: "street",
  storage: localStorageProvider,
})
```

### Layer Panel Component

```
src/app/views/MapLayerPanel.svelte (~80 lines)
```

Checkboxes bound to `mapLayers` store. Radio buttons bound to `mapTileSet` store. Changes take effect immediately on the map.

### Map Integration

`IntelNavMap.svelte` (or `MapView.svelte`) subscribes to `mapLayers` and filters rendered markers accordingly.

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/MapLayerPanel.svelte` | Layer toggle panel | ~80 |

## Files to Modify

| File | Change |
|------|--------|
| `MapView.svelte` | Add Tools button, render `MapLayerPanel` |
| `IntelNavMap.svelte` | Filter markers by active layers, switch tile set |
| `src/app/navcom-state.ts` | Add `mapLayers`, `mapTileSet` stores |

---

## Verification

- [ ] Tools button opens layer panel
- [ ] Toggling a layer shows/hides corresponding markers
- [ ] Layer preferences persist across sessions (localStorage)
- [ ] Switching base map tile set changes the map background
- [ ] Member Positions layer aggregates last check-in per user
- [ ] Panel is dismissible and doesn't obscure map controls
