import {
  createGroupTransportIntent,
  validateGroupTransportIntent,
  type GroupTransportIntent,
} from "src/engine/group-transport-intent"
import {GROUP_ENGINE_ERROR_CODE, createGroupEngineError} from "src/domain/group-engine-error"
import {baselineGroupTransport} from "src/engine/group-transport-baseline"
import {securePilotGroupTransport} from "src/engine/group-transport-secure"
import type {GroupMemberRole} from "src/domain/group"
import {
  type GroupTransport,
  type GroupTransportDiagnostics,
  type GroupTransportMessageDiagnostics,
  type GroupTransportMessageRequest,
} from "src/engine/group-transport-contracts"
import {evaluateTierPolicy, type GroupMissionTier} from "src/engine/group-tier-policy"

const adapters: GroupTransport[] = [securePilotGroupTransport, baselineGroupTransport]

export const getGroupTransportAdapters = () => adapters.slice()

export const registerGroupTransportAdapter = (adapter: GroupTransport) => {
  adapters.unshift(adapter)
}

export const resolveGroupTransportAdapter = (
  intent: GroupTransportIntent,
  available = adapters,
  capabilitySnapshot?: {readiness?: "R0" | "R1" | "R2" | "R3" | "R4"; reasons?: string[]},
): GroupTransport => {
  const resolved = available.find(
    adapter => adapter.canOperate({requestedMode: intent.requestedMode, capabilitySnapshot}).ok,
  )

  return resolved || baselineGroupTransport
}

export const dispatchGroupTransportIntent = async (
  intent: GroupTransportIntent,
  diagnostics: GroupTransportDiagnostics = {},
  available = adapters,
  {
    capabilitySnapshot,
    allowCapabilityFallback = true,
    missionTier = 0,
    downgradeConfirmed = false,
    allowTier2Override = false,
  }: {
    capabilitySnapshot?: {readiness?: "R0" | "R1" | "R2" | "R3" | "R4"; reasons?: string[]}
    allowCapabilityFallback?: boolean
    missionTier?: GroupMissionTier
    downgradeConfirmed?: boolean
    allowTier2Override?: boolean
  } = {},
): Promise<unknown> => {
  const validation = validateGroupTransportIntent(intent)

  if ("message" in validation) {
    throw createGroupEngineError({
      code: GROUP_ENGINE_ERROR_CODE.INVALID_INPUT,
      message: validation.message,
      retryable: false,
      details: {
        stage: "intent-validation",
        reason: validation.reason,
      },
    })
  }

  const requestedAdapter = available.find(adapter => adapter.getModeId() === intent.requestedMode)
  const requestedGate = requestedAdapter?.canOperate({
    requestedMode: intent.requestedMode,
    capabilitySnapshot,
  })

  if (requestedAdapter && requestedGate && !requestedGate.ok && !allowCapabilityFallback) {
    diagnostics.onCapabilityBlocked?.({
      intent,
      requestedMode: intent.requestedMode,
      reason: requestedGate.reason,
    })

    throw createGroupEngineError({
      code: GROUP_ENGINE_ERROR_CODE.CAPABILITY_BLOCKED,
      message: `Capability gate blocked requested mode '${intent.requestedMode}': ${requestedGate.reason || "unavailable"}`,
      retryable: false,
      details: {
        stage: "capability-gate",
        requestedMode: intent.requestedMode,
        reason: requestedGate.reason,
      },
    })
  }

  const resolved = resolveGroupTransportAdapter(intent, available, capabilitySnapshot)
  diagnostics.onResolved?.({intent, adapterId: resolved.getModeId()})

  if (intent.requestedMode !== resolved.getModeId()) {
    diagnostics.onFallback?.({
      intent,
      requestedMode: intent.requestedMode,
      adapterId: resolved.getModeId(),
      reason: requestedGate && !requestedGate.ok ? requestedGate.reason : undefined,
    })
  }

  const tierPolicy = evaluateTierPolicy({
    missionTier,
    groupId: intent.payload.groupId,
    actorRole: intent.actorRole,
    requestedMode: intent.requestedMode,
    resolvedMode: resolved.getModeId(),
    downgradeConfirmed,
    allowTier2Override,
    now: intent.createdAt,
  })

  if ("reason" in tierPolicy) {
    diagnostics.onTierPolicyBlocked?.({
      intent,
      missionTier,
      reason: tierPolicy.reason,
    })

    throw createGroupEngineError({
      code: GROUP_ENGINE_ERROR_CODE.POLICY_BLOCKED,
      message: tierPolicy.reason,
      retryable: false,
      details: {
        stage: "tier-policy",
        missionTier,
      },
    })
  }

  if (tierPolicy.overrideAuditEvent) {
    diagnostics.onTierOverride?.({
      intent,
      auditEvent: tierPolicy.overrideAuditEvent,
    })
  }

  const result = await resolved.publishControlAction(intent)

  if ("message" in result) {
    throw createGroupEngineError({
      code:
        result.code === "GROUP_TRANSPORT_CAPABILITY_BLOCKED"
          ? GROUP_ENGINE_ERROR_CODE.CAPABILITY_BLOCKED
          : result.code === "GROUP_TRANSPORT_VALIDATION_FAILED"
            ? GROUP_ENGINE_ERROR_CODE.INVALID_INPUT
            : result.code === "GROUP_TRANSPORT_UNSUPPORTED"
              ? GROUP_ENGINE_ERROR_CODE.ADAPTER_UNSUPPORTED
              : GROUP_ENGINE_ERROR_CODE.DISPATCH_FAILED,
      message: result.message,
      retryable: result.retryable,
      details: result.details,
    })
  }

  return result.value
}

export const dispatchGroupTransportAction = (
  action: Parameters<typeof createGroupTransportIntent>[0],
  payload: Parameters<typeof createGroupTransportIntent>[1],
  {
    actorRole,
    requestedMode,
    now,
    diagnostics,
    adapters: available,
    capabilitySnapshot,
    allowCapabilityFallback,
    missionTier,
    downgradeConfirmed,
    allowTier2Override,
  }: {
    actorRole: GroupMemberRole
    requestedMode?: GroupTransportIntent["requestedMode"]
    now?: number
    diagnostics?: GroupTransportDiagnostics
    adapters?: GroupTransport[]
    capabilitySnapshot?: {readiness?: "R0" | "R1" | "R2" | "R3" | "R4"; reasons?: string[]}
    allowCapabilityFallback?: boolean
    missionTier?: GroupMissionTier
    downgradeConfirmed?: boolean
    allowTier2Override?: boolean
  },
) =>
  dispatchGroupTransportIntent(
    createGroupTransportIntent(action, payload, {
      actorRole,
      requestedMode,
      now,
    }),
    diagnostics,
    available,
    {
      capabilitySnapshot,
      allowCapabilityFallback,
      missionTier,
      downgradeConfirmed,
      allowTier2Override,
    },
  )

const resolveGroupMessageTransportAdapter = (
  request: GroupTransportMessageRequest,
  available = adapters,
  capabilitySnapshot?: {readiness?: "R0" | "R1" | "R2" | "R3" | "R4"; reasons?: string[]},
): GroupTransport => {
  const resolved = available.find(
    adapter => adapter.canOperate({requestedMode: request.requestedMode, capabilitySnapshot}).ok,
  )

  return resolved || baselineGroupTransport
}

export const dispatchGroupTransportMessage = async (
  request: GroupTransportMessageRequest,
  diagnostics: GroupTransportMessageDiagnostics = {},
  available = adapters,
  {
    capabilitySnapshot,
    allowCapabilityFallback = true,
    missionTier = 0,
    downgradeConfirmed = false,
    allowTier2Override = false,
  }: {
    capabilitySnapshot?: {readiness?: "R0" | "R1" | "R2" | "R3" | "R4"; reasons?: string[]}
    allowCapabilityFallback?: boolean
    missionTier?: GroupMissionTier
    downgradeConfirmed?: boolean
    allowTier2Override?: boolean
  } = {},
): Promise<unknown> => {
  const normalizedGroupId = request.groupId.trim()
  const normalizedContent = request.content.trim()

  if (!normalizedGroupId || !normalizedContent) {
    throw createGroupEngineError({
      code: GROUP_ENGINE_ERROR_CODE.INVALID_INPUT,
      message: "Group transport message requires non-empty groupId and content.",
      retryable: false,
      details: {stage: "message-validation"},
    })
  }

  const normalizedRequest: GroupTransportMessageRequest = {
    ...request,
    groupId: normalizedGroupId,
    content: normalizedContent,
  }

  const requestedAdapter = available.find(
    adapter => adapter.getModeId() === normalizedRequest.requestedMode,
  )
  const requestedGate = requestedAdapter?.canOperate({
    requestedMode: normalizedRequest.requestedMode,
    capabilitySnapshot,
  })

  if (requestedAdapter && requestedGate && !requestedGate.ok && !allowCapabilityFallback) {
    diagnostics.onCapabilityBlocked?.({
      request: normalizedRequest,
      requestedMode: normalizedRequest.requestedMode,
      reason: requestedGate.reason,
    })

    throw createGroupEngineError({
      code: GROUP_ENGINE_ERROR_CODE.CAPABILITY_BLOCKED,
      message: `Capability gate blocked requested mode '${normalizedRequest.requestedMode}': ${requestedGate.reason || "unavailable"}`,
      retryable: false,
      details: {
        stage: "capability-gate",
        requestedMode: normalizedRequest.requestedMode,
        reason: requestedGate.reason,
      },
    })
  }

  const resolved = resolveGroupMessageTransportAdapter(
    normalizedRequest,
    available,
    capabilitySnapshot,
  )

  diagnostics.onResolved?.({request: normalizedRequest, adapterId: resolved.getModeId()})

  if (normalizedRequest.requestedMode !== resolved.getModeId()) {
    diagnostics.onFallback?.({
      request: normalizedRequest,
      requestedMode: normalizedRequest.requestedMode,
      adapterId: resolved.getModeId(),
      reason: requestedGate && !requestedGate.ok ? requestedGate.reason : undefined,
    })
  }

  const tierPolicy = evaluateTierPolicy({
    missionTier,
    groupId: normalizedRequest.groupId,
    actorRole: normalizedRequest.actorRole,
    requestedMode: normalizedRequest.requestedMode,
    resolvedMode: resolved.getModeId(),
    downgradeConfirmed,
    allowTier2Override,
    now: normalizedRequest.createdAt,
  })

  if ("reason" in tierPolicy) {
    diagnostics.onTierPolicyBlocked?.({
      request: normalizedRequest,
      missionTier,
      reason: tierPolicy.reason,
    })

    throw createGroupEngineError({
      code: GROUP_ENGINE_ERROR_CODE.POLICY_BLOCKED,
      message: tierPolicy.reason,
      retryable: false,
      details: {
        stage: "tier-policy",
        missionTier,
      },
    })
  }

  if (tierPolicy.overrideAuditEvent) {
    diagnostics.onTierOverride?.({
      request: normalizedRequest,
      auditEvent: tierPolicy.overrideAuditEvent,
    })
  }

  if (!resolved.sendMessage) {
    throw createGroupEngineError({
      code: GROUP_ENGINE_ERROR_CODE.ADAPTER_UNSUPPORTED,
      message: `Transport adapter '${resolved.getModeId()}' does not implement sendMessage.`,
      retryable: false,
      details: {
        stage: "adapter-contract",
        adapterId: resolved.getModeId(),
      },
    })
  }

  const result = await resolved.sendMessage({
    ...normalizedRequest,
    resolvedMode: resolved.getModeId(),
    missionTier,
    downgradeConfirmed,
    allowTier2Override,
  })

  if ("message" in result) {
    throw createGroupEngineError({
      code:
        result.code === "GROUP_TRANSPORT_CAPABILITY_BLOCKED"
          ? GROUP_ENGINE_ERROR_CODE.CAPABILITY_BLOCKED
          : result.code === "GROUP_TRANSPORT_VALIDATION_FAILED"
            ? GROUP_ENGINE_ERROR_CODE.INVALID_INPUT
            : result.code === "GROUP_TRANSPORT_UNSUPPORTED"
              ? GROUP_ENGINE_ERROR_CODE.ADAPTER_UNSUPPORTED
              : GROUP_ENGINE_ERROR_CODE.DISPATCH_FAILED,
      message: result.message,
      retryable: result.retryable,
      details: result.details,
    })
  }

  return result.value
}
