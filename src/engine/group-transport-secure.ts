import {
  errTransportResult,
  type GroupTransport,
  type GroupTransportCanOperateInput,
} from "src/engine/group-transport-contracts"
import {
  parseSecureGroupSendInputResult,
  parseSecureGroupSubscribeInput,
  reconcileSecureGroupEvents,
  sendSecureGroupMessage,
  subscribeSecureGroupEvents,
} from "src/engine/group-transport-secure-ops"
import {publishSecureControlAction as publishSecureControlActionDispatch} from "src/engine/group-transport-secure-control"

let securePilotEnabled = false

export const isSecurePilotEnabled = () => securePilotEnabled

export const setSecurePilotEnabled = (enabled: boolean) => {
  securePilotEnabled = enabled
}

const secureDisabledResult = () =>
  errTransportResult(
    "GROUP_TRANSPORT_CAPABILITY_BLOCKED",
    "Secure pilot adapter is disabled.",
    false,
  )

const canOperate = ({requestedMode, capabilitySnapshot}: GroupTransportCanOperateInput) => {
  if (requestedMode !== "secure-nip-ee") {
    return {ok: false, reason: "Secure adapter only handles secure-nip-ee mode."}
  }

  if (!securePilotEnabled) {
    return {ok: false, reason: "Secure pilot adapter is disabled."}
  }

  const readiness = capabilitySnapshot?.readiness

  if (readiness && readiness !== "R4") {
    return {ok: false, reason: "Secure mode requires R4 capability readiness."}
  }

  return {ok: true}
}

export const securePilotGroupTransport: GroupTransport = {
  getModeId: () => "secure-nip-ee",
  start: () => {},
  stop: () => {},
  canOperate,
  publishControlAction: async request => {
    if (!securePilotEnabled) return secureDisabledResult()

    return publishSecureControlActionDispatch(request)
  },
  sendMessage: async input => {
    if (!securePilotEnabled) return secureDisabledResult()

    const parsed = parseSecureGroupSendInputResult(input)

    if (parsed.ok === false) {
      return errTransportResult("GROUP_TRANSPORT_VALIDATION_FAILED", parsed.message, false)
    }

    return sendSecureGroupMessage(parsed.value)
  },
  subscribe: async (input, handlers) => {
    if (!securePilotEnabled) return secureDisabledResult()

    const parsed = parseSecureGroupSubscribeInput(input)

    if (!parsed) {
      return errTransportResult(
        "GROUP_TRANSPORT_VALIDATION_FAILED",
        "Invalid secure subscribe payload. Required: groupId.",
        false,
      )
    }

    return subscribeSecureGroupEvents(parsed, handlers)
  },
  reconcile: async input => {
    if (!securePilotEnabled) return secureDisabledResult()

    if (!input || typeof input !== "object") {
      return errTransportResult(
        "GROUP_TRANSPORT_VALIDATION_FAILED",
        "Invalid secure reconcile payload.",
        false,
      )
    }

    const candidate = input as Record<string, unknown>
    const groupId = typeof candidate.groupId === "string" ? candidate.groupId : ""
    const remoteEvents = Array.isArray(candidate.remoteEvents) ? candidate.remoteEvents : []

    return reconcileSecureGroupEvents({
      groupId,
      remoteEvents,
      localState: candidate.localState,
    })
  },
}
