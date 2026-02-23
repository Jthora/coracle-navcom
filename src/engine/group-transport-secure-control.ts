import {publishThunk} from "@welshman/app"
import {makeEvent} from "@welshman/util"
import {Router, addMaximalFallbacks} from "@welshman/router"
import {
  buildGroupCreateTemplate,
  buildGroupJoinTemplate,
  buildGroupLeaveTemplate,
  buildGroupMetadataEditTemplate,
  buildGroupPutMemberTemplate,
  buildGroupRemoveMemberTemplate,
} from "src/domain/group-control"
import {
  errTransportResult,
  okTransportResult,
  type GroupTransportControlRequest,
  type GroupTransportResult,
} from "src/engine/group-transport-contracts"

export const GROUP_SECURE_CONTROL_REASON = {
  INVALID_SHAPE: "GROUP_SECURE_CONTROL_INVALID_SHAPE",
  GROUP_ID_REQUIRED: "GROUP_SECURE_CONTROL_GROUP_ID_REQUIRED",
  MEMBER_PUBKEY_REQUIRED: "GROUP_SECURE_CONTROL_MEMBER_PUBKEY_REQUIRED",
} as const

export type GroupSecureControlReasonCode =
  (typeof GROUP_SECURE_CONTROL_REASON)[keyof typeof GROUP_SECURE_CONTROL_REASON]

export type ParseSecureControlRequestResult =
  | {
      ok: true
      value: GroupTransportControlRequest
    }
  | {
      ok: false
      reason: GroupSecureControlReasonCode
      message: string
    }

const requiresMemberPubkey = (action: GroupTransportControlRequest["action"]) =>
  action === "join" || action === "leave" || action === "put-member" || action === "remove-member"

export const parseSecureControlRequestResult = (
  request: unknown,
): ParseSecureControlRequestResult => {
  if (!request || typeof request !== "object") {
    return {
      ok: false,
      reason: GROUP_SECURE_CONTROL_REASON.INVALID_SHAPE,
      message: "Invalid secure control payload shape.",
    }
  }

  const candidate = request as GroupTransportControlRequest
  const payload = candidate.payload || ({} as GroupTransportControlRequest["payload"])
  const groupId = typeof payload.groupId === "string" ? payload.groupId.trim() : ""

  if (!groupId) {
    return {
      ok: false,
      reason: GROUP_SECURE_CONTROL_REASON.GROUP_ID_REQUIRED,
      message: "Secure control action requires a non-empty group ID.",
    }
  }

  const memberPubkey =
    typeof payload.memberPubkey === "string" ? payload.memberPubkey.trim() : undefined

  if (requiresMemberPubkey(candidate.action) && !memberPubkey) {
    return {
      ok: false,
      reason: GROUP_SECURE_CONTROL_REASON.MEMBER_PUBKEY_REQUIRED,
      message: `Secure control action '${candidate.action}' requires member pubkey.`,
    }
  }

  return {
    ok: true,
    value: {
      ...candidate,
      payload: {
        ...payload,
        groupId,
        memberPubkey,
      },
    },
  }
}

export const buildSecureControlTemplate = (request: GroupTransportControlRequest) => {
  const {action, payload} = request

  if (action === "create") {
    return buildGroupCreateTemplate({
      groupId: payload.groupId,
      title: payload.title,
      description: payload.description,
      picture: payload.picture,
    })
  }

  if (action === "join") {
    return buildGroupJoinTemplate({
      groupId: payload.groupId,
      memberPubkey: payload.memberPubkey!,
      reason: payload.reason,
    })
  }

  if (action === "leave") {
    return buildGroupLeaveTemplate({
      groupId: payload.groupId,
      memberPubkey: payload.memberPubkey!,
      reason: payload.reason,
    })
  }

  if (action === "put-member") {
    return buildGroupPutMemberTemplate({
      groupId: payload.groupId,
      memberPubkey: payload.memberPubkey!,
      role: payload.role,
      reason: payload.reason,
    })
  }

  if (action === "remove-member") {
    return buildGroupRemoveMemberTemplate({
      groupId: payload.groupId,
      memberPubkey: payload.memberPubkey!,
      reason: payload.reason,
    })
  }

  return buildGroupMetadataEditTemplate({
    groupId: payload.groupId,
    title: payload.title,
    description: payload.description,
    picture: payload.picture,
    reason: payload.reason,
  })
}

export const publishSecureControlAction = async (
  request: GroupTransportControlRequest,
): Promise<GroupTransportResult<unknown>> => {
  const parsed = parseSecureControlRequestResult(request)

  if (parsed.ok === false) {
    return errTransportResult("GROUP_TRANSPORT_VALIDATION_FAILED", parsed.message, false)
  }

  try {
    const template = buildSecureControlTemplate(parsed.value)
    const value = await publishThunk({
      event: makeEvent(template.kind, template),
      relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
    })

    return okTransportResult(value)
  } catch (error) {
    return errTransportResult(
      "GROUP_TRANSPORT_DISPATCH_FAILED",
      "Failed to publish secure control action.",
      true,
      error,
    )
  }
}
