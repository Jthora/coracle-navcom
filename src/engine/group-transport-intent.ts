import type {GroupMemberRole} from "src/domain/group"
import type {
  GroupTransportControlAction,
  GroupTransportControlPayload,
  GroupTransportModeId,
} from "src/engine/group-transport-contracts"

export type GroupTransportIntentAction = GroupTransportControlAction

export type GroupTransportIntentPayload = GroupTransportControlPayload

export type GroupTransportIntent = {
  action: GroupTransportIntentAction
  payload: GroupTransportIntentPayload
  actorRole: GroupMemberRole
  requestedMode: GroupTransportModeId
  createdAt: number
}

export const GROUP_TRANSPORT_INTENT_REASON = {
  INVALID_GROUP_ID: "GROUP_TRANSPORT_INTENT_INVALID_GROUP_ID",
  INVALID_MEMBER_PUBKEY: "GROUP_TRANSPORT_INTENT_INVALID_MEMBER_PUBKEY",
} as const

export type GroupTransportIntentReasonCode =
  (typeof GROUP_TRANSPORT_INTENT_REASON)[keyof typeof GROUP_TRANSPORT_INTENT_REASON]

const PUBKEY_RE = /^[a-f0-9]{64}$/

export const createGroupTransportIntent = (
  action: GroupTransportIntentAction,
  payload: GroupTransportIntentPayload,
  {
    actorRole,
    requestedMode = "baseline-nip29",
    now = Math.floor(Date.now() / 1000),
  }: {
    actorRole: GroupMemberRole
    requestedMode?: GroupTransportModeId
    now?: number
  },
): GroupTransportIntent => ({
  action,
  payload,
  actorRole,
  requestedMode,
  createdAt: now,
})

export const validateGroupTransportIntent = (
  intent: GroupTransportIntent,
):
  | {ok: true}
  | {
      ok: false
      reason: GroupTransportIntentReasonCode
      message: string
    } => {
  if (!intent.payload.groupId?.trim()) {
    return {
      ok: false,
      reason: GROUP_TRANSPORT_INTENT_REASON.INVALID_GROUP_ID,
      message: "Group transport intent requires a non-empty group ID.",
    }
  }

  const needsMember =
    intent.action === "join" ||
    intent.action === "leave" ||
    intent.action === "put-member" ||
    intent.action === "remove-member"

  if (needsMember && intent.payload.memberPubkey && !PUBKEY_RE.test(intent.payload.memberPubkey)) {
    return {
      ok: false,
      reason: GROUP_TRANSPORT_INTENT_REASON.INVALID_MEMBER_PUBKEY,
      message: "Member pubkey must be a valid 64-char hex string.",
    }
  }

  return {ok: true}
}
