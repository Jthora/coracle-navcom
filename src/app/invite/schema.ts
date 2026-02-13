import {parseGroupAddress} from "src/domain/group-id"
import type {GroupTransportMode} from "src/domain/group"

export type GroupInviteMissionTier = 0 | 1 | 2

export type GroupInvitePayload = {
  groupId: string
  preferredMode?: GroupTransportMode
  missionTier?: GroupInviteMissionTier
  label?: string
}

export const GROUP_INVITE_PARSE_REASON = {
  INVALID_GROUP_ID: "GROUP_INVITE_INVALID_GROUP_ID",
  INVALID_MODE: "GROUP_INVITE_INVALID_MODE",
  INVALID_TIER: "GROUP_INVITE_INVALID_TIER",
  INVALID_LABEL: "GROUP_INVITE_INVALID_LABEL",
  INVALID_SHAPE: "GROUP_INVITE_INVALID_SHAPE",
} as const

export type GroupInviteParseReasonCode =
  (typeof GROUP_INVITE_PARSE_REASON)[keyof typeof GROUP_INVITE_PARSE_REASON]

export type GroupInviteParseError = {
  reason: GroupInviteParseReasonCode
  value: unknown
}

export type GroupInviteParseResult =
  | {
      ok: true
      value: GroupInvitePayload
    }
  | {
      ok: false
      error: GroupInviteParseError
    }

const GROUP_MODE_VALUES: GroupTransportMode[] = ["baseline-nip29", "secure-nip-ee"]
const GROUP_TIER_VALUES: GroupInviteMissionTier[] = [0, 1, 2]

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "")

const asTier = (value: unknown): GroupInviteMissionTier | undefined => {
  if (value === undefined || value === null || value === "") return undefined

  const parsed = typeof value === "number" ? value : Number(value)

  if (!GROUP_TIER_VALUES.includes(parsed as GroupInviteMissionTier)) return undefined

  return parsed as GroupInviteMissionTier
}

const parseLegacyGroupEntry = (entry: string): GroupInvitePayload | null => {
  const parsed = parseGroupAddress(entry)

  if (!parsed) return null

  return {
    groupId: parsed.canonicalId,
  }
}

const parseDelimitedGroupEntry = (entry: string): GroupInviteParseResult | null => {
  const parts = entry.split("|").map(part => decodeURIComponent((part || "").trim()))

  if (parts.length <= 1) return null

  return parseGroupInvitePayload({
    groupId: parts[0],
    preferredMode: parts[1] || undefined,
    missionTier: parts[2] || undefined,
    label: parts[3] || undefined,
  })
}

const parseJsonGroupEntry = (entry: string): GroupInviteParseResult[] | null => {
  const trimmed = (entry || "").trim()

  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return null

  try {
    const parsed = JSON.parse(trimmed)

    if (Array.isArray(parsed)) {
      return parsed.map(candidate => parseGroupInvitePayload(candidate))
    }

    return [parseGroupInvitePayload(parsed)]
  } catch (error) {
    return null
  }
}

const normalizeLabel = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined

  const label = asString(value)

  if (!label || label.length > 120) return undefined

  return label
}

export const parseGroupInvitePayload = (value: unknown): GroupInviteParseResult => {
  if (!value || typeof value !== "object") {
    return {
      ok: false,
      error: {
        reason: GROUP_INVITE_PARSE_REASON.INVALID_SHAPE,
        value,
      },
    }
  }

  const raw = value as Record<string, unknown>
  const parsedAddress = parseGroupAddress(asString(raw.groupId))

  if (!parsedAddress) {
    return {
      ok: false,
      error: {
        reason: GROUP_INVITE_PARSE_REASON.INVALID_GROUP_ID,
        value,
      },
    }
  }

  const mode = raw.preferredMode
  const normalizedMode = mode ? asString(mode) : ""

  if (normalizedMode && !GROUP_MODE_VALUES.includes(normalizedMode as GroupTransportMode)) {
    return {
      ok: false,
      error: {
        reason: GROUP_INVITE_PARSE_REASON.INVALID_MODE,
        value,
      },
    }
  }

  const missionTier = asTier(raw.missionTier)

  if (
    raw.missionTier !== undefined &&
    raw.missionTier !== null &&
    raw.missionTier !== "" &&
    missionTier === undefined
  ) {
    return {
      ok: false,
      error: {
        reason: GROUP_INVITE_PARSE_REASON.INVALID_TIER,
        value,
      },
    }
  }

  const label = normalizeLabel(raw.label)

  if (raw.label !== undefined && raw.label !== null && raw.label !== "" && !label) {
    return {
      ok: false,
      error: {
        reason: GROUP_INVITE_PARSE_REASON.INVALID_LABEL,
        value,
      },
    }
  }

  return {
    ok: true,
    value: {
      groupId: parsedAddress.canonicalId,
      preferredMode: normalizedMode ? (normalizedMode as GroupTransportMode) : undefined,
      missionTier,
      label,
    },
  }
}

export const decodeGroupInvitePayloads = (value: string): GroupInvitePayload[] => {
  if (!value) return []

  const decodedValue = decodeURIComponent(value)
  const jsonResult = parseJsonGroupEntry(decodedValue)

  if (jsonResult) {
    return jsonResult.flatMap(result => (result.ok ? [result.value] : []))
  }

  const items = decodedValue
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)

  const result: GroupInvitePayload[] = []

  for (const item of items) {
    const delimited = parseDelimitedGroupEntry(item)

    if (delimited?.ok) {
      result.push(delimited.value)
      continue
    }

    const parsedJsonEntries = parseJsonGroupEntry(item)

    if (parsedJsonEntries) {
      result.push(...parsedJsonEntries.flatMap(entry => (entry.ok ? [entry.value] : [])))
      continue
    }

    const legacy = parseLegacyGroupEntry(item)

    if (legacy) {
      result.push(legacy)
    }
  }

  return result
}

export const encodeGroupInvitePayloads = (payloads: GroupInvitePayload[]): string =>
  payloads
    .map(payload => {
      const parts = [
        payload.groupId,
        payload.preferredMode || "",
        payload.missionTier === undefined ? "" : String(payload.missionTier),
        payload.label || "",
      ]

      return parts.map(part => encodeURIComponent(part)).join("|")
    })
    .join(",")
