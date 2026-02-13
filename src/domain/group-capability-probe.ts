export const GROUP_CAPABILITY_REASON = {
  NO_RELAYS: "GROUP_CAPABILITY_NO_RELAYS",
  MISSING_AUTH: "GROUP_CAPABILITY_MISSING_AUTH",
  MISSING_GROUP_KIND: "GROUP_CAPABILITY_MISSING_GROUP_KIND",
  UNSTABLE_ACK: "GROUP_CAPABILITY_UNSTABLE_ACK",
  MISSING_SIGNER_FEATURE: "GROUP_CAPABILITY_MISSING_SIGNER_FEATURE",
  STALE_CACHE: "GROUP_CAPABILITY_STALE_CACHE",
} as const

export type GroupCapabilityReasonCode =
  (typeof GROUP_CAPABILITY_REASON)[keyof typeof GROUP_CAPABILITY_REASON]

export type ProbeTrigger = "startup" | "create" | "join" | "periodic" | "manual"

export type GroupCapabilityRequest = {
  id: string
  description: string
  required: boolean
}

export const GROUP_CAPABILITY_REQUESTS: GroupCapabilityRequest[] = [
  {id: "auth", description: "Relay supports authenticated workflow", required: true},
  {id: "group-kind", description: "Relay accepts required group event kinds", required: true},
  {
    id: "ack-stability",
    description: "Relay returns stable publish acknowledgements",
    required: true,
  },
  {id: "signer-nip44", description: "Signer supports secure group primitives", required: false},
]

export type GroupRelayCapabilities = {
  url: string
  supportsAuth: boolean
  supportsGroupKinds: boolean
  stableAck: boolean
  signerNip44: boolean
  checkedAt: number
}

export type GroupCapabilityProbeResult = {
  relayUrl: string
  checkedAt: number
  readiness: "R0" | "R1" | "R2" | "R3" | "R4"
  reasons: GroupCapabilityReasonCode[]
}

export type GroupCapabilitySnapshot = {
  relayUrl: string
  checkedAt: number
  expiresAt: number
  staleAt: number
  readiness: GroupCapabilityProbeResult["readiness"]
  reasons: GroupCapabilityReasonCode[]
}

const uniqReasons = (reasons: GroupCapabilityReasonCode[]) => Array.from(new Set(reasons))

const getReadiness = (caps: GroupRelayCapabilities, reasons: GroupCapabilityReasonCode[]) => {
  if (reasons.includes(GROUP_CAPABILITY_REASON.NO_RELAYS)) return "R0"

  if (caps.supportsAuth && caps.supportsGroupKinds && caps.stableAck && caps.signerNip44)
    return "R4"
  if (caps.supportsAuth && caps.supportsGroupKinds && caps.stableAck) return "R3"
  if (caps.supportsAuth && caps.supportsGroupKinds) return "R2"
  if (caps.supportsAuth) return "R1"

  return "R0"
}

export const runGroupCapabilityProbe = (
  capabilities: GroupRelayCapabilities,
): GroupCapabilityProbeResult => {
  const reasons: GroupCapabilityReasonCode[] = []

  if (!capabilities.url) {
    reasons.push(GROUP_CAPABILITY_REASON.NO_RELAYS)
  }
  if (!capabilities.supportsAuth) {
    reasons.push(GROUP_CAPABILITY_REASON.MISSING_AUTH)
  }
  if (!capabilities.supportsGroupKinds) {
    reasons.push(GROUP_CAPABILITY_REASON.MISSING_GROUP_KIND)
  }
  if (!capabilities.stableAck) {
    reasons.push(GROUP_CAPABILITY_REASON.UNSTABLE_ACK)
  }
  if (!capabilities.signerNip44) {
    reasons.push(GROUP_CAPABILITY_REASON.MISSING_SIGNER_FEATURE)
  }

  const uniqueReasons = uniqReasons(reasons)

  return {
    relayUrl: capabilities.url,
    checkedAt: capabilities.checkedAt,
    readiness: getReadiness(capabilities, uniqueReasons),
    reasons: uniqueReasons,
  }
}

export type CapabilityProbeCacheOptions = {
  ttlSeconds?: number
  staleAfterSeconds?: number
}

export const createGroupCapabilityCache = ({
  ttlSeconds = 300,
  staleAfterSeconds = 900,
}: CapabilityProbeCacheOptions = {}) => {
  const snapshots = new Map<string, GroupCapabilitySnapshot>()

  const upsert = (relayUrl: string, result: GroupCapabilityProbeResult, now = result.checkedAt) => {
    snapshots.set(relayUrl, {
      relayUrl,
      checkedAt: result.checkedAt,
      readiness: result.readiness,
      reasons: result.reasons,
      expiresAt: now + ttlSeconds,
      staleAt: now + staleAfterSeconds,
    })
  }

  const get = (relayUrl: string) => snapshots.get(relayUrl)

  const getFreshness = (
    relayUrl: string,
    now = Math.floor(Date.now() / 1000),
  ): "miss" | "fresh" | "expired" | "stale" => {
    const snapshot = snapshots.get(relayUrl)

    if (!snapshot) return "miss"
    if (now > snapshot.staleAt) return "stale"
    if (now > snapshot.expiresAt) return "expired"

    return "fresh"
  }

  const shouldProbe = (
    trigger: ProbeTrigger,
    relayUrl: string,
    now = Math.floor(Date.now() / 1000),
  ) => {
    const freshness = getFreshness(relayUrl, now)

    if (trigger === "manual" || trigger === "create" || trigger === "join") return true
    if (trigger === "startup") return freshness === "miss" || freshness === "stale"

    return freshness === "expired" || freshness === "stale"
  }

  const getWithFallback = (
    relayUrl: string,
    now = Math.floor(Date.now() / 1000),
  ): GroupCapabilitySnapshot | null => {
    const snapshot = snapshots.get(relayUrl)

    if (!snapshot) return null

    if (now > snapshot.staleAt) {
      return {
        ...snapshot,
        reasons: uniqReasons([...snapshot.reasons, GROUP_CAPABILITY_REASON.STALE_CACHE]),
      }
    }

    return snapshot
  }

  return {
    upsert,
    get,
    getFreshness,
    shouldProbe,
    getWithFallback,
  }
}

export const GROUP_CAPABILITY_REASON_UI: Record<GroupCapabilityReasonCode, string> = {
  GROUP_CAPABILITY_NO_RELAYS: "No relay is configured for this group.",
  GROUP_CAPABILITY_MISSING_AUTH: "Relay does not support required authentication.",
  GROUP_CAPABILITY_MISSING_GROUP_KIND: "Relay does not support required group event kinds.",
  GROUP_CAPABILITY_UNSTABLE_ACK: "Relay acknowledgements are unstable.",
  GROUP_CAPABILITY_MISSING_SIGNER_FEATURE: "Signer is missing secure group feature support.",
  GROUP_CAPABILITY_STALE_CACHE: "Capability snapshot is stale and should be refreshed.",
}

export const mapCapabilityReasonsToUi = (reasons: GroupCapabilityReasonCode[]) =>
  uniqReasons(reasons).map(code => ({code, message: GROUP_CAPABILITY_REASON_UI[code]}))
