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
  warning: string
  reason?: MaxPreconditionBlockReason | "STRICT_REQUIRES_SECURE_PILOT"
  checklist: Array<{label: string; done: boolean}>
}

const MAX_EXPERIMENTAL_WARNING =
  "⚠️ PQC security is experimental. There are no mainstream NIPs yet for PQC encrypted group chats. Relays may still support functionality, but only Navcom clients will currently handle this encryption protocol properly."

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

  const checklist = [{label: "Secure pilot enabled", done: securePilotEnabled}]

  if (!securePilotEnabled) {
    return {
      state: "blocked",
      label: "Max blocked",
      detail: "Secure pilot is disabled. Enable secure pilot before using Max mode.",
      warning: MAX_EXPERIMENTAL_WARNING,
      reason: "STRICT_REQUIRES_SECURE_PILOT",
      checklist,
    }
  }

  const reason = evaluateMaxPreconditions({relayChecks})

  if (reason) {
    return {
      state: "blocked",
      label: "Max blocked",
      detail: toMaxPreconditionBlockMessage(reason),
      warning: MAX_EXPERIMENTAL_WARNING,
      reason,
      checklist,
    }
  }

  return {
    state: "active",
    label: "Max ready",
    detail: "Max mode is enabled for experimental client-side PQC group messaging.",
    warning: MAX_EXPERIMENTAL_WARNING,
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
