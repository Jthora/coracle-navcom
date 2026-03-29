/**
 * Marker derivation — extracts map markers from geo-tagged channel messages.
 *
 * Scans message arrays for `location` and `g` tags, derives structured
 * marker data for Leaflet rendering and bidirectional linking.
 */

import type {TrustedEvent} from "@welshman/util"
import type {Attestation} from "src/engine/trust/attestation"

export interface ChannelMarker {
  /** Message event ID (used as marker ID for linking) */
  id: string
  lat: number
  lng: number
  /** NavCom message type: check-in, alert, sitrep, spotrep, or message */
  type: "check-in" | "alert" | "sitrep" | "spotrep" | "message"
  /** Author pubkey */
  author: string
  /** Unix timestamp */
  timestamp: number
  /** Truncated content for popup preview */
  preview: string
  /** Whether the author has at least one active attestation */
  attested: boolean
}

/**
 * Marker styling config by message type.
 */
export const MARKER_STYLES: Record<
  ChannelMarker["type"],
  {icon: string; color: string; cssClass: string}
> = {
  "check-in": {icon: "📍", color: "#22c55e", cssClass: "marker-checkin"},
  alert: {icon: "🚨", color: "#ef4444", cssClass: "marker-alert"},
  sitrep: {icon: "📋", color: "#f59e0b", cssClass: "marker-sitrep"},
  spotrep: {icon: "📌", color: "#22d3ee", cssClass: "marker-spotrep"},
  message: {icon: "•", color: "#9ca3af", cssClass: "marker-message"},
}

/**
 * Parse a `location` tag value into [lat, lng] or null.
 * Expected format: "lat,lng" (e.g. "34.0522,-118.2437")
 */
function parseLocation(value: string): [number, number] | null {
  const parts = value.split(",")
  if (parts.length < 2) return null
  const lat = parseFloat(parts[0].trim())
  const lng = parseFloat(parts[1].trim())
  if (isNaN(lat) || isNaN(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return [lat, lng]
}

/**
 * Derive map markers from an array of channel messages.
 * Only includes messages that have valid location data.
 */
export function deriveMarkers(
  messages: TrustedEvent[],
  attestationMap?: Map<string, Attestation[]>,
): ChannelMarker[] {
  const markers: ChannelMarker[] = []

  for (const msg of messages) {
    const locationTag = msg.tags.find(t => t[0] === "location")
    if (!locationTag) continue

    const coords = parseLocation(locationTag[1])
    if (!coords) continue

    const msgType = msg.tags.find(t => t[0] === "msg-type")?.[1]
    const type: ChannelMarker["type"] =
      msgType === "check-in"
        ? "check-in"
        : msgType === "alert"
          ? "alert"
          : msgType === "sitrep"
            ? "sitrep"
            : msgType === "spotrep"
              ? "spotrep"
              : "message"

    markers.push({
      id: msg.id,
      lat: coords[0],
      lng: coords[1],
      type,
      author: msg.pubkey,
      timestamp: msg.created_at,
      preview: msg.content.slice(0, 100),
      attested: attestationMap
        ? (attestationMap.get(msg.pubkey) || []).some(a => !a.expired)
        : false,
    })
  }

  return markers
}

/**
 * Derive latest member positions from check-in markers.
 * Groups by author pubkey and keeps only the most recent check-in per member.
 */
export function deriveMemberPositions(markers: ChannelMarker[]): ChannelMarker[] {
  const latest = new Map<string, ChannelMarker>()
  for (const m of markers) {
    if (m.type !== "check-in") continue
    const existing = latest.get(m.author)
    if (!existing || m.timestamp > existing.timestamp) {
      latest.set(m.author, m)
    }
  }
  return Array.from(latest.values())
}
