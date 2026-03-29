# 04-02: Clustering & Temporal Filtering

> Group dense markers into clusters, filter markers by time range.

**Priority**: MEDIUM — prevents map from becoming unreadable with many markers.  
**Effort**: LOW–MEDIUM  
**Depends on**: 01-04 (Map View), 03-03 (marker-message linking)  
**Source**: [navcom-interface-synthesis.md](../../navcom-interface-synthesis.md) §Map Enhancements

---

## Marker Clustering

### Problem

With 100+ geo-tagged messages, the map becomes a sea of overlapping markers. Individual markers are unclickable and the map is unreadable.

### Solution

Use Leaflet's `markerCluster` plugin to group nearby markers at low zoom levels and expand them as the user zooms in.

```
npm install leaflet.markercluster
```

### Cluster Behavior

| Zoom Level | Display |
|-----------|---------|
| Low (city-level) | Numbered cluster circles: "23" markers here |
| Medium (neighborhood) | Smaller clusters with type breakdown |
| High (street-level) | Individual markers with icons |

### Cluster Styling

Clusters use the same color language as markers:
- If cluster contains alerts → red cluster border
- If cluster contains only check-ins → green cluster
- Mixed → accent (cyan) cluster

---

## Temporal Filtering

### Problem

Historical markers accumulate. Yesterday's check-ins aren't relevant today. The user needs to filter by time without deleting data.

### Solution

A time range slider in the layer panel (04-01) that filters visible markers:

```
Show markers from: [Last hour ▸ Today ▸ Last 7 days ▸ All time]
```

### Implementation

- Segmented control (not a continuous slider — discrete useful ranges)
- Default: "Today" (last 24 hours)
- Filters apply to all data layers
- Doesn't affect the message stream in comms — only map markers

### State

```typescript
export type TimeRange = "1h" | "24h" | "7d" | "all"

export const mapTimeRange = synced({
  key: "ui/map-time-range",
  defaultValue: "24h" as TimeRange,
  storage: localStorageProvider,
})
```

---

## Files to Create/Modify

| Action | File | Change |
|--------|------|--------|
| Add dependency | `package.json` | `leaflet.markercluster` |
| Modify | `IntelNavMap.svelte` | Add cluster layer, apply time filter |
| Modify | `MapLayerPanel.svelte` (from 04-01) | Add time range selector |
| Modify | `src/app/navcom-state.ts` | Add `mapTimeRange` store |

---

## Verification

- [ ] 100+ markers cluster at low zoom
- [ ] Clicking cluster zooms to show individual markers
- [ ] Cluster shows count number
- [ ] Alert-containing clusters have red indicator
- [ ] Time range "Last hour" hides older markers
- [ ] Time range "All time" shows everything
- [ ] Changing time range doesn't affect message stream
