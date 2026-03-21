/**
 * Marker clustering utilities — groups nearby markers at low zoom levels,
 * assigns cluster styling based on contained marker types, and provides
 * temporal filtering helpers.
 *
 * Designed to work with Leaflet.markercluster when real map integration happens.
 * For now, provides pure data-level clustering via grid-based spatial grouping.
 */

import type {ChannelMarker} from "src/app/views/marker-derivation"
import type {TimeRange} from "src/app/navcom-mode"

export interface MarkerCluster {
  /** Representative lat/lng (centroid of contained markers) */
  lat: number
  lng: number
  /** Markers contained in this cluster */
  markers: ChannelMarker[]
  /** Count of contained markers */
  count: number
  /** Dominant style: red if any alert, green if all check-ins, cyan otherwise */
  style: "alert" | "checkin" | "mixed"
}

/**
 * Grid-based spatial clustering at a given precision level.
 * Precision maps roughly to zoom: lower = more clustering.
 *
 * @param markers All markers to cluster
 * @param precision Grid cell size in degrees (e.g., 1 = ~111km, 0.01 = ~1km)
 */
export function clusterMarkers(markers: ChannelMarker[], precision: number): MarkerCluster[] {
  if (precision <= 0) precision = 1
  const grid = new Map<string, ChannelMarker[]>()

  for (const m of markers) {
    const cellLat = Math.floor(m.lat / precision) * precision
    const cellLng = Math.floor(m.lng / precision) * precision
    const key = `${cellLat},${cellLng}`
    const list = grid.get(key)
    if (list) {
      list.push(m)
    } else {
      grid.set(key, [m])
    }
  }

  const clusters: MarkerCluster[] = []
  for (const group of grid.values()) {
    const lat = group.reduce((s, m) => s + m.lat, 0) / group.length
    const lng = group.reduce((s, m) => s + m.lng, 0) / group.length
    const hasAlert = group.some(m => m.type === "alert")
    const allCheckIns = group.every(m => m.type === "check-in")

    clusters.push({
      lat,
      lng,
      markers: group,
      count: group.length,
      style: hasAlert ? "alert" : allCheckIns ? "checkin" : "mixed",
    })
  }

  return clusters
}

/**
 * Map zoom level to clustering grid precision (degrees).
 * Returns 0 for high zoom (no clustering).
 */
export function zoomToPrecision(zoom: number): number {
  if (zoom >= 15) return 0 // street level — individual markers
  if (zoom >= 12) return 0.01 // ~1km cells
  if (zoom >= 9) return 0.1 // ~11km cells
  if (zoom >= 6) return 1 // ~111km cells
  return 5 // country level — very large cells
}

/** Cluster styling colors */
export const CLUSTER_COLORS: Record<MarkerCluster["style"], string> = {
  alert: "#ef4444", // red
  checkin: "#22c55e", // green
  mixed: "#22d3ee", // cyan/accent
}

/**
 * Returns the timestamp cutoff for a given time range.
 * Returns 0 for "all" (no filtering).
 */
export function timeRangeCutoff(range: TimeRange): number {
  const now = Math.floor(Date.now() / 1000)
  switch (range) {
    case "1h":
      return now - 3600
    case "24h":
      return now - 86400
    case "7d":
      return now - 604800
    case "all":
      return 0
  }
}

/**
 * Filter markers by time range.
 */
export function filterByTime(markers: ChannelMarker[], range: TimeRange): ChannelMarker[] {
  const cutoff = timeRangeCutoff(range)
  if (cutoff === 0) return markers
  return markers.filter(m => m.timestamp >= cutoff)
}
