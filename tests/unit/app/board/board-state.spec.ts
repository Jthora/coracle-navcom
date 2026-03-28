import {describe, expect, it, beforeEach, vi} from "vitest"
import {get} from "svelte/store"

// Mock @welshman/store synced to return a regular writable
vi.mock("@welshman/store", () => {
  const {writable} = require("svelte/store")
  return {
    synced: ({defaultValue}: {defaultValue: any}) => writable(defaultValue),
    localStorageProvider: {},
  }
})

import {
  DEFAULT_DESKTOP_LAYOUT,
  TILE_REGISTRY,
  boardLayout,
  addTile,
  removeTile,
  moveTile,
  type TileType,
} from "src/app/board/board-state"

describe("board-state", () => {
  beforeEach(() => {
    // Reset store to default between tests
    boardLayout.set(DEFAULT_DESKTOP_LAYOUT)
  })

  it("DEFAULT_DESKTOP_LAYOUT has 5 tiles", () => {
    expect(DEFAULT_DESKTOP_LAYOUT.tiles).toHaveLength(5)
    const types = DEFAULT_DESKTOP_LAYOUT.tiles.map(t => t.type)
    expect(types).toContain("map-overview")
    expect(types).toContain("group-status")
    expect(types).toContain("activity-feed")
    expect(types).toContain("personnel-status")
    expect(types).toContain("connection-status")
  })

  it("DEFAULT_DESKTOP_LAYOUT uses 4-column grid", () => {
    expect(DEFAULT_DESKTOP_LAYOUT.columns).toBe(4)
    expect(DEFAULT_DESKTOP_LAYOUT.rowHeight).toBe(200)
  })

  it("TILE_REGISTRY contains entries for all 8 tile types", () => {
    const types: TileType[] = [
      "map-overview",
      "group-status",
      "personnel-status",
      "activity-feed",
      "connection-status",
      "security-status",
      "quick-actions",
      "trust-overview",
    ]
    expect(Object.keys(TILE_REGISTRY)).toHaveLength(8)
    for (const t of types) {
      expect(TILE_REGISTRY[t]).toBeDefined()
      expect(TILE_REGISTRY[t].name).toBeTruthy()
      expect(TILE_REGISTRY[t].icon).toBeTruthy()
      expect(TILE_REGISTRY[t].description).toBeTruthy()
    }
  })

  it("boardLayout synced store initializes with default layout", () => {
    const layout = get(boardLayout)
    expect(layout.tiles).toHaveLength(5)
    expect(layout.columns).toBe(4)
  })

  it("addTile() places at next available row and increments tile count", () => {
    const before = get(boardLayout)
    expect(before.tiles).toHaveLength(5)

    addTile("quick-actions")

    const after = get(boardLayout)
    expect(after.tiles).toHaveLength(6)
    const added = after.tiles[after.tiles.length - 1]
    expect(added.type).toBe("quick-actions")
    expect(added.colSpan).toBe(2)
    expect(added.rowSpan).toBe(1)
    // Should be placed after the last row
    const maxRow = Math.max(...before.tiles.map(t => t.row + t.rowSpan - 1))
    expect(added.row).toBe(maxRow + 1)
  })

  it("removeTile() removes correct tile by index", () => {
    const before = get(boardLayout)
    const removedType = before.tiles[1].type

    removeTile(1)

    const after = get(boardLayout)
    expect(after.tiles).toHaveLength(4)
    expect(after.tiles.find(t => t.id === before.tiles[1].id)).toBeUndefined()
  })

  it("removeTile() with invalid index is a no-op", () => {
    removeTile(-1)
    expect(get(boardLayout).tiles).toHaveLength(5)

    removeTile(999)
    expect(get(boardLayout).tiles).toHaveLength(5)
  })

  it("moveTile() reorders tiles correctly", () => {
    const before = get(boardLayout)
    const firstId = before.tiles[0].id
    const secondId = before.tiles[1].id

    moveTile(0, 1)

    const after = get(boardLayout)
    expect(after.tiles[0].id).toBe(secondId)
    expect(after.tiles[1].id).toBe(firstId)
    expect(after.tiles).toHaveLength(5)
  })

  it("moveTile() with invalid indices is a no-op", () => {
    const before = get(boardLayout)
    moveTile(-1, 2)
    expect(get(boardLayout).tiles).toEqual(before.tiles)

    moveTile(0, 0)
    expect(get(boardLayout).tiles).toEqual(before.tiles)
  })
})
