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
      hint: "Policy constraints are preventing secure operation. Review admin settings.",
    }
  }

  if (hasDowngradeSignal) {
    return {
      state: "fallback-active" as GroupSecurityState,
      label: "Fallback active",
      hint: "A non-preferred path is active. Review relay health and security settings.",
    }
  }

  if (transportMode === "secure-nip-ee") {
    return {
      state: "secure-active" as GroupSecurityState,
      label: "Secure active",
      hint: "Preferred secure transport is active.",
    }
  }

  return {
    state: "compatibility-active" as GroupSecurityState,
    label: "Compatibility active",
    hint: "Compatibility mode is active for broader support.",
  }
}

export const getProjectionSecurityState = (
  projection: GroupProjection | undefined,
  hasDowngradeSignal = false,
) => {
  if (!projection) {
    return {
      state: "compatibility-active" as GroupSecurityState,
      label: "Compatibility active",
      hint: "Security state unavailable until group data loads.",
    }
  }

  return resolveGroupSecurityState({
    transportMode: projection.group.transportMode,
    hasDowngradeSignal,
  })
}
