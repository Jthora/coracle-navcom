# 01-05: Ops Dashboard

> Operational overview — the "CIC screen" that replaces Announcements as the landing page for coordinators.

**Priority**: HIGH — top-ranked gap in gap analysis (#1).  
**Effort**: MEDIUM (~250 lines)  
**Depends on**: 01-01 (mode store), 01-02 (channel sidebar)  
**Source**: [navcom-two-modes.md](../../navcom-two-modes.md), [navcom-gap-analysis.md](../../navcom-gap-analysis.md) §Top 10 Gaps, [navcom-ux-critique.md](../../navcom-ux-critique.md) §12

---

## Design Principle

The dashboard answers three questions at a glance:
1. **Where are things?** (map thumbnail with recent markers)
2. **What's happening?** (recent activity feed)
3. **How are my channels?** (status cards with unread/online/encryption)

Per the UX critique (§12): "Dashboard tries to be everything." This design limits scope to these three panels only.

---

## Layout

### Mobile (<1024px)

Vertical scroll with three cards:

```
┌─────────────────────────┐
│ [Status: ● Connected]   │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │    MAP THUMBNAIL    │ │  ← Last 5 GEOINT markers, tap to expand to Map mode
│ │    (200px height)   │ │
│ └─────────────────────┘ │
│                         │
│ YOUR CHANNELS           │
│ ┌─────────────────────┐ │
│ │ HQ Command  3 new 🟢│ │  ← Name, unread, online count
│ │ Alpha Team  1 new 🟢│ │
│ │ Intel            🟡 │ │
│ └─────────────────────┘ │
│                         │
│ RECENT ACTIVITY         │
│ ┌─────────────────────┐ │
│ │ 14:23 Alert from HQ │ │
│ │ 14:15 Check-In: Brv │ │
│ │ 14:02 SITREP filed  │ │
│ │ 13:50 New member     │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ 💬 Chat | 🗺 Map | 📋 Ops │
└─────────────────────────┘
```

### Desktop (≥1024px)

```
┌──────────┬────────────────────┬────────────┐
│ Sidebar  │  MAP THUMBNAIL     │ RECENT     │
│ (channels│  (400px height)    │ ACTIVITY   │
│  list)   │                    │            │
│          ├────────────────────│ 14:23 Alert│
│          │  CHANNEL STATUS    │ 14:15 Chk  │
│          │  CARDS (grid)      │ 14:02 SIT  │
│          │  HQ | Alpha | Intel│ 13:50 New  │
│          │  Logi | Announce   │            │
├──────────┴────────────────────┴────────────┤
│ 💬 Chat | 🗺 Map | 📋 Ops                   │
└────────────────────────────────────────────┘
```

---

## Implementation

### New Component: `src/app/views/OpsView.svelte`

```svelte
<script>
  // Map thumbnail: use existing IntelNavMap with reduced interactivity
  // Channel cards: derive from group state
  // Activity feed: derive from recent events across all channels
</script>

<div class="ops-dashboard">
  <MapThumbnail />
  <ChannelStatusGrid />
  <RecentActivityFeed />
</div>
```

### Map Thumbnail

A read-only, non-interactive version of the map showing the last N GEOINT markers. Tap/click opens Map mode.

Options:
- Render a small Leaflet instance with `zoomControl: false`, `dragging: false`
- Or render a static image snapshot (lower effort, less useful)

Recommend: small Leaflet instance. The existing `IntelNavMap.svelte` can be wrapped with props to disable interaction.

### Channel Status Cards

Each card shows:

| Field | Source |
|-------|--------|
| Channel name | Group metadata |
| Unread count | Unread tracking store |
| Online members | Relay presence (if available, else omit) |
| Encryption tier | `group-tier-policy.ts` → icon |
| Last activity | Most recent event timestamp |

Cards are clickable — tap to switch to Comms mode with that channel selected.

### Recent Activity Feed

A reverse-chronological list of notable events across all channels:
- Alerts (highest priority, shown first)
- Check-Ins
- SITREPs / SPOTREPs (once message types exist in Phase 3)
- New members joining
- Announcements

Each item: `[timestamp] [type icon] [summary text] [channel tag]`

Tapping an item opens the source message in Comms mode.

**Data source**: Aggregate the most recent N events from all subscribed channel feeds. Filter to "interesting" event types (not every regular chat message).

---

## What This Is NOT

The dashboard is NOT:
- A real-time monitoring console (no live-updating charts)
- A relay health dashboard (that's in Settings)
- An admin panel (group management stays in group settings)
- Customizable (no drag-and-drop widgets)

These are all deferred to future phases if needed. Keep it simple: three panels, one purpose.

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/OpsView.svelte` | Dashboard orchestrator | ~100 |
| `src/app/views/MapThumbnail.svelte` | Read-only map preview | ~60 |
| `src/app/views/ChannelStatusGrid.svelte` | Channel card grid | ~50 |
| `src/app/views/RecentActivityFeed.svelte` | Activity list | ~40 |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/App.svelte` | Render `OpsView` when mode is "ops" |

---

## Verification

- [ ] Mobile: three cards stack vertically, scrollable
- [ ] Desktop: three-column layout with sidebar
- [ ] Map thumbnail shows actual GEOINT markers
- [ ] Tapping map thumbnail switches to Map mode
- [ ] Channel cards show correct unread counts and encryption tiers
- [ ] Tapping a channel card switches to Comms mode with that channel active
- [ ] Activity feed shows most recent events across all channels
- [ ] Tapping an activity item opens the source message
- [ ] Dashboard data refreshes each time Ops mode is entered
