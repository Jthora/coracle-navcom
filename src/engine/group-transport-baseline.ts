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
  type GroupTransport,
} from "src/engine/group-transport-contracts"

const publishGroupTemplate = (template: Parameters<typeof makeEvent>[1] & {kind: number}) =>
  publishThunk({
    event: makeEvent(template.kind, template),
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
  })

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
    ok: requestedMode === "baseline-nip29" || requestedMode === "secure-nip-ee",
    reason:
      requestedMode === "baseline-nip29" || requestedMode === "secure-nip-ee"
        ? undefined
        : "Unsupported mode for baseline adapter",
  }),
  publishControlAction,
  sendMessage: async () =>
    errTransportResult(
      "GROUP_TRANSPORT_UNSUPPORTED",
      "Baseline adapter does not implement sendMessage yet.",
      false,
    ),
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
