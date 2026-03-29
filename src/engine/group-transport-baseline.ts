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
import {GROUP_KINDS} from "src/domain/group-kinds"
import {
  errTransportResult,
  okTransportResult,
  type GroupTransport,
} from "src/engine/group-transport-contracts"

const publishGroupTemplate = (template: Parameters<typeof makeEvent>[1] & {kind: number}) =>
  publishThunk({
    event: makeEvent(template.kind, template),
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })

const sendMessage: GroupTransport["sendMessage"] = async input => {
  if (!input || typeof input !== "object") {
    return errTransportResult(
      "GROUP_TRANSPORT_VALIDATION_FAILED",
      "Invalid baseline send payload.",
      false,
    )
  }

  const candidate = input as Record<string, unknown>
  const groupId = typeof candidate.groupId === "string" ? candidate.groupId.trim() : ""
  const content = typeof candidate.content === "string" ? candidate.content.trim() : ""

  if (!groupId || !content) {
    return errTransportResult(
      "GROUP_TRANSPORT_VALIDATION_FAILED",
      "Baseline send requires non-empty groupId and content.",
      false,
    )
  }

  const delay = typeof candidate.delay === "number" ? candidate.delay : 0
  const extraTags = Array.isArray(candidate.extraTags) ? candidate.extraTags : []

  const value = await publishThunk({
    delay,
    event: makeEvent(GROUP_KINDS.NIP_EE.GROUP_EVENT, {
      content,
      tags: [["h", groupId], ...extraTags],
    }),
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })

  return okTransportResult(value)
}

const publishControlAction: GroupTransport["publishControlAction"] = async request => {
  const {action, payload} = request

  if (action === "create") {
    return okTransportResult(
      await publishGroupTemplate(
        buildGroupCreateTemplate({
          groupId: payload.groupId,
          title: payload.title,
          description: payload.description,
          picture: payload.picture,
        }),
      ),
    )
  }

  if (action === "join") {
    return okTransportResult(
      await publishGroupTemplate(
        buildGroupJoinTemplate({
          groupId: payload.groupId,
          memberPubkey: payload.memberPubkey!,
          reason: payload.reason,
        }),
      ),
    )
  }

  if (action === "leave") {
    return okTransportResult(
      await publishGroupTemplate(
        buildGroupLeaveTemplate({
          groupId: payload.groupId,
          memberPubkey: payload.memberPubkey!,
          reason: payload.reason,
        }),
      ),
    )
  }

  if (action === "put-member") {
    return okTransportResult(
      await publishGroupTemplate(
        buildGroupPutMemberTemplate({
          groupId: payload.groupId,
          memberPubkey: payload.memberPubkey!,
          role: payload.role,
          reason: payload.reason,
        }),
      ),
    )
  }

  if (action === "remove-member") {
    return okTransportResult(
      await publishGroupTemplate(
        buildGroupRemoveMemberTemplate({
          groupId: payload.groupId,
          memberPubkey: payload.memberPubkey!,
          reason: payload.reason,
        }),
      ),
    )
  }

  return okTransportResult(
    await publishGroupTemplate(
      buildGroupMetadataEditTemplate({
        groupId: payload.groupId,
        title: payload.title,
        description: payload.description,
        picture: payload.picture,
        reason: payload.reason,
      }),
    ),
  )
}

export const baselineGroupTransport: GroupTransport = {
  getModeId: () => "baseline-nip29",
  start: () => {},
  stop: () => {},
  canOperate: ({requestedMode}) => ({
    ok: requestedMode === "baseline-nip29",
    reason:
      requestedMode === "baseline-nip29"
        ? undefined
        : `Baseline adapter does not handle ${requestedMode}. Use the secure adapter.`,
  }),
  publishControlAction,
  sendMessage,
  subscribe: async () =>
    errTransportResult(
      "GROUP_TRANSPORT_UNSUPPORTED",
      "Baseline adapter does not implement subscribe yet.",
      false,
    ),
  reconcile: async () =>
    errTransportResult(
      "GROUP_TRANSPORT_UNSUPPORTED",
      "Baseline adapter does not implement reconcile yet.",
      false,
    ),
}
