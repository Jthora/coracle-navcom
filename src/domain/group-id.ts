import {Address} from "@welshman/util"

export type GroupAddressKind = "relay" | "naddr" | "opaque"

export type GroupAddress = {
  kind: GroupAddressKind
  canonicalId: string
  relayHost?: string
  groupName?: string
  address?: string
}

export const GROUP_ID_REASON = {
  EMPTY: "GROUP_ID_EMPTY",
  INVALID_RELAY_FORMAT: "GROUP_ID_INVALID_RELAY_FORMAT",
  INVALID_NADDR_FORMAT: "GROUP_ID_INVALID_NADDR_FORMAT",
  INVALID_OPAQUE_FORMAT: "GROUP_ID_INVALID_OPAQUE_FORMAT",
} as const

export type GroupIdReasonCode = (typeof GROUP_ID_REASON)[keyof typeof GROUP_ID_REASON]

export type GroupAddressParseError = {
  reason: GroupIdReasonCode
  token: string
}

export type GroupAddressParseResult =
  | {
      ok: true
      value: GroupAddress
    }
  | {
      ok: false
      error: GroupAddressParseError
    }

const RELAY_GROUP_RE = /^([a-z0-9.-]+)'([a-z0-9_-]+)$/i
const OPAQUE_GROUP_RE = /^[a-z0-9_-]{1,128}$/i

export const normalizeGroupToken = (token: string) => (token || "").trim().toLowerCase()

export const isOpaqueGroupId = (token: string) => OPAQUE_GROUP_RE.test(normalizeGroupToken(token))

export const parseRelayGroupId = (token: string): GroupAddress | null => {
  const normalized = normalizeGroupToken(token)
  const match = normalized.match(RELAY_GROUP_RE)

  if (!match) return null

  const relayHost = match[1]
  const groupName = match[2]

  return {
    kind: "relay",
    canonicalId: `${relayHost}'${groupName}`,
    relayHost,
    groupName,
  }
}

export const parseGroupAddress = (token: string): GroupAddress | null => {
  const result = parseGroupAddressResult(token)

  return result.ok ? result.value : null
}

export const parseGroupAddressResult = (token: string): GroupAddressParseResult => {
  const normalized = normalizeGroupToken(token)

  if (!normalized) {
    return {
      ok: false,
      error: {reason: GROUP_ID_REASON.EMPTY, token},
    }
  }

  const relayGroup = parseRelayGroupId(normalized)

  if (relayGroup) {
    return {
      ok: true,
      value: relayGroup,
    }
  }

  if (normalized.includes(":")) {
    if (!Address.isAddress(normalized)) {
      return {
        ok: false,
        error: {reason: GROUP_ID_REASON.INVALID_NADDR_FORMAT, token: normalized},
      }
    }

    const canonical = Address.from(normalized).toString()

    return {
      ok: true,
      value: {
        kind: "naddr",
        canonicalId: canonical,
        address: canonical,
      },
    }
  }

  if (isOpaqueGroupId(normalized)) {
    return {
      ok: true,
      value: {
        kind: "opaque",
        canonicalId: normalized,
      },
    }
  }

  if (normalized.includes("'")) {
    return {
      ok: false,
      error: {reason: GROUP_ID_REASON.INVALID_RELAY_FORMAT, token: normalized},
    }
  }

  return {
    ok: false,
    error: {reason: GROUP_ID_REASON.INVALID_OPAQUE_FORMAT, token: normalized},
  }
}

export const assertGroupAddress = (token: string) => {
  const parsed = parseGroupAddress(token)

  if (!parsed) {
    throw new Error(`Invalid group address: ${token}`)
  }

  return parsed
}
