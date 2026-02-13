import {pubkey} from "@welshman/app"
import {publishThunk} from "@welshman/app"
import {makeEvent} from "@welshman/util"
import {Router, addMaximalFallbacks} from "@welshman/router"
import {canPerformGroupControlAction} from "src/domain/group-control"
import {GROUP_KINDS} from "src/domain/group-kinds"
import {
  mapGroupCommandError,
  normalizeGroupCommandAck,
  toGroupCommandUiMessage,
  withGroupCommandRetry,
  type GroupCommandOutcome,
} from "src/domain/group-command-feedback"
import type {GroupMemberRole} from "src/domain/group"
import {dispatchGroupTransportAction} from "src/engine/group-transport"
import {
  remediateCompromisedDevice,
  type CompromisedDeviceRemediationResult,
} from "src/engine/group-compromise-remediation"
import {
  revokeCompromisedDeviceForGroup,
  type RevokeCompromisedDeviceResult,
} from "src/engine/group-key-revocation"

const createDiagnostics = () => ({
  onResolved: () => {},
  onFallback: () => {},
})

const ensureAllowed = (
  actorRole: GroupMemberRole,
  action: Parameters<typeof canPerformGroupControlAction>[1],
) => {
  if (!canPerformGroupControlAction(actorRole, action)) {
    throw new Error(`Permission denied for action: ${action}`)
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
) => {
  ensureAllowed(actorRole, "create")

  return dispatchGroupTransportAction(
    "create",
    {groupId, title, description, picture},
    {actorRole, diagnostics: createDiagnostics()},
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
): Promise<GroupCommandOutcome<unknown>> => {
  try {
    const value = await publishGroupCreate({groupId, title, description, picture}, actorRole)

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
) => withGroupCommandRetry(() => publishGroupCreateWithAck(params, actorRole), retries)

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
) => {
  ensureAllowed(actorRole, "join")

  return dispatchGroupTransportAction(
    "join",
    {groupId, memberPubkey, reason},
    {actorRole, diagnostics: createDiagnostics()},
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
    {actorRole, diagnostics: createDiagnostics()},
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
    {actorRole, diagnostics: createDiagnostics()},
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
    {actorRole, diagnostics: createDiagnostics()},
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
    {actorRole, diagnostics: createDiagnostics()},
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
}: {
  groupId: string
  content: string
}) => {
  const normalizedGroupId = groupId.trim()
  const normalizedContent = content.trim()

  if (!normalizedGroupId) {
    throw new Error("Invalid group address.")
  }

  if (!normalizedContent) {
    throw new Error("Message content cannot be empty.")
  }

  return publishThunk({
    event: makeEvent(GROUP_KINDS.NIP_EE.GROUP_EVENT, {
      content: normalizedContent,
      tags: [["h", normalizedGroupId]],
    }),
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })
}
