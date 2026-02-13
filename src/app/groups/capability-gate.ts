import {isSecurePilotEnabled} from "src/engine/group-transport-secure"
import {
  mapCapabilityReasonsToUi,
  type GroupCapabilityReasonCode,
} from "src/domain/group-capability-probe"

type CapabilityReadiness = "R0" | "R1" | "R2" | "R3" | "R4"

export const getSecureCapabilityGateMessage = ({
  preferredMode,
  capabilitySnapshot,
}: {
  preferredMode: "baseline-nip29" | "secure-nip-ee"
  capabilitySnapshot?: {readiness?: CapabilityReadiness; reasons?: GroupCapabilityReasonCode[]}
}) => {
  if (preferredMode !== "secure-nip-ee") {
    return null
  }

  if (!isSecurePilotEnabled()) {
    return "Secure mode is currently unavailable in this build; baseline fallback will be used."
  }

  if (capabilitySnapshot?.readiness && capabilitySnapshot.readiness !== "R4") {
    const fallbackReasons = mapCapabilityReasonsToUi(
      (capabilitySnapshot.reasons || []).filter(Boolean),
    )

    if (fallbackReasons.length > 0) {
      return `Secure capability mismatch (${capabilitySnapshot.readiness}). Baseline fallback may be used: ${fallbackReasons[0].message}`
    }

    return `Secure capability mismatch (${capabilitySnapshot.readiness}). Baseline fallback may be used.`
  }

  return null
}
