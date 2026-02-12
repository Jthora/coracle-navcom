import {round} from "@welshman/lib"

export const GEOJSON_DELIMITER = "---GEOJSON---"
export const GEOHASH_PRECISION = 6
export const WARN_BYTES = 5_000
export const BLOCK_BYTES = 10_000
export const DEFAULT_GEOINT_TYPE = "report"

export const defaultGeointState = (): GeointState => ({
  lat: null,
  lon: null,
  alt: null,
  subtype: null,
  confidence: null,
  timestamp: null,
  additional: null,
})

export type GeointState = {
  lat: number | null
  lon: number | null
  alt?: number | null
  subtype?: string | null
  confidence?: number | null
  timestamp?: string | null
  additional?: Record<string, unknown> | null
}

export type GeoJsonPayload = {
  type: "Feature"
  geometry: {
    type: "Point"
    coordinates: number[]
  }
  properties: {
    timestamp: string
    type: string
    description: string
    confidence: number | null
    additional?: Record<string, unknown> | null
    version: 1
  }
}

export type GeoPoint = {
  lat: number
  lon: number
}

export const ensureHashtag = (text: string, tag: string) => {
  const trimmed = (text || "").trim()
  const tokens = trimmed.split(/\s+/).filter(Boolean)

  if (tokens.includes(tag)) {
    return trimmed
  }

  return trimmed ? `${trimmed} ${tag}` : tag
}

export const buildGeoTagString = (lat: number, lon: number, alt?: number | null) => {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    throw new Error("Invalid coordinates")
  }

  const latNum = Number(lat)
  const lonNum = Number(lon)

  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    throw new Error("Invalid coordinates")
  }

  const parts = [`lat:${latNum.toFixed(6)}`, `lon:${lonNum.toFixed(6)}`]

  if (alt !== null && alt !== undefined && Number.isFinite(alt)) {
    parts.push(`alt:${Number(alt).toFixed(1)}`)
  }

  return parts.join(",")
}

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"

export const geohashFromLatLon = (lat: number, lon: number, precision = GEOHASH_PRECISION) => {
  try {
    if (
      lat === null ||
      lon === null ||
      lat === undefined ||
      lon === undefined ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      precision <= 0
    ) {
      return undefined
    }

    let idx = 0
    let bit = 0
    let evenBit = true
    let geohash = ""
    let latMin = -90
    let latMax = 90
    let lonMin = -180
    let lonMax = 180

    while (geohash.length < precision) {
      if (evenBit) {
        const mid = (lonMin + lonMax) / 2
        if (lon >= mid) {
          idx = idx * 2 + 1
          lonMin = mid
        } else {
          idx = idx * 2
          lonMax = mid
        }
      } else {
        const mid = (latMin + latMax) / 2
        if (lat >= mid) {
          idx = idx * 2 + 1
          latMin = mid
        } else {
          idx = idx * 2
          latMax = mid
        }
      }

      evenBit = !evenBit

      if (++bit === 5) {
        geohash += BASE32[idx]
        bit = 0
        idx = 0
      }
    }

    return geohash
  } catch (error) {
    if (typeof import.meta !== "undefined" && (import.meta as any)?.env?.DEV) {
      console.warn("geohashFromLatLon failed", error)
    }

    return undefined
  }
}

const normalizeConfidence = (confidence?: number | null) => {
  if (confidence === null || confidence === undefined) return null
  if (!Number.isFinite(confidence)) return null

  const value = confidence > 1 ? confidence / 100 : confidence

  return Math.max(0, Math.min(1, value))
}

const normalizeTimestamp = (timestamp?: string | null) => {
  const now = new Date()

  if (!timestamp) return now

  const parsed = new Date(timestamp)

  return Number.isNaN(parsed.getTime()) ? now : parsed
}

const buildCoordinates = (lat: number, lon: number, alt?: number | null) => {
  const coords: number[] = [round(6, lon), round(6, lat)]

  if (alt !== null && alt !== undefined && Number.isFinite(alt)) {
    coords.push(round(1, Number(alt)))
  }

  return coords
}

export const buildGeoJsonPayload = (state: GeointState, description: string): GeoJsonPayload => {
  const {lat, lon, alt = null, subtype, confidence, timestamp, additional} = state
  if (lat === null || lon === null || lat === undefined || lon === undefined) {
    throw new Error("Invalid coordinates")
  }

  const latNum = Number(lat)
  const lonNum = Number(lon)

  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    throw new Error("Invalid coordinates")
  }
  const properties: GeoJsonPayload["properties"] = {
    timestamp: normalizeTimestamp(timestamp).toISOString(),
    type: (subtype || DEFAULT_GEOINT_TYPE).trim() || DEFAULT_GEOINT_TYPE,
    description: (description || "").trim(),
    confidence: normalizeConfidence(confidence),
    version: 1,
  }

  if (additional !== null && additional !== undefined) {
    properties.additional = additional
  }

  const coordinates = buildCoordinates(latNum, lonNum, alt)

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates,
    },
    properties,
  }
}

export const safeParseJson = (value: string) => {
  if (!value || !value.trim()) return {ok: true, value: null}

  try {
    return {ok: true, value: JSON.parse(value)}
  } catch (error) {
    console.warn("Failed to parse JSON", error)

    return {ok: false, error: error instanceof Error ? error.message : String(error)}
  }
}

export const stripGeoJsonFromContent = (content: string) => {
  const text = content || ""
  const idx = text.indexOf(GEOJSON_DELIMITER)

  if (idx === -1) {
    return text
  }

  return text.slice(0, idx).trimEnd()
}

const parseGeoTag = (value?: string | null): GeoPoint | null => {
  if (!value) return null

  const parts = value.split(",").map(part => part.trim())
  const data = new Map<string, string>()

  for (const part of parts) {
    const [key, raw] = part.split(":")
    if (!key || raw === undefined) continue
    data.set(key.trim(), raw.trim())
  }

  const lat = Number(data.get("lat"))
  const lon = Number(data.get("lon"))

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null

  return {lat, lon}
}

const parseGeoJsonPayload = (content?: string | null): GeoPoint | null => {
  if (!content || !content.includes(GEOJSON_DELIMITER)) return null

  const payloadRaw = content.split(GEOJSON_DELIMITER)[1]?.trim()
  if (!payloadRaw) return null

  try {
    const parsed = JSON.parse(payloadRaw)
    const coordinates = parsed?.geometry?.coordinates

    if (!Array.isArray(coordinates) || coordinates.length < 2) return null

    const lon = Number(coordinates[0])
    const lat = Number(coordinates[1])

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null

    return {lat, lon}
  } catch {
    return null
  }
}

export const extractGeointPoint = (event: {
  tags?: string[][]
  content?: string
}): GeoPoint | null => {
  const geoTagValue = event?.tags?.find(tag => tag?.[0] === "geo")?.[1]
  const fromTag = parseGeoTag(geoTagValue)

  if (fromTag) {
    return fromTag
  }

  return parseGeoJsonPayload(event?.content)
}

export const sizeCheck = (content: string) => {
  const bytes = new Blob([content || ""]).size

  return {
    bytes,
    warn: bytes > WARN_BYTES && bytes <= BLOCK_BYTES,
    block: bytes > BLOCK_BYTES,
  }
}
