import type {PqcNegotiationOutcome, PqcNegotiationReasonCode} from "src/engine/pqc/negotiation"

export type PqcCompatibilityNoticeLevel = "info" | "warning" | "error"

export type PqcCompatibilityNotice = {
  level: PqcCompatibilityNoticeLevel
  reason: PqcNegotiationReasonCode
  summary: string
}

const FALLBACK_WARNING_SUMMARY =
  "Sent with classical encryption because hybrid prerequisites were unavailable."

const BLOCKED_WARNING_SUMMARY =
  "Message could not be sent because compatibility fallback was unavailable for this peer state."

export const getCompatibilityNegotiationNotice = (
  outcome: PqcNegotiationOutcome,
): PqcCompatibilityNotice | null => {
  if (outcome.reason === "NEGOTIATION_OK_HYBRID") {
    return null
  }

  if (outcome.reason === "NEGOTIATION_FALLBACK_CLASSICAL") {
    return {
      level: "warning",
      reason: outcome.reason,
      summary: FALLBACK_WARNING_SUMMARY,
    }
  }

  return {
    level: "error",
    reason: outcome.reason,
    summary: BLOCKED_WARNING_SUMMARY,
  }
}
