# 04-03: Draw Tools

> Let users draw points, lines, and polygons on the map, generating geo-tagged messages.

**Priority**: LOW — per UX critique, draw tools are power features used by < 5% of users.  
**Effort**: MEDIUM  
**Depends on**: 01-04 (Map View), 04-01 (layer controls)  
**Source**: [navcom-interface-synthesis.md](../../navcom-interface-synthesis.md) §Draw Tools, [navcom-ux-critique.md](../../navcom-ux-critique.md) §11

---

## Design Decision

From UX critique §11: "Draw tools are power features (< 5% will use) — hide by default." These are only visible in Map mode behind the Tools panel, not in the default compose flow.

---

## Capabilities

### Drawing Types

| Type | Use Case | Output |
|------|----------|--------|
| Point | Mark a specific location | Lat/lng coordinate → SPOTREP |
| Line | Mark a route or boundary line | Array of coordinates → GeoJSON |
| Polygon | Mark an area (zone, region) | Array of coordinates → GeoJSON |
| Circle | Mark a radius around a point | Center + radius → GeoJSON |

### Workflow

1. Open Map mode → Tools → Draw
2. Select shape type (point/line/polygon/circle)
3. Tap/click on map to place vertices
4. Complete shape by double-tap or "Done" button
5. Form opens: "Describe this [point/area/route]" + optional label
6. Submit → generates a geo-tagged message in the active channel
7. Shape renders as a persistent overlay on the map

### Shape Message Encoding

```json
{
  "kind": 445,
  "content": "Supply route via Highway 7 — clear as of 15:00",
  "tags": [
    ["h", "<group-id>"],
    ["msg-type", "geo-annotation"],
    ["geo-type", "LineString"],
    ["geojson", "{\"type\":\"LineString\",\"coordinates\":[[lng1,lat1],[lng2,lat2],...]}"],
    ["label", "Supply Route Alpha"]
  ]
}
```

> **NIP note**: Kind 445 is the NIP-EE group event kind (`GROUP_KINDS.NIP_EE.GROUP_EVENT`). The `geo-annotation`, `geo-type`, `geojson`, and `label` tags are NavCom-proprietary. See [NIP Inventory](../nip-inventory.md).

### Leaflet Integration

Use Leaflet.draw or a lightweight alternative:
- `leaflet-draw` — mature, widely used
- `leaflet-geoman` — more modern, better maintained

Recommend: `leaflet-geoman` (better touch support for mobile).

---

## Access Path

```
Map Mode → [🔧 Tools] → Draw section (collapsed by default)
  → Point
  → Line
  → Polygon
  → Circle
```

Not visible in Comms or Ops mode. Not in the compose bar. Only in Map mode's tool panel.

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/MapDrawTools.svelte` | Draw tool controls | ~120 |
| `src/app/views/GeoAnnotationForm.svelte` | Form for labeling drawn shapes | ~80 |

## Files to Modify

| File | Change |
|------|--------|
| `MapLayerPanel.svelte` | Add "Draw" section |
| `IntelNavMap.svelte` | Integrate drawing library, render GeoJSON overlays |
| `package.json` | Add `leaflet-geoman` or `leaflet-draw` |
| Message rendering | Render `geo-annotation` type as shape on map |

---

## Verification

- [ ] Draw tools only visible in Map mode behind Tools panel
- [ ] Can draw point, line, polygon, circle
- [ ] Drawing completes correctly on both mobile (touch) and desktop (click)
- [ ] Completing a shape opens the description form
- [ ] Submitted annotation appears as message in active channel
- [ ] Shape renders as overlay on map for all viewers
- [ ] GeoJSON is properly encoded in the Nostr event tags
