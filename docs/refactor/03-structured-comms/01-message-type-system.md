# 03-01: Message Type System

> Add structured message types beyond plain text — Check-In, Alert, SITREP, SPOTREP.

**Priority**: HIGH — this is what makes NavCom operational, not just another chat app.  
**Effort**: MEDIUM  
**Depends on**: 01-03 (Comms View — compose bar exists)  
**Source**: [navcom-interface-synthesis.md](../../navcom-interface-synthesis.md) §Message Types, [navcom-ux-critique.md](../../navcom-ux-critique.md) §4, §8

> **NIP Reference**: Messages use kind **445** (`GROUP_KINDS.NIP_EE.GROUP_EVENT`) for group chat, NOT the deprecated kind 42 (NIP-28). Custom tags `["msg-type", ...]` are NavCom-proprietary — consider migrating to NIP-32 labeling (`["L", "navcom.msg-type"]` + `["l", "check-in", "navcom.msg-type"]`) if cross-client interoperability becomes a goal. See [NIP Inventory](../nip-inventory.md).

---

## Design Decisions (from UX Critique)

1. **Start with two types, not six** — Check-In and Alert are universally understood. SITREP and SPOTREP are added later via progressive disclosure.
2. **Regular messages have no badge** — only non-default types get a visual badge. This avoids badge noise on every message.
3. **Hidden by default for new users** — the type selector appears after the user has sent N regular messages (behavior-triggered, not time-triggered).

---

## Message Types

### Phase 3a: Core Types (build first)

| Type | Badge | Purpose | Fields |
|------|-------|---------|--------|
| **MESSAGE** | None | Regular chat message | Free text (default) |
| **CHECK-IN** | 📍 | "I'm here, I'm fine" | Auto-location (optional), auto-timestamp |
| **ALERT** | 🚨 | Something needs attention | Priority (low/med/high), description |

### Phase 3b: Structured Reports (build second)

| Type | Badge | Purpose | Fields |
|------|-------|---------|--------|
| **SITREP** | 📋 | Situation report | Who, What, Where, When, Assessment |
| **SPOTREP** | 📌 | Spot report (geo-tagged observation) | Location (required), observation, classification |

---

## Compose Bar Integration

### Default State (new user)

```
┌─────────────────────────────┐
│ [Message...              ] ➤│  ← Plain text compose, no type selector
└─────────────────────────────┘
```

### After N Messages (progressive disclosure)

```
┌─────────────────────────────┐
│ [📎] [Message...         ] ➤│
└─────────────────────────────┘
       ↕ tap 📎
┌─────────────────────────────┐
│ 💬 Message                   │
│ 📍 Check-In                  │
│ 🚨 Alert                     │
│ 📋 SITREP                    │  ← Visible after more usage
│ 📌 SPOTREP                   │
└─────────────────────────────┘
```

Selecting a type other than Message modifies the compose bar:

**Check-In**:
```
┌─────────────────────────────┐
│ 📍 CHECK-IN                  │
│ [Optional note...        ] ➤│
│ 📍 Attaching location...     │  ← Auto-attaches geo if available
└─────────────────────────────┘
```

**Alert**:
```
┌─────────────────────────────┐
│ 🚨 ALERT  [Low|Med|●High]   │
│ [What's happening?       ] ➤│
└─────────────────────────────┘
```

---

## Message Rendering

In the message stream, structured messages render as formatted cards, not raw text:

### Check-In Card
```
┌─────────────────────────────┐
│ 📍 CHECK-IN                  │
│ Bravo  •  14:23              │
│ "All clear at north gate"    │  ← Optional note
│ 📍 34.0522°N, 118.2437°W    │  ← Location if attached
└─────────────────────────────┘
```

### Alert Card
```
┌─────────────────────────────────┐
│ 🚨 ALERT — HIGH PRIORITY        │  ← Red/amber border based on priority
│ Charlie  •  14:31                │
│ "Perimeter breach detected       │
│  at south entrance"              │
└─────────────────────────────────┘
```

Regular messages render as before (no card, no badge).

---

## Nostr Event Encoding

Structured messages use kind **445** (`GROUP_KINDS.NIP_EE.GROUP_EVENT`) — the same kind as regular group messages — with additional tags for type metadata. The `["h", groupId]` tag (standard NIP-29/NIP-EE group tag) is assumed present on all group events.

### Tag Design: NavCom-Proprietary vs NIP-32 Labeling

The tags below use a simple `["msg-type", value]` convention. This is **NavCom-proprietary** — no other Nostr client will interpret it. If future interoperability is desired, migrate to NIP-32 namespace labeling:

```json
// NavCom-proprietary (current design)
["msg-type", "check-in"]

// NIP-32 compliant (future migration path)
["L", "navcom.msg-type"]
["l", "check-in", "navcom.msg-type"]
```

For Phase 3a, use the simpler proprietary format. The migration to NIP-32 is mechanical and can be done later.

### Examples

```json
{
  "kind": 445,
  "content": "All clear at north gate",
  "tags": [
    ["h", "<group-id>"],
    ["msg-type", "check-in"],
    ["g", "<geohash>"],
    ["location", "34.0522,-118.2437"]
  ]
}
```

```json
{
  "kind": 445,
  "content": "Perimeter breach detected at south entrance",
  "tags": [
    ["h", "<group-id>"],
    ["msg-type", "alert"],
    ["priority", "high"]
  ]
}
```

Regular messages have no `msg-type` tag.

> **Note on location tags**: The `["g", geohash]` tag is widely used across the Nostr ecosystem for geospatial filtering. The `["location", "lat,lng"]` tag is NavCom-proprietary — it provides human-readable precision that geohashes lack, but other clients won't parse it.

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/MessageTypeSelector.svelte` | Type picker in compose bar | ~80 |
| `src/app/views/CheckInCard.svelte` | Check-in message renderer | ~40 |
| `src/app/views/AlertCard.svelte` | Alert message renderer | ~50 |
| `src/app/views/SitrepCard.svelte` | SITREP renderer (Phase 3b) | ~60 |
| `src/app/views/SpotrepCard.svelte` | SPOTREP renderer (Phase 3b) | ~60 |

## Files to Modify

| File | Change |
|------|--------|
| Compose component | Add type selector trigger, modify event creation |
| Message rendering component | Detect `msg-type` tag, render appropriate card |
| `src/app/util/geoint.ts` | Reuse for location attachment in Check-In/SPOTREP |

---

## Progressive Disclosure Trigger

Store in localStorage: `compose-message-count: N`

- N < 10: no type selector visible
- N ≥ 10: show type selector icon (📎) in compose bar
- N ≥ 30: SITREP and SPOTREP types become visible in selector

---

## Verification

- [ ] Default compose bar shows no type selector for new users
- [ ] After 10 messages, type selector icon appears
- [ ] Selecting Check-In sends event with `msg-type: check-in` tag
- [ ] Check-In auto-attaches geolocation if browser permission granted
- [ ] Alert renders with priority-colored border
- [ ] Regular messages render unchanged (no badge, no card)
- [ ] Structured message cards are visually distinct from regular messages
- [ ] Message types work in both encrypted and unencrypted channels
