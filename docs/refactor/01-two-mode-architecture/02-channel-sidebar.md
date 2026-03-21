# 01-02: Channel Sidebar

> Persistent channel list that replaces the Coracle navigation menu across all modes.

**Priority**: CRITICAL — the sidebar is the primary navigation element in all three modes.  
**Effort**: MEDIUM (~200 lines)  
**Depends on**: 01-01 (mode store)  
**Source**: [navcom-two-modes.md](../../navcom-two-modes.md), [navcom-interface-synthesis.md](../../navcom-interface-synthesis.md) §Channel Sidebar

---

## What It Replaces

Currently:
- **Desktop**: `MenuDesktop.svelte` — a nav link list (Announcements, Groups, Intel, Map, etc.)
- **Mobile**: `MenuMobile.svelte` — hamburger menu with the same links

These are Coracle social-client navigation patterns. NavCom needs a **channel list** — the user's groups with unread counts, encryption status, and online indicators.

---

## Design

### Desktop (≥1024px)

Persistent left sidebar, same 288px width as current `MenuDesktop`:

```
┌─────────────────────┐
│ NAVCOM          [⚙] │  ← Logo + settings gear
├─────────────────────┤
│ 🔒 HQ Command    3  │  ← Lock = encrypted, 3 = unread
│ 🔒 Alpha Team    1  │
│ 🔐 Intel            │  ← Different lock = T2 enforced
│    Announcements     │  ← No lock = unencrypted
│ 🔒 Logistics        │
├─────────────────────┤
│ [+ Join / Create]    │  ← Add channel action
└─────────────────────┘
```

### Mobile (<1024px)

In **Comms Mode**: the channel list IS the view (full-screen list). Tapping a channel transitions to the message stream.

In **Map/Ops Mode**: the channel sidebar is hidden. Active channel shown in the comms drawer or side panel.

---

## Data Source

Channel list data comes from existing group/channel stores. The sidebar renders:

| Field | Source | Display |
|-------|--------|---------|
| Channel name | Group metadata | Text label |
| Unread count | Existing unread tracking | Badge number |
| Encryption tier | `group-tier-policy.ts` | Lock icon variant |
| Online members | Relay presence (if available) | Optional count |
| Last message time | Channel feed | Relative timestamp |

---

## Implementation

### New Component: `src/app/views/ChannelSidebar.svelte`

```svelte
<script>
  import {groups} from "src/app/groups/state"
  // Render sorted list of user's groups
  // Each row: icon + name + unread badge + encryption indicator
</script>

<nav class="flex flex-col h-full bg-neutral-900 border-r border-neutral-700">
  <!-- Logo/header -->
  <!-- Channel list (scrollable) -->
  <!-- Add channel button (pinned bottom) -->
</nav>
```

### Channel Row Sub-Component

Each channel row is a clickable element that:
1. Sets the active channel in a store
2. In Comms Mode: navigates to the conversation view
3. In Map Mode: loads that channel's messages in the side panel
4. In Ops Mode: highlights that channel's activity in the dashboard

### Encryption Tier Icons

| Tier | Icon | Meaning |
|------|------|---------|
| T0 (open) | No icon | Unencrypted |
| T1 (encrypted, downgradeable) | 🔒 | Encrypted |
| T2 (enforced) | 🔐 | Cannot downgrade |

---

## Migration Path

1. `MenuDesktop.svelte` navigation links → keep Settings, remove social nav (Notes, Follows, Wallet)
2. Group list already exists in the codebase — this component wraps it with better UX
3. Don't delete `MenuDesktop.svelte` yet — `ChannelSidebar` replaces it gradually

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/views/ChannelSidebar.svelte` | Channel list with status indicators | ~200 |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/Nav.svelte` | Replace `MenuDesktop` slot with `ChannelSidebar` on desktop |
| `src/app/views/CommsView.svelte` | Render `ChannelSidebar` as primary view on mobile |

---

## Verification

- [ ] Desktop: sidebar is persistent across all mode switches
- [ ] Mobile/Comms: channel list is the full-screen view
- [ ] Mobile/Map & Ops: sidebar is not visible (space given to map/dashboard)
- [ ] Unread counts update in real time
- [ ] Encryption icons match the group's actual tier policy
- [ ] Tapping a channel opens the correct conversation
- [ ] "Join / Create" button opens group creation/join flow
