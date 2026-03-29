import {synced, localStorageProvider} from "@welshman/store"

export type TileType =
  | "map-overview"
  | "group-status"
  | "personnel-status"
  | "activity-feed"
  | "connection-status"
  | "security-status"
  | "quick-actions"
  | "trust-overview"

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
    description: "Relay isolation and transport mode verification per group",
  },
  "quick-actions": {
    name: "Quick Actions",
    icon: "⚡",
    description: "Signal, Alert, and channel navigation buttons",
  },
  "trust-overview": {
    name: "Trust Overview",
    icon: "✦",
    description: "Attestation summary: attested vs unattested members, recent attestations",
  },
}

export const DEFAULT_DESKTOP_LAYOUT: BoardLayout = {
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

export function addTile(type: TileType) {
  boardLayout.update(layout => {
    const nextRow =
      layout.tiles.length > 0 ? Math.max(...layout.tiles.map(t => t.row + t.rowSpan - 1)) + 1 : 1
    const id = `tile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return {
      ...layout,
      tiles: [...layout.tiles, {id, type, col: 1, row: nextRow, colSpan: 2, rowSpan: 1}],
    }
  })
}

export function removeTile(index: number) {
  boardLayout.update(layout => {
    if (index < 0 || index >= layout.tiles.length) return layout
    return {
      ...layout,
      tiles: layout.tiles.filter((_, i) => i !== index),
    }
  })
}

export function moveTile(fromIndex: number, toIndex: number) {
  boardLayout.update(layout => {
    if (
      fromIndex < 0 ||
      fromIndex >= layout.tiles.length ||
      toIndex < 0 ||
      toIndex >= layout.tiles.length ||
      fromIndex === toIndex
    )
      return layout
    const tiles = [...layout.tiles]
    const [moved] = tiles.splice(fromIndex, 1)
    tiles.splice(toIndex, 0, moved)
    return {...layout, tiles}
  })
}
