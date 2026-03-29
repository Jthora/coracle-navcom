import {pubkey} from "@welshman/app"
import {canPerformGroupControlAction} from "src/domain/group-control"
import {
  mapGroupCommandError,
  normalizeGroupCommandAck,
  toGroupCommandUiMessage,
  withGroupCommandRetry,
  type GroupCommandOutcome,
} from "src/domain/group-command-feedback"
import type {GroupMemberRole} from "src/domain/group"
import {GROUP_ENGINE_ERROR_CODE, createGroupEngineError} from "src/domain/group-engine-error"
import {dispatchGroupTransportAction} from "src/engine/group-transport"
import {dispatchGroupTransportMessage} from "src/engine/group-transport"
import type {GroupTransportModeId} from "src/engine/group-transport-contracts"
import {recordGroupDowngradeAudit} from "src/engine/group-downgrade-audit"
import {
  remediateCompromisedDevice,
  type CompromisedDeviceRemediationResult,
} from "src/engine/group-compromise-remediation"
import {
  revokeCompromisedDeviceForGroup,
  type RevokeCompromisedDeviceResult,
} from "src/engine/group-key-revocation"

export const createGroupCommandTransportDiagnostics = () => ({
  onResolved: () => {},
  onFallback: (input: {
    intent: {payload: {groupId: string}; actorRole: string; createdAt: number}
    requestedMode: string
    adapterId: string
    reason?: string
  }) => {
    if (input.requestedMode !== "secure-nip-ee" || input.adapterId === "secure-nip-ee") {
      return
    }

    recordGroupDowngradeAudit({
      groupId: input.intent.payload.groupId,
      action: "transport-downgrade",
      actor: input.intent.actorRole,
      createdAt: input.intent.createdAt,
      requestedMode: input.requestedMode,
      resolvedMode: input.adapterId,
      reason: input.reason,
    })
  },
})

const ensureAllowed = (
  actorRole: GroupMemberRole,
  action: Parameters<typeof canPerformGroupControlAction>[1],
) => {
  if (!canPerformGroupControlAction(actorRole, action)) {
    throw createGroupEngineError({
      code: GROUP_ENGINE_ERROR_CODE.PERMISSION_DENIED,
      message: `Permission denied for action: ${action}`,
      retryable: false,
      details: {
        actorRole,
        action,
      },
    })
  }
}

export const publishGroupCreate = async (
  {
    groupId,
    title,
    description,
    picture,
  }: {groupId: string; title?: string; description?: string; picture?: string},
  actorRole: GroupMemberRole = "admin",
  {
    requestedMode,
    allowCapabilityFallback,
    missionTier,
    downgradeConfirmed,
    allowTier2Override,
  }: {
    requestedMode?: GroupTransportModeId
    allowCapabilityFallback?: boolean
    missionTier?: 0 | 1 | 2
    downgradeConfirmed?: boolean
    allowTier2Override?: boolean
  } = {},
) => {
  ensureAllowed(actorRole, "create")

  return dispatchGroupTransportAction(
    "create",
    {groupId, title, description, picture},
    {
      actorRole,
      requestedMode,
      allowCapabilityFallback,
      missionTier,
      downgradeConfirmed,
      allowTier2Override,
      diagnostics: createGroupCommandTransportDiagnostics(),
    },
  )
}

export const publishGroupCreateWithAck = async (
  {
    groupId,
    title,
    description,
    picture,
  }: {groupId: string; title?: string; description?: string; picture?: string},
  actorRole: GroupMemberRole = "admin",
  {
    requestedMode,
    allowCapabilityFallback,
    missionTier,
    downgradeConfirmed,
    allowTier2Override,
  }: {
    requestedMode?: GroupTransportModeId
    allowCapabilityFallback?: boolean
    missionTier?: 0 | 1 | 2
    downgradeConfirmed?: boolean
    allowTier2Override?: boolean
  } = {},
): Promise<GroupCommandOutcome<unknown>> => {
  try {
    const value = await publishGroupCreate({groupId, title, description, picture}, actorRole, {
      requestedMode,
      allowCapabilityFallback,
      missionTier,
      downgradeConfirmed,
      allowTier2Override,
    })

    return {
      ok: true,
      ack: normalizeGroupCommandAck(value),
      value,
    }
  } catch (error) {
    return mapGroupCommandError(error)
  }
}

export const publishGroupCreateWithRecovery = async (
  params: {groupId: string; title?: string; description?: string; picture?: string},
  actorRole: GroupMemberRole = "admin",
  retries = 1,
  {
    requestedMode,
    allowCapabilityFallback,
    missionTier,
    downgradeConfirmed,
    allowTier2Override,
  }: {
    requestedMode?: GroupTransportModeId
    allowCapabilityFallback?: boolean
    missionTier?: 0 | 1 | 2
    downgradeConfirmed?: boolean
    allowTier2Override?: boolean
  } = {},
) =>
  withGroupCommandRetry(
    () =>
      publishGroupCreateWithAck(params, actorRole, {
        requestedMode,
        allowCapabilityFallback,
        missionTier,
        downgradeConfirmed,
        allowTier2Override,
      }),
    retries,
  )

export const getGroupCreateRecoveryMessage = (result: GroupCommandOutcome<unknown>) => {
  if ("reason" in result) {
    return toGroupCommandUiMessage(result.reason)
  }

  return result.ack.ok
    ? `Group created with ${result.ack.ackCount} relay acknowledgements.`
    : "Group created, awaiting relay acknowledgements."
}

export const publishGroupJoin = async (
  {
    groupId,
    memberPubkey = pubkey.get(),
    reason,
  }: {groupId: string; memberPubkey?: string; reason?: string},
  actorRole: GroupMemberRole = "member",
  {
    requestedMode,
    allowCapabilityFallback,
    missionTier,
    downgradeConfirmed,
    allowTier2Override,
  }: {
    requestedMode?: GroupTransportModeId
    allowCapabilityFallback?: boolean
    missionTier?: 0 | 1 | 2
    downgradeConfirmed?: boolean
    allowTier2Override?: boolean
  } = {},
) => {
  ensureAllowed(actorRole, "join")

  return dispatchGroupTransportAction(
    "join",
    {groupId, memberPubkey, reason},
    {
      actorRole,
      requestedMode,
      allowCapabilityFallback,
      missionTier,
      downgradeConfirmed,
      allowTier2Override,
      diagnostics: createGroupCommandTransportDiagnostics(),
    },
  )
}

export const publishGroupLeave = async (
  {
    groupId,
    memberPubkey = pubkey.get(),
    reason,
  }: {groupId: string; memberPubkey?: string; reason?: string},
  actorRole: GroupMemberRole = "member",
) => {
  ensureAllowed(actorRole, "leave")

  return dispatchGroupTransportAction(
    "leave",
    {groupId, memberPubkey, reason},
    {actorRole, diagnostics: createGroupCommandTransportDiagnostics()},
  )
}

export const publishGroupPutMember = async (
  {
    groupId,
    memberPubkey,
    role,
    reason,
  }: {groupId: string; memberPubkey: string; role?: GroupMemberRole; reason?: string},
  actorRole: GroupMemberRole = "admin",
) => {
  ensureAllowed(actorRole, "put-member")

  return dispatchGroupTransportAction(
    "put-member",
    {groupId, memberPubkey, role, reason},
    {actorRole, diagnostics: createGroupCommandTransportDiagnostics()},
  )
}

export const publishGroupRemoveMember = async (
  {groupId, memberPubkey, reason}: {groupId: string; memberPubkey: string; reason?: string},
  actorRole: GroupMemberRole = "moderator",
) => {
  ensureAllowed(actorRole, "remove-member")

  return dispatchGroupTransportAction(
    "remove-member",
    {groupId, memberPubkey, reason},
    {actorRole, diagnostics: createGroupCommandTransportDiagnostics()},
  )
}

export const publishGroupMetadataEdit = async (
  {
    groupId,
    title,
    description,
    picture,
    reason,
  }: {
    groupId: string
    title?: string
    description?: string
    picture?: string
    reason?: string
  },
  actorRole: GroupMemberRole = "admin",
) => {
  ensureAllowed(actorRole, "edit-metadata")

  return dispatchGroupTransportAction(
    "edit-metadata",
    {groupId, title, description, picture, reason},
    {actorRole, diagnostics: createGroupCommandTransportDiagnostics()},
  )
}

export const publishGroupCompromisedDeviceRevocation = async (
  {
    groupId,
    compromisedPubkey,
    reason,
  }: {
    groupId: string
    compromisedPubkey: string
    reason?: string
  },
  actorRole: GroupMemberRole = "admin",
): Promise<RevokeCompromisedDeviceResult> => {
  ensureAllowed(actorRole, "remove-member")

  await publishGroupRemoveMember(
    {
      groupId,
      memberPubkey: compromisedPubkey,
      reason: reason || "compromised-device",
    },
    actorRole,
  )

  return revokeCompromisedDeviceForGroup({
    groupId,
    compromisedPubkey,
    actorRole,
    reason,
  })
}

export const publishGroupCompromisedDeviceRemediation = async (
  {
    groupId,
    compromisedPubkey,
    reason,
  }: {
    groupId: string
    compromisedPubkey: string
    reason?: string
  },
  actorRole: GroupMemberRole = "admin",
): Promise<CompromisedDeviceRemediationResult> => {
  ensureAllowed(actorRole, "remove-member")

  return remediateCompromisedDevice({
    groupId,
    compromisedPubkey,
    actorRole,
    reason,
    enforceMembershipRemediation: async (input, role) => {
      await publishGroupRemoveMember(
        {
          groupId: input.groupId,
          memberPubkey: input.compromisedPubkey,
          reason: input.reason,
        },
        role,
      )
    },
  })
}

export const publishGroupMessage = async ({
  groupId,
  content,
  requestedMode = "baseline-nip29",
  recipients,
  localState,
  missionTier,
  actorRole = "member",
  downgradeConfirmed = false,
  allowTier2Override = false,
  extraTags,
}: {
  groupId: string
  content: string
  requestedMode?: GroupTransportModeId
  recipients?: string[]
  localState?: unknown
  missionTier?: 0 | 1 | 2
  actorRole?: GroupMemberRole
  downgradeConfirmed?: boolean
  allowTier2Override?: boolean
  extraTags?: string[][]
}) => {
  const normalizedGroupId = groupId.trim()
  const normalizedContent = content.trim()

  if (!normalizedGroupId) {
    throw createGroupEngineError({
      code: GROUP_ENGINE_ERROR_CODE.INVALID_INPUT,
      message: "Invalid group address.",
      retryable: false,
      details: {
        field: "groupId",
      },
    })
  }

  if (!normalizedContent) {
    throw createGroupEngineError({
      code: GROUP_ENGINE_ERROR_CODE.INVALID_INPUT,
      message: "Message content cannot be empty.",
      retryable: false,
      details: {
        field: "content",
      },
    })
  }

  return dispatchGroupTransportMessage(
    {
      groupId: normalizedGroupId,
      content: normalizedContent,
      requestedMode,
      actorRole,
      createdAt: Math.floor(Date.now() / 1000),
      recipients,
      localState,
      missionTier,
      downgradeConfirmed,
      allowTier2Override,
      extraTags,
    },
    {
      onFallback: input => {
        if (input.requestedMode !== "secure-nip-ee" || input.adapterId === "secure-nip-ee") {
          return
        }

        recordGroupDowngradeAudit({
          groupId: input.request.groupId,
          action: "transport-downgrade",
          actor: input.request.actorRole,
          createdAt: input.request.createdAt,
          requestedMode: input.request.requestedMode,
          resolvedMode: input.adapterId,
          reason: input.reason,
        })
      },
    },
  )
}
