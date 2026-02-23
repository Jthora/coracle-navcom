import type {GroupProjection, GroupTransportMode} from "src/domain/group"
import type {GuidedPrivacyLevel} from "src/app/groups/guided-create-options"

export type GroupSecurityState =
  | "secure-active"
  | "compatibility-active"
  | "fallback-active"
  | "blocked"

export const resolveGroupSecurityState = ({
  transportMode,
  hasDowngradeSignal,
  isBlocked,
  securityMode,
}: {
  transportMode: GroupTransportMode
  hasDowngradeSignal?: boolean
  isBlocked?: boolean
  securityMode?: GuidedPrivacyLevel
}) => {
  const strictMode = securityMode === "secure" || securityMode === "max"
  const strictLabel = securityMode === "max" ? "Max mode" : "Secure mode"

  if (isBlocked) {
    return {
      state: "blocked" as GroupSecurityState,
      label: "Blocked",
      hint: strictMode
        ? `${strictLabel} is blocked by policy or capability constraints. Review room policy and relay capabilities.`
        : "Policy constraints are preventing secure operation. Review room policy and relay capabilities.",
    }
  }

  if (hasDowngradeSignal) {
    if (strictMode) {
      return {
        state: "fallback-active" as GroupSecurityState,
        label: "Strict mode degraded",
        hint: `${strictLabel} was requested but secure transport is unavailable. Compatibility fallback remains blocked unless an audited override is approved.`,
      }
    }

    return {
      state: "fallback-active" as GroupSecurityState,
      label: "Compatibility transport active",
      hint: "Compatibility fallback is active after secure transport degraded. Review relay health and policy constraints.",
    }
  }

  if (transportMode === "secure-nip-ee") {
    if (strictMode) {
      return {
        state: "secure-active" as GroupSecurityState,
        label: `${strictLabel} active`,
        hint: `${strictLabel} is active for this room with secure transport.`,
      }
    }

    return {
      state: "secure-active" as GroupSecurityState,
      label: "Secure transport active",
      hint: "Secure pilot transport is active for this room.",
    }
  }

  if (strictMode) {
    return {
      state: "compatibility-active" as GroupSecurityState,
      label: "Compatibility transport active",
      hint: `${strictLabel} is not active. This room is currently using compatibility transport.`,
    }
  }

  return {
    state: "compatibility-active" as GroupSecurityState,
    label: "Compatibility transport active",
    hint: "Compatibility transport is active for broader support. This mode does not imply confidentiality guarantees.",
  }
}

export const getProjectionSecurityState = (
  projection: GroupProjection | undefined,
  hasDowngradeSignal = false,
  securityMode?: GuidedPrivacyLevel,
) => {
  if (!projection) {
    return {
      state: "compatibility-active" as GroupSecurityState,
      label: "Compatibility transport active",
      hint:
        securityMode === "secure" || securityMode === "max"
          ? `${securityMode === "max" ? "Max mode" : "Secure mode"} requested; security state unavailable until group data loads.`
          : "Security state unavailable until group data loads.",
    }
  }

  return resolveGroupSecurityState({
    transportMode: projection.group.transportMode,
    hasDowngradeSignal,
    securityMode,
  })
}
