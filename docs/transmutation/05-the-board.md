# 05 — The Board

> Phase 3 Implementation Spec · Innovation 2 from [playbook.md](playbook.md)
> **Collapses:** Gap 4 (OPS view is a snapshot, not a command surface) + Gap 1 (first-run confusion)
> **Effort:** Medium-High · **Risk:** Medium · **Architecture changes:** One new view component, tile system, layout persistence store, Routes.svelte modification

---

## Table of Contents

1. [Why The Board Exists](#why-the-board-exists)
2. [The Current OpsView: What It Does and Where It Fails](#current-opsview)
3. [Design Philosophy: Tiles, Not Panels](#design-philosophy)
4. [Tile Vocabulary](#tile-vocabulary)
5. [Layout System](#layout-system)
6. [Archetype Default Layouts](#archetype-default-layouts)
7. [New Files](#new-files)
8. [Modified Files](#modified-files)
9. [Tile Architecture](#tile-architecture)
10. [Data Sources per Tile](#data-sources-per-tile)
11. [Responsive Behavior](#responsive-behavior)
12. [Sovereign Mode Rendering](#sovereign-mode-rendering)
13. [What Does NOT Change](#what-does-not-change)
14. [Phase Dependencies](#phase-dependencies)
15. [Risks and Mitigations](#risks-and-mitigations)
16. [Testing Plan](#testing-plan)
17. [Acceptance Criteria](#acceptance-criteria)

---

## Why The Board Exists

OVERWATCH needs three things simultaneously: the map with markers, the group health status, and the recent activity feed. All three exist — but in different modes. The map is in MAP mode. Group status is in OPS mode. The activity feed is also in OPS mode but shares space with the map thumbnail and channel grid. OVERWATCH cannot see all three at the operational density they need.

ARCHITECT needs a different set: group health badges (from Presence-from-Publishing), member role distributions, relay isolation status (from Relay Fingerprint Gate), and connection state (from Sovereign Mode). The current OPS view shows some of this but not all, and in a fixed layout that can't be reconfigured.

SWITCHBLADE needs almost nothing from OPS mode — they operate in COMMS and occasionally glance at the map. When they do look at OPS, the 2-column grid with a map thumbnail is wasted space on their phone.

The Board replaces the fixed OpsView with a **configurable tile dashboard** where each operator can arrange the tiles that matter to their role and context. It is the command surface the doctrine envisions — *"every screen is a decision surface"* — and it integrates output from every prior phase:

| Phase | Innovation | Board Tile |
|-------|-----------|------------|
| Phase 1 | The Briefing | N/A (one-time onboarding) |
| Phase 1 | Presence-from-Publishing | Personnel Status tile, Group Status tile |
| Phase 1 | Relay Fingerprint Gate | Security Status tile |
| Phase 2 | Sovereign Mode | Connection Status tile |
| Phase 3 | The Board | The Board itself |
| Phase 4 | Trust Attestation | Trust Overview tile |

---

## The Current OpsView: What It Does and Where It Fails {#current-opsview}

From `src/app/views/OpsView.svelte` (162 lines script + 95 lines template):

### Current Layout (hardcoded 2-column grid)

```
┌─────────────────────┬──────────────────────────┐
│   Map Thumbnail     │   Channel Status Grid     │
│   (clickable →MAP)  │   (list of all groups)    │
│   h-48, Leaflet     │   title, encryption,      │
│                     │   members, msg-types,      │
│                     │   roles, unread badges     │
├─────────────────────┴──────────────────────────┤
│   Recent Activity Feed (col-span-2)             │
│   Last 8 events: timestamp, icon, author, group │
└─────────────────────────────────────────────────┘
```

### What it does well
- Map thumbnail with viewport sync (uses `$mapViewport`)
- Channel status shows encryption mode, member count, message type distribution, role counts
- Activity feed shows cross-group recent events

### What fails
1. **Fixed layout.** OVERWATCH wants a bigger map and smaller channel list. ARCHITECT wants no map at all and larger role distributions. Both get the same 2-column grid.
2. **No presence.** Channel cards show member counts but not freshness (Phase 1's Presence-from-Publishing isn't integrated yet).
3. **No connection awareness.** No indication of Sovereign Mode state or queue depth.
4. **No security visibility.** No relay isolation status per group.
5. **No trust visibility.** No attestation indicators (Phase 4).
6. **Mobile layout.** On mobile, the grid collapses to `flex-col` — all three panels vertical. The map thumbnail is tiny and the activity feed is pushed off-screen.
7. **Not extensible.** Adding a new panel means editing the template, adjusting the grid, and hoping it fits all screen sizes.

---

## Design Philosophy: Tiles, Not Panels {#design-philosophy}

A tile is a self-contained UI component that:
- Has a fixed type (e.g., "map-overview", "group-status")
- Reads from reactive Svelte stores
- Renders at any size within a grid cell
- Requires no props beyond its type and optional configuration

Tiles are placed on a grid. The grid layout is persisted to localStorage via `synced()`. When the operator adds, removes, or rearranges tiles, the layout updates reactively and persists.

**The Board is not a component library.** It's a view that replaces OpsView. In Routes.svelte, when `$navcomMode === "ops"`, render `BoardView` instead of `OpsView`. The import change is one line. OpsView is preserved as a fallback (kept in the codebase, not imported by Routes.svelte).

---

## Tile Vocabulary

### Phase 3 Tile Types (7 tiles)

| Tile ID | Name | Data Source | Description |
|---------|------|------------|-------------|
| `map-overview` | Map Overview | `mapViewport`, `groupProjections`, Leaflet | Interactive or non-interactive map with markers. Respects `mapLayers`, `mapTileSet`, `mapTimeRange`. |
| `group-status` | Group Status | `groupSummaries`, `groupMemberPresence`, `unreadGroupMessageCounts` | List of groups with health badges (🟢🟡🔴), member counts, unread counts. Click → COMMS mode. |
| `personnel-status` | Personnel Status | `groupMemberPresence`, `groupProjections` | For a selected group: per-member presence badges, role, last seen timestamp. Click member → WoT popover. |
| `activity-feed` | Activity Feed | `groupProjections.sourceEvents` | Configurable count (8/16/32) of recent cross-group events. Filters by message type. |
| `connection-status` | Connection Status | `connectionState`, `relayHealthTracker` | Sovereign/Connected indicator, queue depth, relay health metrics (healthy/demoted/paused), time in current mode. |
| `security-status` | Security Status | `evaluateRelayFingerprintGate`, `groupProjections`, `loadRoomRelayPolicy` | Per-Tier-2-group relay isolation check (✅/⚠), transport mode verification. Read-only audit view. |
| `quick-actions` | Quick Actions | `publishGroupMessage`, `activeChannel` | Signal button, Alert button (with priority), navigate-to-channel buttons. Compact action surface. |

### Future Tiles (Phase 4+)

| Tile ID | Name | Phase | Description |
|---------|------|-------|-------------|
| `trust-overview` | Trust Overview | 4 | Attestation summary: attested/unattested members per group, recent attestations, trust decay warnings |
| `relay-health` | Relay Health | 4 | Per-relay connection metrics from `relayHealthTracker.getAllMetrics()` |
| `pqc-status` | PQC Status | 4 | Post-quantum crypto readiness: keygen status, envelope sizes, compatibility mode |

---

## Layout System

### Grid Model

The Board uses CSS Grid with configurable rows and columns. Each tile occupies one or more grid cells.

```typescript
export type TileId = string  // UUID

export type TilePlacement = {
  id: TileId
  type: TileType            // "map-overview" | "group-status" | etc.
  col: number               // 1-based column start
  row: number               // 1-based row start
  colSpan: number           // Number of columns this tile spans
  rowSpan: number           // Number of rows this tile spans
  config?: Record<string, unknown>  // Tile-specific configuration
}

export type BoardLayout = {
  columns: number           // Total grid columns (e.g., 4 for desktop, 2 for tablet, 1 for mobile)
  rowHeight: number         // Row height in pixels (e.g., 200)
  tiles: TilePlacement[]
}

export type TileType =
  | "map-overview"
  | "group-status"
  | "personnel-status"
  | "activity-feed"
  | "connection-status"
  | "security-status"
  | "quick-actions"
```

### Persistence

The layout is stored via the `synced()` pattern:

```typescript
export const boardLayout = synced<BoardLayout>({
  key: "ui/board-layout",
  defaultValue: DEFAULT_LAYOUT,
  storage: localStorageProvider,
})
```

This adds one new key (`"ui/board-layout"`) to the existing 10 `synced()` store keys.

### Edit Mode

The Board has two states: **view mode** (default) and **edit mode**.

In edit mode:
- Grid lines visible
- Tiles show drag handles
- Tile Picker panel slides in from the right
- Tiles can be dragged to rearrange (position swap)
- Tiles can be resized via corner handle
- Tiles can be removed (X button)
- New tiles dragged from Tile Picker onto the grid

In view mode:
- Grid lines hidden
- No drag handles
- Tiles render their content normally
- Edit button (gear icon) in top-right corner

**Edit mode state** is component-local, not persisted. Entering edit mode is rare — most operators set their layout once and leave it.

### Drag and Drop

Phase 3 uses a simple slot-based system:
- The grid is divided into cells
- Dragging a tile swaps it with the tile at the drop position
- Resizing snaps to grid cells

No external drag library is required. The existing codebase has no DnD dependencies. Implementation uses native HTML drag events (`dragstart`, `dragover`, `drop`) with Svelte actions.

---

## Archetype Default Layouts

When a new operator first visits OPS mode, the Board uses the default layout. The default is designed for OVERWATCH (the most common archetype) but works for all three:

### Default Layout (Desktop, 4 columns)

```
┌───────────────────────────────┬────────────────┐
│         Map Overview          │  Group Status   │
│         (col: 1-3)            │  (col: 4)       │
│         (row: 1-2)            │  (row: 1-2)     │
├──────────────┬────────────────┼────────────────┤
│ Activity Feed│ Personnel      │  Connection     │
│ (col: 1-2)   │ Status (col:3) │  Status (col:4) │
│ (row: 3)     │ (row: 3)       │  (row: 3)       │
└──────────────┴────────────────┴────────────────┘
```

- Map is dominant (3×2 cells) — OVERWATCH's primary need
- Group status is always visible (1×2 cells)
- Activity feed and personnel status split the bottom row
- Connection status is a small tile in the corner

### Mobile Layout (1 column)

On mobile (`<1024px`), the Board switches to a single-column layout. Tiles stack vertically in priority order:

1. Group Status (most actionable)
2. Activity Feed
3. Connection Status
4. Quick Actions
5. Map Overview (optional, disabled by default on mobile — tiles can be toggled)
6. Personnel Status
7. Security Status

The mobile layout is a separate stored layout, or the Board auto-arranges to single-column based on viewport width.

### Layout Presets (Optional Enhancement)

Phase 3 can include preset layouts that operators select from:

| Preset | Description | Suited for |
|--------|-------------|-----------|
| OVERWATCH | Large map, channel list, activity | Field Intel Analyst |
| SWITCHBLADE | Quick actions, group status, activity | Mobile Field Operative |
| ARCHITECT | Group status, security status, personnel, connection | Cell Commander |

Presets are not critical path — the default layout + edit mode suffices for Phase 3.

---

## New Files

### `src/app/views/BoardView.svelte` — The Board Component

```svelte
<script lang="ts">
  import {boardLayout, type TilePlacement, type TileType} from "src/app/board/board-state"

  import MapOverviewTile from "src/app/board/tiles/MapOverviewTile.svelte"
  import GroupStatusTile from "src/app/board/tiles/GroupStatusTile.svelte"
  import PersonnelStatusTile from "src/app/board/tiles/PersonnelStatusTile.svelte"
  import ActivityFeedTile from "src/app/board/tiles/ActivityFeedTile.svelte"
  import ConnectionStatusTile from "src/app/board/tiles/ConnectionStatusTile.svelte"
  import SecurityStatusTile from "src/app/board/tiles/SecurityStatusTile.svelte"
  import QuickActionsTile from "src/app/board/tiles/QuickActionsTile.svelte"
  import TilePicker from "src/app/board/TilePicker.svelte"

  let editMode = false

  $: layout = $boardLayout
  $: gridStyle = `
    display: grid;
    grid-template-columns: repeat(${layout.columns}, 1fr);
    grid-auto-rows: ${layout.rowHeight}px;
    gap: 0.75rem;
  `

  const TILE_COMPONENTS: Record<TileType, any> = {
    "map-overview": MapOverviewTile,
    "group-status": GroupStatusTile,
    "personnel-status": PersonnelStatusTile,
    "activity-feed": ActivityFeedTile,
    "connection-status": ConnectionStatusTile,
    "security-status": SecurityStatusTile,
    "quick-actions": QuickActionsTile,
  }

  function removeTile(tileId: string) {
    boardLayout.update(l => ({
      ...l,
      tiles: l.tiles.filter(t => t.id !== tileId),
    }))
  }

  function addTile(type: TileType) {
    const id = crypto.randomUUID()
    const nextRow = Math.max(0, ...layout.tiles.map(t => t.row + t.rowSpan)) + 1
    boardLayout.update(l => ({
      ...l,
      tiles: [...l.tiles, {id, type, col: 1, row: nextRow, colSpan: 2, rowSpan: 1}],
    }))
  }
</script>

<div class="relative">
  <!-- Edit mode toggle -->
  <button
    on:click={() => editMode = !editMode}
    class="absolute right-2 top-2 z-10 rounded-md bg-nc-surface-2 p-1.5 text-xs"
    title={editMode ? "Done editing" : "Edit layout"}
  >
    {editMode ? "✓ Done" : "⚙ Edit"}
  </button>

  <!-- Board grid -->
  <div style={gridStyle} class="p-2">
    {#each layout.tiles as tile (tile.id)}
      {@const Component = TILE_COMPONENTS[tile.type]}
      <div
        style="grid-column: {tile.col} / span {tile.colSpan}; grid-row: {tile.row} / span {tile.rowSpan};"
        class="relative overflow-hidden rounded-lg border border-nc-border bg-nc-surface-1"
        class:ring-2={editMode}
        class:ring-accent={editMode}
      >
        {#if editMode}
          <button
            on:click={() => removeTile(tile.id)}
            class="absolute right-1 top-1 z-20 rounded bg-danger/80 px-1.5 text-xs text-white"
          >✕</button>
        {/if}
        {#if Component}
          <svelte:component this={Component} config={tile.config} />
        {/if}
      </div>
    {/each}
  </div>

  <!-- Tile Picker (edit mode only) -->
  {#if editMode}
    <TilePicker on:add={(e) => addTile(e.detail)} />
  {/if}
</div>
```

### `src/app/board/board-state.ts` — Layout Store and Types

```typescript
import {synced} from "@welshman/store"
import {localStorageProvider} from "src/util/storage"

export type TileType =
  | "map-overview"
  | "group-status"
  | "personnel-status"
  | "activity-feed"
  | "connection-status"
  | "security-status"
  | "quick-actions"

export type TilePlacement = {
  id: string
  type: TileType
  col: number
  row: number
  colSpan: number
  rowSpan: number
  config?: Record<string, unknown>
}

export type BoardLayout = {
  columns: number
  rowHeight: number
  tiles: TilePlacement[]
}

const DEFAULT_DESKTOP_LAYOUT: BoardLayout = {
  columns: 4,
  rowHeight: 200,
  tiles: [
    {id: "default-map", type: "map-overview", col: 1, row: 1, colSpan: 3, rowSpan: 2},
    {id: "default-groups", type: "group-status", col: 4, row: 1, colSpan: 1, rowSpan: 2},
    {id: "default-activity", type: "activity-feed", col: 1, row: 3, colSpan: 2, rowSpan: 1},
    {id: "default-personnel", type: "personnel-status", col: 3, row: 3, colSpan: 1, rowSpan: 1},
    {id: "default-connection", type: "connection-status", col: 4, row: 3, colSpan: 1, rowSpan: 1},
  ],
}

export const boardLayout = synced<BoardLayout>({
  key: "ui/board-layout",
  defaultValue: DEFAULT_DESKTOP_LAYOUT,
  storage: localStorageProvider,
})

export const TILE_REGISTRY: Record<TileType, {name: string; icon: string; description: string}> = {
  "map-overview": {
    name: "Map Overview",
    icon: "🗺",
    description: "Interactive map with markers from all groups",
  },
  "group-status": {
    name: "Group Status",
    icon: "📡",
    description: "Health badges, member counts, and unread counts per group",
  },
  "personnel-status": {
    name: "Personnel Status",
    icon: "👥",
    description: "Per-member presence and role in selected group",
  },
  "activity-feed": {
    name: "Activity Feed",
    icon: "📋",
    description: "Recent events across all groups",
  },
  "connection-status": {
    name: "Connection Status",
    icon: "◆",
    description: "Sovereign/Connected mode, queue depth, relay health",
  },
  "security-status": {
    name: "Security Status",
    icon: "🔒",
    description: "Relay isolation and transport mode verification per Tier 2 group",
  },
  "quick-actions": {
    name: "Quick Actions",
    icon: "⚡",
    description: "Signal, Alert, and channel navigation buttons",
  },
}
```

### `src/app/board/TilePicker.svelte` — Add Tile Panel

```svelte
<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import {TILE_REGISTRY, type TileType} from "src/app/board/board-state"

  const dispatch = createEventDispatcher<{add: TileType}>()

  const tileTypes = Object.entries(TILE_REGISTRY) as [TileType, typeof TILE_REGISTRY[TileType]][]
</script>

<div class="mt-4 rounded-lg border border-nc-border bg-nc-surface-2 p-3">
  <h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-nc-text-muted">Add Tile</h3>
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
    {#each tileTypes as [type, info]}
      <button
        on:click={() => dispatch("add", type)}
        class="flex flex-col items-center gap-1 rounded-md border border-nc-border
               bg-nc-surface-1 p-2 text-xs hover:border-accent"
      >
        <span class="text-lg">{info.icon}</span>
        <span class="font-medium">{info.name}</span>
      </button>
    {/each}
  </div>
</div>
```

### Tile Components (7 files in `src/app/board/tiles/`)

Each tile is a self-contained Svelte component. Example structures:

#### `src/app/board/tiles/GroupStatusTile.svelte`

```svelte
<script lang="ts">
  import {groupSummaries, unreadGroupMessageCounts} from "src/app/groups/state"
  import GroupHealthBadge from "src/partials/GroupHealthBadge.svelte"
  import {setActiveChannel, setMode} from "src/app/navcom-mode"
  import {router} from "src/app/util/router"

  function openChannel(id: string) {
    setActiveChannel(id)
    setMode("comms")
    router.at(`groups/${id}`).open()
  }
</script>

<div class="flex h-full flex-col overflow-hidden">
  <h4 class="px-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">
    Groups
  </h4>
  <div class="flex-1 overflow-y-auto px-2 pb-2">
    {#each $groupSummaries as ch (ch.id)}
      <button
        on:click={() => openChannel(ch.id)}
        class="flex w-full items-center gap-2 rounded p-1.5 text-left text-xs hover:bg-nc-surface-2"
      >
        <GroupHealthBadge groupId={ch.id} />
        <span class="flex-1 truncate font-medium">{ch.title}</span>
        {@const unread = $unreadGroupMessageCounts.get(ch.id) || 0}
        {#if unread > 0}
          <span class="rounded-full bg-accent px-1.5 text-[10px] text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        {/if}
      </button>
    {/each}
  </div>
</div>
```

#### `src/app/board/tiles/ConnectionStatusTile.svelte`

```svelte
<script lang="ts">
  import {connectionState} from "src/engine/connection-state"
  import {relayHealthTracker} from "src/engine/relay/relay-health"

  $: mode = $connectionState.mode
  $: queuedCount = $connectionState.queuedCount
  $: metrics = relayHealthTracker.getAllMetrics()
  $: healthyCount = metrics.filter(m => !m.demoted).length
  $: demotedCount = metrics.filter(m => m.demoted).length
</script>

<div class="flex h-full flex-col p-2 text-xs">
  <h4 class="text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">Connection</h4>
  <div class="mt-2 flex items-center gap-2">
    <span class={mode === "sovereign" ? "text-warning" : "text-success"}>
      {mode === "sovereign" ? "◆" : "●"}
    </span>
    <span class="font-bold uppercase">{mode}</span>
  </div>
  {#if queuedCount > 0}
    <p class="mt-1 text-nc-text-muted">{queuedCount} events queued</p>
  {/if}
  <div class="mt-auto text-nc-text-muted">
    <p>{healthyCount} relays healthy</p>
    {#if demotedCount > 0}
      <p class="text-danger">{demotedCount} relays demoted</p>
    {/if}
  </div>
</div>
```

#### `src/app/board/tiles/ActivityFeedTile.svelte`

Extracts the activity feed logic from the current OpsView:

```svelte
<script lang="ts">
  import {groupProjections} from "src/app/groups/state"
  import {classifyGroupEventKind} from "src/domain/group-kinds"
  import {displayProfileByPubkey} from "@welshman/app"

  export let config: {maxItems?: number} | undefined = undefined

  const maxItems = config?.maxItems ?? 8

  const MSG_TYPE_ICONS: Record<string, string> = {
    alert: "🚨",
    sitrep: "📋",
    "check-in": "📍",
    spotrep: "🔭",
    message: "💬",
  }

  $: recentActivity = (() => {
    const items: Array<{id: string; groupTitle: string; msgType: string; author: string; timestamp: number}> = []
    for (const [, proj] of $groupProjections.entries()) {
      for (const event of proj.sourceEvents) {
        if (classifyGroupEventKind(event.kind) !== "message") continue
        if (!event.content) continue
        const msgType = event.tags?.find(t => t[0] === "msg-type")?.[1] || "message"
        items.push({
          id: event.id,
          groupTitle: proj.group.title || "Unknown",
          msgType,
          author: event.pubkey,
          timestamp: event.created_at,
        })
      }
    }
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, maxItems)
  })()

  function relativeTime(ts: number): string {
    const diff = Math.floor(Date.now() / 1000) - ts
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }
</script>

<div class="flex h-full flex-col overflow-hidden">
  <h4 class="px-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">
    Activity
  </h4>
  <div class="flex-1 overflow-y-auto px-2 pb-2">
    {#each recentActivity as item (item.id)}
      <div class="flex items-center gap-2 border-b border-nc-border/30 py-1 text-xs">
        <span class="text-nc-text-muted">{relativeTime(item.timestamp)}</span>
        <span>{MSG_TYPE_ICONS[item.msgType] || "💬"}</span>
        <span class="truncate">{$displayProfileByPubkey(item.author)?.name || item.author.slice(0, 8)}</span>
        <span class="ml-auto text-nc-text-muted">{item.groupTitle}</span>
      </div>
    {/each}
  </div>
</div>
```

The remaining tiles (`MapOverviewTile`, `PersonnelStatusTile`, `SecurityStatusTile`, `QuickActionsTile`) follow the same pattern: self-contained, reading from reactive stores, rendering within their grid cell.

---

## Modified Files

### `src/app/Routes.svelte` — Replace OpsView with BoardView

The change is minimal:

```svelte
<!-- Before -->
<script>
  import OpsView from "src/app/views/OpsView.svelte"
</script>

{:else if $navcomMode === "ops"}
  <div class="m-auto w-full max-w-4xl">
    <div class="flex max-w-4xl flex-grow flex-col gap-4 p-4">
      <OpsView />
    </div>
  </div>

<!-- After -->
<script>
  import BoardView from "src/app/views/BoardView.svelte"
</script>

{:else if $navcomMode === "ops"}
  <div class="m-auto w-full max-w-6xl">
    <div class="flex max-w-6xl flex-grow flex-col gap-4 p-2">
      <BoardView />
    </div>
  </div>
```

**Changes:** Import swapped. `max-w-4xl` → `max-w-6xl` (4-column tile grid needs wider container). Padding reduced from `p-4` to `p-2` (tiles have internal padding).

### `src/app/navcom-mode.ts` — No Changes Required

The mode system (`navcomMode`, `setMode`, `activeChannel`, etc.) is untouched. "OPS" mode continues to mean the same thing — it just renders `BoardView` instead of `OpsView`.

---

## Tile Architecture

### Component Contract

Every tile component follows this contract:

```typescript
// Props
export let config: Record<string, unknown> | undefined = undefined

// Behavior
// - Self-contained: imports its own stores
// - Responsive: fills its grid cell (use h-full, overflow-hidden)
// - Themed: uses nc-surface, nc-text, nc-border tokens
// - Accessible: keyboard navigable, aria labels
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Svelte Stores (reactive)                                        │
│  ├─ groupProjections          → GroupStatusTile, ActivityFeedTile │
│  ├─ groupMemberPresence       → PersonnelStatusTile, GroupStatus  │
│  ├─ connectionState           → ConnectionStatusTile              │
│  ├─ relayHealthTracker        → ConnectionStatusTile              │
│  ├─ groupSummaries            → GroupStatusTile                   │
│  ├─ unreadGroupMessageCounts  → GroupStatusTile                   │
│  └─ evaluateRelayFingerprint  → SecurityStatusTile (called)       │
│                                                                   │
│  BoardView                                                        │
│  ├─ boardLayout (synced store) → grid-template-columns/rows       │
│  └─ for each TilePlacement:                                       │
│      └─ <svelte:component this={TILE_COMPONENTS[tile.type]} />   │
│          (each tile subscribes independently to its stores)       │
└─────────────────────────────────────────────────────────────────┘
```

Tiles don't communicate with each other. They read from shared stores. If a tile needs to trigger an action (e.g., "open channel X in COMMS mode"), it calls the shared functions (`setMode`, `setActiveChannel`, `router.at().open()`).

---

## Data Sources per Tile

| Tile | Store/Function | What it reads |
|------|---------------|---------------|
| `map-overview` | `mapViewport`, `mapTileSet`, `mapLayers`, `mapTimeRange`, `groupProjections` | Map center/zoom, tile set, layer toggles, time filter, source events for markers |
| `group-status` | `groupSummaries`, `unreadGroupMessageCounts`, `groupMemberPresence` | Summary list, unread counts, health badges |
| `personnel-status` | `groupMemberPresence`, `groupProjections`, `activeChannel` | Member presences for selected group, member roles |
| `activity-feed` | `groupProjections` | sourceEvents across all groups, classified by kind |
| `connection-status` | `connectionState`, `relayHealthTracker.getAllMetrics()` | Mode, queue depth, relay metrics |
| `security-status` | `evaluateRelayFingerprintGate()`, `groupProjections`, `loadRoomRelayPolicy()` | Per-Tier-2-group isolation check |
| `quick-actions` | `activeChannel`, `publishGroupMessage`, `signer` | Selected channel, publish function, signing capability |

---

## Responsive Behavior

### Breakpoints

| Viewport | Columns | Row Height | Behavior |
|----------|---------|------------|----------|
| ≥1280px (xl) | 4 | 200px | Full grid layout |
| ≥1024px (lg) | 3 | 180px | Reduce to 3 columns; tiles > col 3 wrap |
| ≥768px (md) | 2 | 160px | 2-column layout |
| <768px (sm) | 1 | 140px | Single column; tiles stack vertically |

### Auto-Column Adjustment

When viewport width changes (tracked via Svelte `bind:innerWidth`), the Board auto-adjusts:

```typescript
$: columns = innerWidth >= 1280 ? 4 : innerWidth >= 1024 ? 3 : innerWidth >= 768 ? 2 : 1
```

Tiles that span more columns than available are clamped: `min(tile.colSpan, columns)`. A 3-column map tile on a 2-column viewport becomes 2 columns wide.

---

## Sovereign Mode Rendering

When the app is in Sovereign Mode (Phase 2), tiles behave as follows:

| Tile | Sovereign behavior |
|------|-------------------|
| `map-overview` | Shows cached tiles + existing markers. No new tiles load. GPS still works. |
| `group-status` | Shows last-known health badges. Stale but accurate at last sync. |
| `personnel-status` | Shows last-known presence. Members may show stale/cold incorrectly (no new events to update). |
| `activity-feed` | Shows last-known events. No new events arrive during sovereign mode. |
| `connection-status` | Shows "SOVEREIGN — N queued" with live queue count (updates as operator composes). |
| `security-status` | Unchanged — reads localStorage relay policies, not relay connections. |
| `quick-actions` | Signal/Alert buttons work — events queue to outbox via `signAndPublish`. |

The connection-status tile is the most valuable tile during Sovereign Mode — it's the operator's primary feedback channel for queue depth and connectivity status.

---

## What Does NOT Change

1. **`navcomMode` store is unchanged.** "ops" mode still exists; it just renders BoardView instead of OpsView.
2. **OpsView.svelte is preserved.** Not deleted — remains in the codebase as a reference/fallback. Simply no longer imported by Routes.svelte.
3. **COMMS and MAP modes are unchanged.** The Board replaces only the OPS rendering path.
4. **`groupProjections` is unchanged.** All tiles read from the same store.
5. **No new Nostr event kinds.** The Board is purely client-side.
6. **No new relay subscriptions.** Tiles read from stores already populated by existing subscriptions.
7. **`synced()` pattern is unchanged.** One new key (`"ui/board-layout"`) added to the existing 10.
8. **Publishing pipeline is unchanged.** Quick Actions tile calls existing `publishGroupMessage()`.
9. **Map integration is unchanged.** MapOverviewTile reuses the same Leaflet initialization pattern as the current OpsView thumbnail and MapView.
10. **Marker derivation is unchanged.** `deriveMarkers()`, `MARKER_STYLES`, `filterMarkers()` are reused by the MapOverview tile.

---

## Phase Dependencies

### What Phase 1 and 2 provide to The Board

- **02-Presence-from-Publishing:** `groupMemberPresence` store → consumed by GroupStatusTile (health badges) and PersonnelStatusTile (per-member presence). Without Phase 1, these tiles show member counts without freshness.
- **03-Relay-Fingerprint-Gate:** `evaluateRelayFingerprintGate()` → consumed by SecurityStatusTile as a read-only audit. Without Phase 1, the Security Status tile cannot show relay isolation status.
- **04-Sovereign-Mode:** `connectionState` store → consumed by ConnectionStatusTile. Without Phase 2, the Connection Status tile has no data source.

### What The Board provides to Phase 4

- **Trust Attestation tile:** Phase 4 adds a `trust-overview` tile type to the tile vocabulary and TILE_REGISTRY. The Board's extensible tile architecture means adding a new tile type is: one new component + one registry entry + users can add it via Tile Picker. Zero changes to BoardView itself.

### Graceful degradation

If Phase 1 or 2 innovations haven't shipped yet, the Board still works:
- GroupStatusTile shows member counts without health badges
- PersonnelStatusTile shows member lists without presence
- ConnectionStatusTile shows a basic online/offline indicator
- SecurityStatusTile shows "N/A — relay fingerprint gate not available"

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Layout persistence corrupted → blank Board | Low | Medium | `synced()` pattern uses JSON parse with fallback to default layout; same pattern as all 10 existing synced stores |
| Too many tiles → performance degradation | Low | Medium | Each tile subscribes to specific stores; Svelte's reactive system only re-renders on actual data changes. MapOverviewTile's Leaflet instance is the heaviest — limit to one instance. |
| Drag and drop UX on mobile is poor | Medium | Low | Mobile layout is single-column; drag is less useful. Phase 3 mobile focuses on tile visibility toggle (show/hide) rather than spatial arrangement. |
| `max-w-6xl` on Routes.svelte is too wide for some screens | Low | Low | Large tiles internally handle overflow. Grid auto-adjusts columns by breakpoint. |
| OpsView removal breaks existing Cypress tests | Medium | Medium | Update Cypress selectors. OpsView tests migrate to Board tests. |
| Leaflet in MapOverviewTile conflicts with MapView's Leaflet | Low | Medium | Both use separate `L.map()` instances on separate DOM containers. Proven pattern — current OpsView already has a separate Leaflet thumbnail alongside MapView. |
| Tile Picker adds tiles at arbitrary positions → overlapping grid cells | Medium | Low | `addTile()` places new tiles at the next available row. Overlap is resolved by CSS Grid's auto-placement algorithm. |

---

## Testing Plan

### Unit Tests (Vitest) — `tests/unit/app/board/board-state.spec.ts`

```typescript
describe("board-state", () => {
  it("DEFAULT_DESKTOP_LAYOUT has 5 tiles covering the expected grid area")
  it("TILE_REGISTRY contains entries for all 7 tile types")
  it("boardLayout synced store initializes with default layout")
})
```

### Cypress E2E — `board-view.cy.ts`

```typescript
describe("The Board", () => {
  it("renders when OPS mode is selected", () => {
    // Navigate to OPS mode
    // Assert Board grid is visible
    // Assert at least one tile renders
  })

  it("shows default tiles on first visit", () => {
    // Clear board-layout from localStorage
    // Navigate to OPS mode
    // Assert Map Overview tile visible
    // Assert Group Status tile visible
    // Assert Activity Feed tile visible
    // Assert Connection Status tile visible
  })

  it("edit mode shows tile controls", () => {
    // Click edit button
    // Assert Tile Picker panel visible
    // Assert remove buttons visible on tiles
    // Click Done
    // Assert controls hidden
  })

  it("adding a tile persists to layout", () => {
    // Enter edit mode
    // Add "quick-actions" tile
    // Exit edit mode
    // Reload page
    // Assert Quick Actions tile still present
  })

  it("removing a tile persists to layout", () => {
    // Enter edit mode
    // Remove a tile
    // Exit edit mode
    // Reload page
    // Assert removed tile is gone
  })

  it("Group Status tile shows health badges from presence store", () => {
    // Navigate to OPS mode
    // Assert each group card has a health badge emoji (🟢🟡🔴)
  })

  it("Activity Feed tile shows recent events", () => {
    // Navigate to OPS mode
    // Assert activity items visible with timestamp, icon, and group name
  })

  it("Connection Status tile shows current mode", () => {
    // Navigate to OPS mode
    // Assert "CONNECTED" or "SOVEREIGN" visible in connection tile
  })

  it("clicking a group in Group Status tile navigates to COMMS mode", () => {
    // Navigate to OPS mode
    // Click a group in Group Status tile
    // Assert mode switched to COMMS
    // Assert channel opened
  })
})
```

---

## Acceptance Criteria

1. ✅ `BoardView.svelte` renders a CSS Grid dashboard with configurable tiles
2. ✅ `boardLayout` synced store persists tile arrangement to `localStorage["ui/board-layout"]`
3. ✅ Default layout includes 5 tiles: Map Overview, Group Status, Activity Feed, Personnel Status, Connection Status
4. ✅ Routes.svelte renders `BoardView` instead of `OpsView` when `$navcomMode === "ops"`
5. ✅ OpsView.svelte preserved in codebase (not deleted)
6. ✅ Edit mode allows adding tiles from TilePicker
7. ✅ Edit mode allows removing tiles via ✕ button
8. ✅ 7 tile types implemented: map-overview, group-status, personnel-status, activity-feed, connection-status, security-status, quick-actions
9. ✅ Each tile is self-contained with own store subscriptions
10. ✅ Responsive: 4 columns (xl) → 3 (lg) → 2 (md) → 1 (sm)
11. ✅ Tiles render correctly during Sovereign Mode
12. ✅ `TILE_REGISTRY` contains metadata for all 7 tile types
13. ✅ GroupStatusTile renders `GroupHealthBadge` per group (from Phase 1)
14. ✅ ConnectionStatusTile reads `connectionState` (from Phase 2)
15. ✅ SecurityStatusTile runs `evaluateRelayFingerprintGate` as read-only audit (from Phase 1)
16. ✅ No new Nostr event kinds
17. ✅ No new relay subscriptions
18. ✅ Existing beta test suite passes (with selector updates)
19. ✅ New `board-view.cy.ts` Cypress spec passes
