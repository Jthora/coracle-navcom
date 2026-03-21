/**
 * Tests for layer controls — mapLayers, mapTileSet, mapTimeRange stores
 * and marker filtering logic in MapView.
 */
import {describe, it, expect} from "vitest"
import type {MapLayerConfig, TimeRange} from "src/app/navcom-mode"

// Test the filtering logic as a pure function (extracted from MapView.svelte)
function filterMarkers(
  all: {type: string; timestamp: number}[],
  layers: MapLayerConfig,
  range: TimeRange,
): {type: string; timestamp: number}[] {
  const now = Math.floor(Date.now() / 1000)
  const cutoff =
    range === "1h" ? now - 3600 : range === "24h" ? now - 86400 : range === "7d" ? now - 604800 : 0

  return all.filter(m => {
    if (m.type === "check-in" && !layers.checkIns) return false
    if (m.type === "alert" && !layers.alerts) return false
    if (m.type === "spotrep" && !layers.spotreps) return false
    if (cutoff > 0 && m.timestamp < cutoff) return false
    return true
  })
}

describe("Layer Controls", () => {
  const now = Math.floor(Date.now() / 1000)
  const allLayers: MapLayerConfig = {
    checkIns: true,
    alerts: true,
    spotreps: true,
    memberPositions: false,
  }

  const markers = [
    {type: "check-in", timestamp: now - 1800}, // 30min ago
    {type: "alert", timestamp: now - 7200}, // 2h ago
    {type: "spotrep", timestamp: now - 172800}, // 2 days ago
    {type: "message", timestamp: now - 600}, // 10min ago
  ]

  describe("layer filtering", () => {
    it("shows all markers when all layers on and time=all", () => {
      const result = filterMarkers(markers, allLayers, "all")
      expect(result).toHaveLength(4)
    })

    it("hides check-ins when checkIns layer is off", () => {
      const layers = {...allLayers, checkIns: false}
      const result = filterMarkers(markers, layers, "all")
      expect(result).toHaveLength(3)
      expect(result.some(m => m.type === "check-in")).toBe(false)
    })

    it("hides alerts when alerts layer is off", () => {
      const layers = {...allLayers, alerts: false}
      const result = filterMarkers(markers, layers, "all")
      expect(result).toHaveLength(3)
      expect(result.some(m => m.type === "alert")).toBe(false)
    })

    it("hides spotreps when spotreps layer is off", () => {
      const layers = {...allLayers, spotreps: false}
      const result = filterMarkers(markers, layers, "all")
      expect(result).toHaveLength(3)
      expect(result.some(m => m.type === "spotrep")).toBe(false)
    })

    it("does not filter generic messages by layer", () => {
      const layers = {checkIns: false, alerts: false, spotreps: false, memberPositions: false}
      const result = filterMarkers(markers, layers, "all")
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe("message")
    })
  })

  describe("time range filtering", () => {
    it("1h range shows only markers from last hour", () => {
      const result = filterMarkers(markers, allLayers, "1h")
      expect(result).toHaveLength(2) // 30min check-in + 10min message
    })

    it("24h range shows markers from last day", () => {
      const result = filterMarkers(markers, allLayers, "24h")
      expect(result).toHaveLength(3) // 30min, 2h, 10min (not 2 days)
    })

    it("7d range shows markers from last week", () => {
      const result = filterMarkers(markers, allLayers, "7d")
      expect(result).toHaveLength(4) // all within 7 days
    })

    it("all range shows everything", () => {
      const result = filterMarkers(markers, allLayers, "all")
      expect(result).toHaveLength(4)
    })
  })

  describe("combined filters", () => {
    it("hides both by layer AND time", () => {
      const layers = {...allLayers, alerts: false}
      const result = filterMarkers(markers, layers, "1h")
      // 1h: check-in(30m) + message(10m) — alert is both filtered by layer and time
      expect(result).toHaveLength(2)
      expect(result.every(m => m.type !== "alert")).toBe(true)
    })
  })

  describe("store defaults", () => {
    it("mapLayers defaults have correct shape", () => {
      const defaults: MapLayerConfig = {
        checkIns: true,
        alerts: true,
        spotreps: true,
        memberPositions: false,
      }
      expect(defaults.checkIns).toBe(true)
      expect(defaults.alerts).toBe(true)
      expect(defaults.spotreps).toBe(true)
      expect(defaults.memberPositions).toBe(false)
    })

    it("mapTileSet defaults to street", () => {
      const defaultTileSet = "street"
      expect(defaultTileSet).toBe("street")
    })

    it("mapTimeRange defaults to 24h", () => {
      const defaultRange: TimeRange = "24h"
      expect(defaultRange).toBe("24h")
    })
  })
})
