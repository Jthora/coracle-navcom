import {
  createGroupTransportIntent,
  validateGroupTransportIntent,
  type GroupTransportIntent,
} from "src/engine/group-transport-intent"
import {baselineGroupTransport} from "src/engine/group-transport-baseline"
import {securePilotGroupTransport} from "src/engine/group-transport-secure"
import type {GroupMemberRole} from "src/domain/group"
import {
  type GroupTransport,
  type GroupTransportDiagnostics,
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
    const {message} = validation

    throw new Error(message)
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

    throw new Error(
      `Capability gate blocked requested mode '${intent.requestedMode}': ${requestedGate.reason || "unavailable"}`,
    )
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

    throw new Error(tierPolicy.reason)
  }

  if (tierPolicy.overrideAuditEvent) {
    diagnostics.onTierOverride?.({
      intent,
      auditEvent: tierPolicy.overrideAuditEvent,
    })
  }

  const result = await resolved.publishControlAction(intent)

  if ("message" in result) {
    throw new Error(result.message)
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
