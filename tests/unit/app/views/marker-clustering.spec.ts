/**
 * Tests for marker clustering and temporal filtering utilities.
 */
import {describe, it, expect} from "vitest"
import {
  clusterMarkers,
  zoomToPrecision,
  CLUSTER_COLORS,
  timeRangeCutoff,
  filterByTime,
} from "src/app/views/marker-clustering"
import type {ChannelMarker} from "src/app/views/marker-derivation"

function makeMarker(overrides: Partial<ChannelMarker> = {}): ChannelMarker {
  return {
    id: overrides.id ?? "m1",
    lat: overrides.lat ?? 40.0,
    lng: overrides.lng ?? -74.0,
    type: overrides.type ?? "message",
    author: overrides.author ?? "pk1",
    timestamp: overrides.timestamp ?? Math.floor(Date.now() / 1000),
    preview: overrides.preview ?? "test",
  }
}

describe("Marker Clustering", () => {
  describe("clusterMarkers", () => {
    it("returns a single cluster for nearby markers", () => {
      const markers = [
        makeMarker({id: "a", lat: 40.01, lng: -74.01}),
        makeMarker({id: "b", lat: 40.02, lng: -74.02}),
        makeMarker({id: "c", lat: 40.03, lng: -74.03}),
      ]
      const clusters = clusterMarkers(markers, 1.0) // 1 degree = ~111km
      expect(clusters).toHaveLength(1)
      expect(clusters[0].count).toBe(3)
    })

    it("separates markers in different grid cells", () => {
      const markers = [
        makeMarker({id: "a", lat: 10.5, lng: 20.5}),
        makeMarker({id: "b", lat: 50.5, lng: 80.5}),
      ]
      const clusters = clusterMarkers(markers, 1.0)
      expect(clusters).toHaveLength(2)
      expect(clusters.every(c => c.count === 1)).toBe(true)
    })

    it("returns empty for empty input", () => {
      expect(clusterMarkers([], 1.0)).toHaveLength(0)
    })

    it("computes centroid of cluster", () => {
      const markers = [
        makeMarker({id: "a", lat: 40.1, lng: -73.1}),
        makeMarker({id: "b", lat: 40.3, lng: -73.3}),
      ]
      const clusters = clusterMarkers(markers, 1.0)
      expect(clusters).toHaveLength(1)
      expect(clusters[0].lat).toBeCloseTo(40.2, 1)
      expect(clusters[0].lng).toBeCloseTo(-73.2, 1)
    })

    it("marks cluster as alert if any alert present", () => {
      const markers = [
        makeMarker({id: "a", type: "check-in", lat: 10, lng: 20}),
        makeMarker({id: "b", type: "alert", lat: 10.01, lng: 20.01}),
      ]
      const clusters = clusterMarkers(markers, 1.0)
      expect(clusters[0].style).toBe("alert")
    })

    it("marks cluster as checkin if all check-ins", () => {
      const markers = [
        makeMarker({id: "a", type: "check-in", lat: 10, lng: 20}),
        makeMarker({id: "b", type: "check-in", lat: 10.01, lng: 20.01}),
      ]
      const clusters = clusterMarkers(markers, 1.0)
      expect(clusters[0].style).toBe("checkin")
    })

    it("marks mixed clusters as mixed", () => {
      const markers = [
        makeMarker({id: "a", type: "check-in", lat: 10, lng: 20}),
        makeMarker({id: "b", type: "spotrep", lat: 10.01, lng: 20.01}),
      ]
      const clusters = clusterMarkers(markers, 1.0)
      expect(clusters[0].style).toBe("mixed")
    })

    it("handles negative precision gracefully", () => {
      const markers = [makeMarker({id: "a"})]
      const clusters = clusterMarkers(markers, -5)
      // Should fallback to precision 1
      expect(clusters).toHaveLength(1)
    })
  })

  describe("zoomToPrecision", () => {
    it("returns 0 at street level (zoom >= 15)", () => {
      expect(zoomToPrecision(15)).toBe(0)
      expect(zoomToPrecision(18)).toBe(0)
    })

    it("returns 0.01 at neighborhood level (zoom 12-14)", () => {
      expect(zoomToPrecision(12)).toBe(0.01)
      expect(zoomToPrecision(14)).toBe(0.01)
    })

    it("returns 0.1 at district level (zoom 9-11)", () => {
      expect(zoomToPrecision(9)).toBe(0.1)
      expect(zoomToPrecision(11)).toBe(0.1)
    })

    it("returns 1 at regional level (zoom 6-8)", () => {
      expect(zoomToPrecision(6)).toBe(1)
      expect(zoomToPrecision(8)).toBe(1)
    })

    it("returns 5 at country level (zoom < 6)", () => {
      expect(zoomToPrecision(2)).toBe(5)
      expect(zoomToPrecision(5)).toBe(5)
    })
  })

  describe("CLUSTER_COLORS", () => {
    it("has correct color for alert", () => {
      expect(CLUSTER_COLORS.alert).toBe("#ef4444")
    })

    it("has correct color for checkin", () => {
      expect(CLUSTER_COLORS.checkin).toBe("#22c55e")
    })

    it("has correct color for mixed", () => {
      expect(CLUSTER_COLORS.mixed).toBe("#22d3ee")
    })
  })

  describe("timeRangeCutoff", () => {
    it("returns 0 for all time", () => {
      expect(timeRangeCutoff("all")).toBe(0)
    })

    it("returns a timestamp ~1h ago for 1h", () => {
      const now = Math.floor(Date.now() / 1000)
      const cutoff = timeRangeCutoff("1h")
      expect(cutoff).toBeGreaterThan(now - 3605)
      expect(cutoff).toBeLessThanOrEqual(now - 3595)
    })

    it("returns a timestamp ~24h ago for 24h", () => {
      const now = Math.floor(Date.now() / 1000)
      const cutoff = timeRangeCutoff("24h")
      expect(cutoff).toBeGreaterThan(now - 86410)
      expect(cutoff).toBeLessThanOrEqual(now - 86390)
    })

    it("returns a timestamp ~7d ago for 7d", () => {
      const now = Math.floor(Date.now() / 1000)
      const cutoff = timeRangeCutoff("7d")
      expect(cutoff).toBeGreaterThan(now - 604810)
      expect(cutoff).toBeLessThanOrEqual(now - 604790)
    })
  })

  describe("filterByTime", () => {
    const now = Math.floor(Date.now() / 1000)

    it("filters out old markers for 1h range", () => {
      const markers = [
        makeMarker({id: "recent", timestamp: now - 600}),
        makeMarker({id: "old", timestamp: now - 7200}),
      ]
      const result = filterByTime(markers, "1h")
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("recent")
    })

    it("returns all for all range", () => {
      const markers = [
        makeMarker({id: "a", timestamp: now - 600}),
        makeMarker({id: "b", timestamp: now - 999999}),
      ]
      const result = filterByTime(markers, "all")
      expect(result).toHaveLength(2)
    })
  })
})
