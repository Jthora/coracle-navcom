# 03-03: Marker ↔ Message Linking

> Bi-directional linking between map markers and the messages that generated them.

**Priority**: HIGH — this is the "fused map+comms" that distinguishes NavCom from separate tools.  
**Effort**: MEDIUM  
**Depends on**: 01-04 (Map View), 03-01 (message type system)  
**Source**: [navcom-interface-synthesis.md](../../navcom-interface-synthesis.md) §Marker Message Linking, [navcom-gap-analysis.md](../../navcom-gap-analysis.md) §Top 10 Gap #4

---

## Concept

Any geo-tagged message (Check-In, SPOTREP, or manually geo-tagged regular message) creates a marker on the map. Clicking a marker scrolls the comms pane to that message. Hovering a geo-tagged message highlights its marker on the map.

This is the core ATAK pattern: the map and the comms channel are the same data, viewed two ways.

---

## Implementation

### 1. Auto-Generate Markers from Geo-Tagged Messages

When the channel feed loads, scan messages for location data (tags: `g`, `location`):

```typescript
// Derive map markers from channel messages
const geoMessages = $channelMessages.filter(m => 
  m.tags.some(t => t[0] === "location" || t[0] === "g")
)

const markers = geoMessages.map(m => ({
  id: m.id,
  lat: parseFloat(m.tags.find(t => t[0] === "location")[1].split(",")[0]),
  lng: parseFloat(m.tags.find(t => t[0] === "location")[1].split(",")[1]),
  type: m.tags.find(t => t[0] === "msg-type")?.[1] || "message",
  author: m.pubkey,
  timestamp: m.created_at,
  content: m.content.slice(0, 100),
}))
```

### 2. Marker → Message (Map tap scrolls to message)

When a marker on the map is clicked:
1. Set `selectedMarkerId` in a shared store
2. The comms pane/drawer scrolls to the message with that ID
3. The message flashes/highlights briefly

```typescript
// Shared store
export const selectedMarkerId = writable<string | null>(null)
export const selectedMessageId = writable<string | null>(null)

// Map: on marker click
function onMarkerClick(markerId: string) {
  selectedMessageId.set(markerId) // marker ID = message ID
}

// Comms pane: react to selection
$: if ($selectedMessageId) {
  scrollToMessage($selectedMessageId)
  highlightMessage($selectedMessageId)
}
```

### 3. Message → Marker (Message hover highlights marker)

When the user hovers over (desktop) or taps (mobile) a geo-tagged message in the comms pane:
1. Set `selectedMarkerId` in the shared store
2. The map pans to center on that marker
3. The marker pulses/highlights briefly

### 4. Marker Styling by Type

| Message Type | Marker Icon | Color |
|-------------|-------------|-------|
| Check-In | 📍 (pin) | `success` (green) |
| Alert | 🚨 (exclamation) | `danger` (red) |
| SPOTREP | 📌 (observation) | `accent` (cyan) |
| Regular (geo-tagged) | • (dot) | `neutral-400` |

Use Leaflet's `L.divIcon` for custom markers styled with the app's color tokens.

### 5. Marker Popups

Clicking a marker opens a small popup card:
```
┌─────────────────────────┐
│ 📌 SPOTREP               │
│ Echo  •  16:03            │
│ "Vehicle convoy..."      │
│ [View in chat →]          │
└─────────────────────────┘
```

"View in chat" scrolls the comms pane to the full message.

---

## Data Flow

```
Message posted with location
    ↓
Feed store processes event
    ↓
MapView derives markers from geo-tagged messages
    ↓
Leaflet renders markers
    ↓ (user clicks marker)
selectedMessageId store updated
    ↓
CommsPane/CommsDrawer scrolls to message
    ↓ (user hovers geo-tagged message)
selectedMarkerId store updated
    ↓
Leaflet highlights/pans to marker
```

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/MarkerPopup.svelte` | Map marker popup card | ~50 |
| `src/app/navcom-state.ts` (expand) | Add `selectedMarkerId`, `selectedMessageId` stores | ~10 |

## Files to Modify

| File | Change |
|------|--------|
| `MapView.svelte` (from 01-04) | Derive markers from channel messages, render on map |
| `CommsPane.svelte` / `CommsDrawer.svelte` | React to `selectedMessageId`, scroll + highlight |
| `IntelNavMap.svelte` | Accept external markers, react to `selectedMarkerId` |
| Message component | Add hover/tap handler for geo-tagged messages |

---

## Verification

- [ ] Check-In with location creates green marker on map
- [ ] SPOTREP creates cyan marker on map
- [ ] Alert with location creates red marker on map
- [ ] Clicking marker scrolls comms pane to corresponding message
- [ ] Hovering geo-tagged message highlights marker on map
- [ ] Marker popup shows message summary with "View in chat" link
- [ ] Markers update in real-time as new geo-tagged messages arrive
- [ ] Works in both mobile (drawer) and desktop (side panel) layouts
