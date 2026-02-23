import {isSecurePilotEnabled} from "src/engine/group-transport-secure"
import {
  mapCapabilityReasonsToUi,
  type GroupCapabilityReasonCode,
} from "src/domain/group-capability-probe"
import type {GuidedPrivacyLevel} from "src/app/groups/guided-create-options"

type CapabilityReadiness = "R0" | "R1" | "R2" | "R3" | "R4"

export const getSecureCapabilityGateMessage = ({
  preferredMode,
  capabilitySnapshot,
  securityMode,
}: {
  preferredMode: "baseline-nip29" | "secure-nip-ee"
  capabilitySnapshot?: {readiness?: CapabilityReadiness; reasons?: GroupCapabilityReasonCode[]}
  securityMode?: GuidedPrivacyLevel
}) => {
  if (preferredMode !== "secure-nip-ee") {
    return null
  }

  const resolvedSecurityMode = securityMode || "secure"
  const strictMode = resolvedSecurityMode === "secure" || resolvedSecurityMode === "max"
  const modeLabel = resolvedSecurityMode === "max" ? "Max" : "Secure"

  if (!isSecurePilotEnabled()) {
    if (strictMode) {
      return `${modeLabel} mode is currently unavailable in this build. Strict mode remains blocked until secure pilot is enabled.`
    }

    return "Secure mode is currently unavailable in this build; Auto mode can continue with compatibility transport."
  }

  if (capabilitySnapshot?.readiness && capabilitySnapshot.readiness !== "R4") {
    const fallbackReasons = mapCapabilityReasonsToUi(
      (capabilitySnapshot.reasons || []).filter(Boolean),
    )

    if (fallbackReasons.length > 0) {
      if (strictMode) {
        return `${modeLabel} requirements not met (${capabilitySnapshot.readiness}). Strict mode remains blocked: ${fallbackReasons[0].message}`
      }

      return `Secure capability mismatch (${capabilitySnapshot.readiness}). Auto mode may use compatibility transport: ${fallbackReasons[0].message}`
    }

    if (strictMode) {
      return `${modeLabel} requirements not met (${capabilitySnapshot.readiness}). Strict mode remains blocked.`
    }

    return `Secure capability mismatch (${capabilitySnapshot.readiness}). Auto mode may use compatibility transport.`
  }

  return null
}
