import type {RelayPayloadBudgetEvaluation} from "src/engine/pqc/relay-payload-budget"

export type RelaySizeRejectionReason =
  | "RELAY_SIZE_REJECTED"
  | "RELAY_EVENT_TOO_LARGE"
  | "RELAY_MAX_EVENT_BYTES_EXCEEDED"

export type RelaySizeFallbackAction = "retry-alt-relays" | "fallback-mode" | "block"

const SIZE_REJECTION_PATTERNS: Array<[RelaySizeRejectionReason, RegExp]> = [
  ["RELAY_SIZE_REJECTED", /size\s*(limit|reject|exceed|too\s*large)/i],
  ["RELAY_EVENT_TOO_LARGE", /event\s*(too\s*large|oversize|over\s*limit)/i],
  [
    "RELAY_MAX_EVENT_BYTES_EXCEEDED",
    /(max[_\s-]*event[_\s-]*bytes|max[_\s-]*message[_\s-]*length)/i,
  ],
]

export const detectRelaySizeRejectionReason = (message: string | null | undefined) => {
  if (!message || !message.trim()) {
    return null
  }

  for (const [reason, pattern] of SIZE_REJECTION_PATTERNS) {
    if (pattern.test(message)) {
      return reason
    }
  }

  return null
}

export const getRelaySizeRejectionNotice = (message: string | null | undefined) => {
  const reason = detectRelaySizeRejectionReason(message)

  if (!reason) {
    return null
  }

  return {
    reason,
    summary:
      "Relay rejected publish due to payload size constraints. Retrying with alternate relays or compatibility fallback may be required.",
  }
}

export const selectAlternateRelaysForRetry = ({
  evaluations,
  attemptedRelays,
}: {
  evaluations: RelayPayloadBudgetEvaluation[]
  attemptedRelays: string[]
}) => {
  const attempted = new Set(attemptedRelays)

  return evaluations
    .filter(entry => entry.fits)
    .map(entry => entry.relay)
    .filter(relay => !attempted.has(relay))
}

export const resolveRelaySizeFallbackAction = ({
  policyMode,
  allowClassicalFallback,
  alternateRelays,
}: {
  policyMode: "strict" | "compatibility"
  allowClassicalFallback: boolean
  alternateRelays: string[]
}) => {
  if (alternateRelays.length > 0) {
    return {
      action: "retry-alt-relays" as RelaySizeFallbackAction,
      reason: "RELAY_RETRY_WITH_ALTERNATES",
    }
  }

  if (policyMode === "compatibility" && allowClassicalFallback) {
    return {
      action: "fallback-mode" as RelaySizeFallbackAction,
      reason: "RELAY_RETRY_WITH_COMPAT_FALLBACK",
    }
  }

  return {
    action: "block" as RelaySizeFallbackAction,
    reason: "RELAY_SIZE_REJECTION_BLOCKED",
  }
}
