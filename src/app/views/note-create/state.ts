import {buildGeoJsonPayload, ensureHashtag} from "src/app/util/geoint"
import type {GeointState} from "src/app/util/geoint"

export type NoteCreateType = "default" | "ops" | "geoint"

export type NoteCreatePreviewData = {
  human: string
  payload: any | null
}

export const getNoteCreateDraftKeys = (pubkey: string | null, quoteId?: string | null) => {
  const baseDraftKey = ["notecreate", pubkey, quoteId].filter(Boolean).join(":")
  const typedDraftKey = (type: NoteCreateType) => [baseDraftKey, type].filter(Boolean).join(":")
  const geoDraftKey = (type: NoteCreateType) => `${typedDraftKey(type)}:geo`

  return {baseDraftKey, typedDraftKey, geoDraftKey}
}

export const ensureDefaultTypedDraft = (
  draftStore: any,
  typedDraftKey: (type: NoteCreateType) => string,
  baseDraftKey: string,
) => {
  if (!draftStore.has(typedDraftKey("default")) && draftStore.has(baseDraftKey)) {
    draftStore.set(typedDraftKey("default"), draftStore.get(baseDraftKey))
  }
}

export const getDraftForType = (
  draftStore: any,
  type: NoteCreateType,
  typedDraftKey: (type: NoteCreateType) => string,
  baseDraftKey: string,
) => {
  if (type === "default") {
    return draftStore.get(typedDraftKey(type)) ?? draftStore.get(baseDraftKey) ?? ""
  }

  return draftStore.get(typedDraftKey(type)) ?? ""
}

export const normalizeGeoState = (state: GeointState): GeointState => ({
  ...state,
  lat: state.lat === null || state.lat === undefined ? null : Number(state.lat),
  lon: state.lon === null || state.lon === undefined ? null : Number(state.lon),
  alt: state.alt === null || state.alt === undefined ? null : Number(state.alt),
  confidence:
    state.confidence === null || state.confidence === undefined ? null : Number(state.confidence),
})

export const isValidGeoState = (state?: GeointState | null) => {
  if (!state) return false

  const lat = Number(state.lat)
  const lon = Number(state.lon)

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  )
}

export const assemblePreviewData = ({
  baseText,
  selectedType,
  geointState,
  hasValidGeo,
}: {
  baseText: string
  selectedType: NoteCreateType
  geointState: GeointState
  hasValidGeo: boolean
}): NoteCreatePreviewData => {
  let humanText = baseText
  let payload: any | null = null

  if (selectedType === "ops") {
    humanText = ensureHashtag(baseText, "#starcom_ops")
  } else if (selectedType === "geoint" && hasValidGeo) {
    humanText = ensureHashtag(baseText, "#starcom_intel")

    try {
      payload = buildGeoJsonPayload(geointState, baseText)
    } catch (error) {
      payload = null
    }
  }

  return {human: humanText, payload}
}
