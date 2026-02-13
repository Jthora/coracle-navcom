import {pubkey, sendWrapped} from "@welshman/app"
import {Router, addMaximalFallbacks} from "@welshman/router"
import {uniq} from "@welshman/lib"
import {makeEvent} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {GROUP_KINDS} from "src/domain/group-kinds"
import {myRequest, getClientTags} from "src/engine/state"
import {prepareSecureGroupKeyUse} from "src/engine/group-key-lifecycle"
import {
  scheduleSecureGroupKeyRotationIfNeeded,
  scheduleSecureGroupMembershipTriggeredRotation,
} from "src/engine/group-key-rotation-service"
import {applyGroupTransportProjectionEvents} from "src/engine/group-transport-projection"
import {
  errTransportResult,
  okTransportResult,
  type GroupTransportResult,
  type GroupTransportSubscribeHandlers,
  type GroupTransportSubscription,
} from "src/engine/group-transport-contracts"

export type SecureGroupSendInput = {
  groupId: string
  content: string
  recipients: string[]
  delay?: number
}

export type SecureGroupSubscribeInput = {
  groupId: string
  cursor?: string | number
  relays?: string[]
}

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter(v => typeof v === "string") : []

export const parseSecureGroupSendInput = (input: unknown): SecureGroupSendInput | null => {
  if (!input || typeof input !== "object") return null

  const candidate = input as Record<string, unknown>
  const groupId = typeof candidate.groupId === "string" ? candidate.groupId.trim() : ""
  const content = typeof candidate.content === "string" ? candidate.content : ""
  const recipients = asStringArray(candidate.recipients)
  const delay = typeof candidate.delay === "number" ? candidate.delay : 0

  if (!groupId || !content || recipients.length === 0) return null

  return {groupId, content, recipients, delay}
}

export const parseSecureGroupSubscribeInput = (
  input: unknown,
): SecureGroupSubscribeInput | null => {
  if (!input || typeof input !== "object") return null

  const candidate = input as Record<string, unknown>
  const groupId = typeof candidate.groupId === "string" ? candidate.groupId.trim() : ""

  if (!groupId) return null

  return {
    groupId,
    cursor:
      typeof candidate.cursor === "number" || typeof candidate.cursor === "string"
        ? candidate.cursor
        : undefined,
    relays: asStringArray(candidate.relays),
  }
}

export const buildSecureSubscribeFilters = ({
  groupId,
  cursor,
}: {
  groupId: string
  cursor?: string | number
}) => [
  {
    kinds: [GROUP_KINDS.NIP_EE.GROUP_EVENT, GROUP_KINDS.NIP_EE.WELCOME],
    "#h": [groupId],
    ...(typeof cursor === "number" ? {since: cursor} : {}),
  },
]

export const sendSecureGroupMessage = async (
  input: SecureGroupSendInput,
): Promise<GroupTransportResult<unknown>> => {
  const keyUse = prepareSecureGroupKeyUse({groupId: input.groupId, action: "send"})

  if (!keyUse.ok && "reason" in keyUse) {
    return errTransportResult(
      "GROUP_TRANSPORT_CAPABILITY_BLOCKED",
      `Secure key lifecycle blocked send: ${keyUse.reason}`,
      false,
    )
  }

  scheduleSecureGroupKeyRotationIfNeeded({
    groupId: input.groupId,
    keyState: keyUse.state,
    trigger: "schedule",
  })

  try {
    const recipients = uniq(input.recipients.concat(pubkey.get()).filter(Boolean))

    const result = await sendWrapped({
      delay: input.delay || 0,
      recipients,
      event: makeEvent(GROUP_KINDS.NIP_EE.GROUP_EVENT, {
        content: input.content,
        tags: [
          ["h", input.groupId],
          ...recipients.filter(p => p !== pubkey.get()).map(p => ["p", p]),
          ...getClientTags(),
        ],
      }),
    })

    return okTransportResult(result)
  } catch (error) {
    return errTransportResult(
      "GROUP_TRANSPORT_DISPATCH_FAILED",
      "Failed to send secure group message.",
      true,
      error,
    )
  }
}

export const subscribeSecureGroupEvents = async (
  input: SecureGroupSubscribeInput,
  handlers: GroupTransportSubscribeHandlers,
): Promise<GroupTransportResult<GroupTransportSubscription>> => {
  const keyUse = prepareSecureGroupKeyUse({groupId: input.groupId, action: "subscribe"})

  if (!keyUse.ok && "reason" in keyUse) {
    return errTransportResult(
      "GROUP_TRANSPORT_CAPABILITY_BLOCKED",
      `Secure key lifecycle blocked subscribe: ${keyUse.reason}`,
      false,
    )
  }

  scheduleSecureGroupKeyRotationIfNeeded({
    groupId: input.groupId,
    keyState: keyUse.state,
    trigger: "schedule",
  })

  try {
    const controller = new AbortController()
    const relays =
      input.relays && input.relays.length > 0
        ? input.relays
        : Router.get().FromUser().policy(addMaximalFallbacks).getUrls()

    myRequest({
      skipCache: true,
      signal: controller.signal,
      relays,
      filters: buildSecureSubscribeFilters({groupId: input.groupId, cursor: input.cursor}),
      onEvent: event => handlers.onEvent(event),
    })

    return okTransportResult({
      unsubscribe: () => controller.abort(),
    })
  } catch (error) {
    handlers.onError?.(error)

    return errTransportResult(
      "GROUP_TRANSPORT_DISPATCH_FAILED",
      "Failed to start secure group subscription.",
      true,
      error,
    )
  }
}

export const reconcileSecureGroupEvents = async ({
  groupId,
  remoteEvents,
  localState,
}: {
  groupId: string
  remoteEvents: unknown[]
  localState?: unknown
}): Promise<GroupTransportResult<unknown>> => {
  const keyUse = prepareSecureGroupKeyUse({groupId, action: "reconcile"})

  if (!keyUse.ok && "reason" in keyUse) {
    return errTransportResult(
      "GROUP_TRANSPORT_CAPABILITY_BLOCKED",
      `Secure key lifecycle blocked reconcile: ${keyUse.reason}`,
      false,
    )
  }

  scheduleSecureGroupKeyRotationIfNeeded({
    groupId,
    keyState: keyUse.state,
    trigger: "schedule",
  })

  if (!localState || typeof localState !== "object") {
    return errTransportResult(
      "GROUP_TRANSPORT_VALIDATION_FAILED",
      "Local projection state is required to reconcile secure group events.",
      false,
    )
  }

  const projection = localState as any

  if (projection?.group?.id !== groupId) {
    return errTransportResult(
      "GROUP_TRANSPORT_VALIDATION_FAILED",
      "Projection group mismatch during secure reconcile.",
      false,
    )
  }

  const trustedEvents = remoteEvents.filter(event =>
    Boolean(event && typeof event === "object"),
  ) as TrustedEvent[]

  scheduleSecureGroupMembershipTriggeredRotation({
    groupId,
    keyState: keyUse.state,
    remoteEvents: trustedEvents,
  })

  return okTransportResult(applyGroupTransportProjectionEvents(projection, trustedEvents))
}
