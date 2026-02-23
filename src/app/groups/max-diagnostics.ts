import type {GuidedPrivacyLevel} from "src/app/groups/guided-create-options"
import type {RelayCapabilityCheck} from "src/app/groups/relay-capability"
import {
  evaluateMaxPreconditions,
  toMaxPreconditionBlockMessage,
  type MaxPreconditionBlockReason,
} from "src/app/groups/max-preconditions"

export type MaxDiagnosticsState = "pending" | "blocked" | "active"

export type MaxDiagnostics = {
  state: MaxDiagnosticsState
  label: string
  detail: string
  reason?: MaxPreconditionBlockReason | "STRICT_REQUIRES_SECURE_PILOT"
  checklist: Array<{label: string; done: boolean}>
}

const hasMaxSignal = (checks: RelayCapabilityCheck[]) =>
  checks.some(check => check.supportsNipEeSignal === true && check.supportsNip104 === true)

const hasNavcomDefaultRelaySignal = (checks: RelayCapabilityCheck[]) =>
  checks.some(check => check.isNavcomDefaultRelay === true)

const hasNonNavcomRelaySignal = (checks: RelayCapabilityCheck[]) =>
  checks.some(check => check.isNavcomDefaultRelay === false)

export const getMaxModeDiagnostics = ({
  privacy,
  relayChecks,
  securePilotEnabled,
}: {
  privacy: GuidedPrivacyLevel
  relayChecks: RelayCapabilityCheck[]
  securePilotEnabled: boolean
}): MaxDiagnostics | null => {
  if (privacy !== "max") {
    return null
  }

  const checklist = [
    {label: "Secure pilot enabled", done: securePilotEnabled},
    {label: "At least one relay advertises NIP-104 + NIP-EE", done: hasMaxSignal(relayChecks)},
    {label: "Navcom default relay included", done: hasNavcomDefaultRelaySignal(relayChecks)},
    {label: "Only Navcom relays selected", done: !hasNonNavcomRelaySignal(relayChecks)},
  ]

  if (!securePilotEnabled) {
    return {
      state: "blocked",
      label: "Max blocked",
      detail: "Secure pilot is disabled. Enable secure pilot before using Max mode.",
      reason: "STRICT_REQUIRES_SECURE_PILOT",
      checklist,
    }
  }

  if (relayChecks.length === 0) {
    return {
      state: "pending",
      label: "Max pending checks",
      detail: "Run relay capability checks to evaluate Max mode preconditions.",
      checklist,
    }
  }

  const reason = evaluateMaxPreconditions({relayChecks})

  if (reason) {
    return {
      state: "blocked",
      label: "Max blocked",
      detail: toMaxPreconditionBlockMessage(reason),
      reason,
      checklist,
    }
  }

  return {
    state: "active",
    label: "Max ready",
    detail: "Max preconditions passed for current relay selection.",
    checklist,
  }
}

export const getMaxDiagnosticsToneClass = (state: MaxDiagnosticsState) => {
  if (state === "active") {
    return "border-emerald-500 text-emerald-300"
  }

  if (state === "blocked") {
    return "border-warning text-warning"
  }

  return "border-neutral-600 text-neutral-300"
}
