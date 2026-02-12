import {
  DEFAULT_GEOINT_TYPE,
  GEOJSON_DELIMITER,
  buildGeoJsonPayload,
  buildGeoTagString,
  ensureHashtag,
  geohashFromLatLon,
  sizeCheck,
} from "src/app/util/geoint"
import type {GeointState} from "src/app/util/geoint"

export type PostType = "default" | "ops" | "geoint"

export type ShapePostResult = {
  content?: string
  tags: string[][]
  error?: string
  sizeWarning?: string
  sizeBlocked?: string
  geohashWarning?: string
}

export type ShapePostInput = {
  type: PostType
  baseText: string
  tags: string[][]
  geointState?: GeointState
}

const addTagIfMissing = (tags: string[][], next: string[]) => {
  if (!tags.some(tag => tag[0] === next[0] && tag[1] === next[1])) {
    tags.push(next)
  }
}

export const shapePostForSubmit = ({
  type,
  baseText,
  tags,
  geointState,
}: ShapePostInput): ShapePostResult => {
  const trimmed = (baseText || "").trim()
  const nextTags = [...tags]

  if (type === "default") {
    if (!trimmed) {
      return {tags: nextTags, error: "Please provide a description."}
    }

    return {content: trimmed, tags: nextTags}
  }

  if (type === "ops") {
    const humanText = ensureHashtag(trimmed, "#starcom_ops")

    addTagIfMissing(nextTags, ["app", "starcom"])
    addTagIfMissing(nextTags, ["t", "starcom_ops"])

    return {content: humanText, tags: nextTags}
  }

  const state = geointState

  if (
    !state ||
    state.lat === null ||
    state.lon === null ||
    !Number.isFinite(Number(state.lat)) ||
    !Number.isFinite(Number(state.lon))
  ) {
    return {tags: nextTags, error: "Add latitude and longitude to post GEOINT."}
  }

  const lat = Number(state.lat)
  const lon = Number(state.lon)

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return {
      tags: nextTags,
      error: "Latitude must be between -90 and 90; longitude between -180 and 180.",
    }
  }

  const humanText = ensureHashtag(trimmed, "#starcom_intel")
  const geoTag = buildGeoTagString(lat, lon, state.alt)
  const subtypeTag = (state.subtype || "").trim() || DEFAULT_GEOINT_TYPE
  const hashTag = geohashFromLatLon(lat, lon)

  addTagIfMissing(nextTags, ["app", "starcom-geoint"])
  addTagIfMissing(nextTags, ["t", "starcom_intel"])
  addTagIfMissing(nextTags, ["geo", geoTag])
  addTagIfMissing(nextTags, ["geoint-type", subtypeTag])

  let geohashWarning: string | undefined

  if (hashTag) {
    addTagIfMissing(nextTags, ["g", hashTag])
  } else {
    geohashWarning = "Geohash unavailable; post will send without it."
  }

  const payload = buildGeoJsonPayload(state, trimmed)
  const payloadJson = JSON.stringify(payload)
  const combinedContent = `${humanText} ${GEOJSON_DELIMITER}${payloadJson}`
  const size = sizeCheck(combinedContent)

  if (size.block) {
    return {
      tags: nextTags,
      sizeBlocked: `Post exceeds size limit (>10 KB). Trim text or additional data. (${Math.ceil(size.bytes / 1024)} KB).`,
    }
  }

  const sizeWarning = size.warn
    ? "Post is getting large (>5 KB). Consider trimming attachments or details."
    : undefined

  return {content: combinedContent, tags: nextTags, geohashWarning, sizeWarning}
}
