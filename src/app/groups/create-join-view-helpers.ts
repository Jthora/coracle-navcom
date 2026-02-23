import type {RelayAuthLifecycleSession, RelayCapabilityCheck} from "src/app/groups/relay-capability"
import type {RelayAuthMethodIndicatorTone} from "src/app/groups/relay-auth-ux"

export const getRelayAuthStatusClass = (status: RelayAuthLifecycleSession["status"]) => {
  if (status === "authenticated") return "border-emerald-500 text-emerald-300"
  if (status === "expired") return "border-amber-500 text-amber-300"
  if (status === "failed") return "border-warning text-warning"

  return "border-neutral-600 text-neutral-300"
}

export const getRelayAuthStatusLabel = (status: RelayAuthLifecycleSession["status"]) => {
  if (status === "authenticated") return "authenticated"
  if (status === "authenticating") return "authenticating"
  if (status === "expired") return "expired"
  if (status === "failed") return "failed"

  return "not-authenticated"
}

export const getRelayAuthMethodBadgeClass = (tone: RelayAuthMethodIndicatorTone) => {
  if (tone === "warning") return "border-amber-500 text-amber-300"
  if (tone === "danger") return "border-warning text-warning"

  return "border-neutral-600 text-neutral-300"
}

export type RelayCheckCounts = {
  readyCount: number
  authRequiredCount: number
  unreachableCount: number
  notAdvertisedCount: number
  unknownCount: number
}

export const getRelayCheckCounts = (checks: RelayCapabilityCheck[]): RelayCheckCounts => {
  const readyCount = checks.filter(check => check.status === "ready").length
  const authRequiredCount = checks.filter(check => check.status === "auth-required").length
  const unreachableCount = checks.filter(check => check.status === "unreachable").length
  const notAdvertisedCount = checks.filter(check => check.status === "not-advertised").length
  const unknownCount = checks.filter(check => check.status === "unknown").length

  return {
    readyCount,
    authRequiredCount,
    unreachableCount,
    notAdvertisedCount,
    unknownCount,
  }
}

export const getRelayChecksResult = (checks: RelayCapabilityCheck[]) => {
  const {authRequiredCount, unreachableCount, unknownCount} = getRelayCheckCounts(checks)

  if (unreachableCount > 0 || unknownCount > 0 || authRequiredCount > 0) {
    return "warning"
  }

  return "success"
}

export const getRelayStatusBadgeClass = (status: RelayCapabilityCheck["status"]) => {
  if (status === "ready") return "border-emerald-500 text-emerald-300"
  if (status === "auth-required") return "border-amber-500 text-amber-300"
  if (status === "not-advertised") return "border-neutral-600 text-neutral-300"

  return "border-neutral-600 text-neutral-300"
}

export const getRelayConfidenceLabel = (check: RelayCapabilityCheck) => {
  if (check.status === "ready") {
    return check.supportsNip29 ? "Advertised" : "Observed Working"
  }

  if (check.status === "auth-required") {
    return "Auth Needed"
  }

  if (check.status === "unreachable") {
    return "Unreachable"
  }

  if (check.status === "not-advertised") {
    return "Not Advertised"
  }

  return "Unknown"
}

export const getRelayConfidenceClass = (check: RelayCapabilityCheck) => {
  if (check.status === "ready") return "border-emerald-500 text-emerald-300"
  if (check.status === "auth-required") return "border-amber-500 text-amber-300"
  if (check.status === "unreachable") return "border-warning text-warning"
  if (check.status === "not-advertised") return "border-neutral-600 text-neutral-300"

  return "border-neutral-600 text-neutral-300"
}

export const getRelayRuntimeProof = (
  check: RelayCapabilityCheck,
  relayConfirmed = false,
): {label: string; detail: string; tone: "good" | "warn" | "neutral"} => {
  if (check.status === "unreachable") {
    return {
      label: "Failed",
      detail: "Could not reach relay, so runtime behavior could not be verified.",
      tone: "warn",
    }
  }

  if (check.status === "auth-required" && relayConfirmed) {
    return {
      label: "Auth Confirmed",
      detail: "Relay challenge/response auth completed for this session.",
      tone: "good",
    }
  }

  if (check.status === "ready") {
    return {
      label: "Preflight Passed",
      detail: "Metadata probe succeeded. Publish/subscribe proof is still runtime-dependent.",
      tone: "neutral",
    }
  }

  if (check.status === "auth-required") {
    return {
      label: "Pending Auth",
      detail: "Relay requires auth before write proof can be established.",
      tone: "warn",
    }
  }

  return {
    label: "Unverified",
    detail: "Capability advertisement only. Runtime publish/subscribe proof not yet confirmed.",
    tone: "neutral",
  }
}

export const getRuntimeProofClass = (tone: "good" | "warn" | "neutral") => {
  if (tone === "good") return "border-emerald-500 text-emerald-300"
  if (tone === "warn") return "border-warning text-warning"

  return "border-neutral-600 text-neutral-300"
}

export const getCapabilitySignalLabel = (value?: boolean | null) => {
  if (value === true) return "yes"
  if (value === false) return "no"

  return "unknown"
}

export const getCapabilitySignalClass = (value?: boolean | null) => {
  if (value === true) return "border-emerald-500 text-emerald-300"
  if (value === false) return "border-warning text-warning"

  return "border-neutral-600 text-neutral-300"
}

export const getChecklistStatusClass = (done: boolean) =>
  done ? "border-emerald-500 text-emerald-300" : "border-warning text-warning"
