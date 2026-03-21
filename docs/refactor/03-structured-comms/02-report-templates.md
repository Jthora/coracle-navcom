# 03-02: Report Templates

> Structured forms for SITREP and SPOTREP reports that generate well-formatted messages.

**Priority**: MEDIUM — important for operational intelligence, but builds on message type system.  
**Effort**: MEDIUM  
**Depends on**: 03-01 (message type system)  
**Source**: [navcom-interface-synthesis.md](../../navcom-interface-synthesis.md) §Structured Reporting, [navcom-ux-critique.md](../../navcom-ux-critique.md) §4

> **NIP Reference**: Uses kind **445** (NIP-EE group event). Photo attachments use NIP-92 `["imeta", ...]` inline tags (preferred) or NIP-94 kind 1063 file metadata events. See [NIP Inventory](../nip-inventory.md).

---

## Design Decision

From the UX critique: "NATO report templates are training requirements." Full SALUTE/MIST/9-line formats require training. Start with simplified versions that any user can fill out.

---

## SITREP (Situation Report)

### Form

```
┌──────────────────────────────┐
│ 📋 SITUATION REPORT           │
├──────────────────────────────┤
│ What's happening?             │
│ ┌──────────────────────────┐ │
│ │ [free text]              │ │
│ └──────────────────────────┘ │
│                              │
│ Where?                       │
│ ┌──────────────────────────┐ │
│ │ [location / 📍 Use GPS]  │ │
│ └──────────────────────────┘ │
│                              │
│ How serious?                 │
│ [Routine] [Important] [Urgent]│
│                              │
│ [SEND SITREP]                │
└──────────────────────────────┘
```

Three fields. No military acronyms. Anyone can fill this out.

### Rendered Card

```
┌──────────────────────────────────┐
│ 📋 SITREP — IMPORTANT            │
│ Delta  •  15:42                   │
│                                   │
│ "Road blocked by fallen tree on   │
│  Route 7, approximately 2km       │
│  north of checkpoint."            │
│                                   │
│ 📍 34.0522°N, 118.2437°W         │
└──────────────────────────────────┘
```

---

## SPOTREP (Spot Report)

### Form

SPOTREPs are geo-tagged observations. Location is required (the whole point is "I saw something HERE").

```
┌──────────────────────────────┐
│ 📌 SPOT REPORT                │
├──────────────────────────────┤
│ What did you observe?         │
│ ┌──────────────────────────┐ │
│ │ [free text]              │ │
│ └──────────────────────────┘ │
│                              │
│ Location (required)          │
│ ┌──────────────────────────┐ │
│ │ [📍 Use GPS] or tap map  │ │
│ └──────────────────────────┘ │
│                              │
│ [Optional: attach photo 📷]  │
│                              │
│ [SEND SPOTREP]               │
└──────────────────────────────┘
```

### Map Integration

- SPOTREP location is required — either GPS auto-detect or manual pin-drop
- When in Map mode, "File SPOTREP" can be triggered by long-pressing the map → "Report here"
- SPOTREPs auto-generate map markers (see 03-03)

### Rendered Card

```
┌──────────────────────────────────┐
│ 📌 SPOTREP                       │
│ Echo  •  16:03                    │
│                                   │
│ "Vehicle convoy, 3 trucks,       │
│  heading east on Route 12"        │
│                                   │
│ 📍 34.0612°N, 118.2501°W         │
│ 📷 [photo thumbnail]              │
└──────────────────────────────────┘
```

---

## Nostr Event Encoding

### SITREP

```json
{
  "kind": 445,
  "content": "Road blocked by fallen tree on Route 7",
  "tags": [
    ["h", "<group-id>"],
    ["msg-type", "sitrep"],
    ["severity", "important"],
    ["g", "<geohash>"],
    ["location", "34.0522,-118.2437"]
  ]
}
```

### SPOTREP

```json
{
  "kind": 445,
  "content": "Vehicle convoy, 3 trucks, heading east on Route 12",
  "tags": [
    ["h", "<group-id>"],
    ["msg-type", "spotrep"],
    ["g", "<geohash>"],
    ["location", "34.0612,-118.2501"]
  ]
}
```

### Photo Attachments

When a SPOTREP includes a photo, use **NIP-92 inline media metadata** (the `["imeta", ...]` tag). The codebase already renders kind 1063 (NIP-94) file metadata events, but NIP-92 inline tags are simpler for embedded attachments:

```json
{
  "kind": 445,
  "content": "Vehicle convoy on Route 12 https://media.example/photo.jpg",
  "tags": [
    ["h", "<group-id>"],
    ["msg-type", "spotrep"],
    ["imeta", "url https://media.example/photo.jpg", "m image/jpeg", "dim 1280x720"],
    ["g", "<geohash>"],
    ["location", "34.0612,-118.2501"]
  ]
}
```

The URL appears in `content` (rendered by existing media parsers) and the `imeta` tag provides structured metadata. This approach:
- Works with the existing `NoteContent` media rendering pipeline
- Doesn't require creating a separate kind 1063 event
- Is NIP-92 compliant

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/SitrepForm.svelte` | SITREP form overlay | ~100 |
| `src/app/views/SpotrepForm.svelte` | SPOTREP form overlay | ~120 |

## Files to Modify

| File | Change |
|------|--------|
| `MessageTypeSelector.svelte` (from 03-01) | Wire SITREP/SPOTREP buttons to open forms |
| Message rendering | Render SITREP/SPOTREP cards |
| `src/app/util/geoint.ts` | Reuse for location fields |

---

## Verification

- [ ] SITREP form opens from type selector
- [ ] SITREP form has 3 fields: description, location, severity
- [ ] Submitted SITREP renders as formatted card in channel
- [ ] SPOTREP form requires location (submit disabled without it)
- [ ] GPS button fills location automatically
- [ ] SPOTREP with photo shows thumbnail in rendered card
- [ ] Both report types work in encrypted channels
- [ ] Both report types include proper Nostr tags for filtering
