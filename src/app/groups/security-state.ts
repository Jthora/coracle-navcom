import type {GroupProjection, GroupTransportMode} from "src/domain/group"

export type GroupSecurityState =
  | "secure-active"
  | "compatibility-active"
  | "fallback-active"
  | "blocked"

export const resolveGroupSecurityState = ({
  transportMode,
  hasDowngradeSignal,
  isBlocked,
}: {
  transportMode: GroupTransportMode
  hasDowngradeSignal?: boolean
  isBlocked?: boolean
}) => {
  if (isBlocked) {
    return {
      state: "blocked" as GroupSecurityState,
      label: "Blocked",
      hint: "Policy constraints are preventing secure operation. Review room policy and relay capabilities.",
    }
  }

  if (hasDowngradeSignal) {
    return {
      state: "fallback-active" as GroupSecurityState,
      label: "Compatibility transport active",
      hint: "Compatibility fallback is active after secure transport degraded. Review relay health and policy constraints.",
    }
  }

  if (transportMode === "secure-nip-ee") {
    return {
      state: "secure-active" as GroupSecurityState,
      label: "Secure transport active",
      hint: "Secure pilot transport is active for this room. Compatibility fallback may be used if capability drops.",
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
) => {
  if (!projection) {
    return {
      state: "compatibility-active" as GroupSecurityState,
      label: "Compatibility transport active",
      hint: "Security state unavailable until group data loads.",
    }
  }

  return resolveGroupSecurityState({
    transportMode: projection.group.transportMode,
    hasDowngradeSignal,
  })
}
