import {pubkey, sendWrapped} from "@welshman/app"
import {Router, addMaximalFallbacks} from "@welshman/router"
import {uniq} from "@welshman/lib"
import {makeEvent} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {GROUP_KINDS} from "src/domain/group-kinds"
import {myRequest, getClientTags} from "src/engine/state"
import {prepareSecureGroupKeyUse} from "src/engine/group-key-lifecycle"
import {
  advanceSecureGroupEpochState,
  ensureSecureGroupEpochState,
} from "src/engine/group-epoch-state"
import {
  validateGroupMessageEpochForReceive,
  withGroupMessageEpochTag,
} from "src/engine/group-epoch-message"
import {encodeSecureGroupEpochContent} from "src/engine/group-epoch-content"
import {validateAndDecryptSecureGroupEventContent} from "src/engine/group-epoch-decrypt"
import {repairSecureGroupEpochStateFromEvents} from "src/engine/group-epoch-reconcile"
import {collectGroupMembershipRemovalPubkeys} from "src/engine/group-membership-events"
import {validateRemovedMemberWrapExclusion} from "src/engine/group-wrap-exclusion"
import {
  buildSecureGroupWrapTags,
  resolveEligibleSecureWrapRecipients,
} from "src/engine/group-wrap-recipients"
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
import {evaluateSecureGroupSendTierPolicy} from "src/engine/group-transport-secure-tier"
import type {GroupMissionTier} from "src/engine/group-tier-policy"

export type SecureGroupSendInput = {
  groupId: string
  content: string
  recipients: string[]
  delay?: number
  localState?: unknown
  missionTier?: GroupMissionTier
  actorRole?: string
  requestedMode?: string
  resolvedMode?: string
  downgradeConfirmed?: boolean
  allowTier2Override?: boolean
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
  const missionTier =
    candidate.missionTier === 0 || candidate.missionTier === 1 || candidate.missionTier === 2
      ? candidate.missionTier
      : undefined
  const actorRole = typeof candidate.actorRole === "string" ? candidate.actorRole : undefined
  const requestedMode =
    typeof candidate.requestedMode === "string" ? candidate.requestedMode : undefined
  const resolvedMode =
    typeof candidate.resolvedMode === "string" ? candidate.resolvedMode : undefined
  const downgradeConfirmed =
    typeof candidate.downgradeConfirmed === "boolean" ? candidate.downgradeConfirmed : undefined
  const allowTier2Override =
    typeof candidate.allowTier2Override === "boolean" ? candidate.allowTier2Override : undefined

  if (!groupId || !content || recipients.length === 0) return null

  return {
    groupId,
    content,
    recipients,
    delay,
    localState: candidate.localState,
    missionTier,
    actorRole,
    requestedMode,
    resolvedMode,
    downgradeConfirmed,
    allowTier2Override,
  }
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
  const tierPolicy = evaluateSecureGroupSendTierPolicy({
    groupId: input.groupId,
    missionTier: input.missionTier,
    actorRole: input.actorRole,
    requestedMode: input.requestedMode,
    resolvedMode: input.resolvedMode,
    downgradeConfirmed: input.downgradeConfirmed,
    allowTier2Override: input.allowTier2Override,
  })

  if (!tierPolicy.ok) {
    return errTransportResult("GROUP_TRANSPORT_CAPABILITY_BLOCKED", tierPolicy.reason, false)
  }

  const epochState = ensureSecureGroupEpochState(input.groupId)

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
    const senderPubkey = pubkey.get()

    const recipientResolution = resolveEligibleSecureWrapRecipients({
      recipients: uniq(input.recipients.concat(senderPubkey).filter(Boolean)),
      senderPubkey,
      projection:
        input.localState && typeof input.localState === "object" ? (input.localState as any) : null,
    })

    if (recipientResolution.eligibleRecipients.length === 0) {
      return errTransportResult(
        "GROUP_TRANSPORT_VALIDATION_FAILED",
        "Secure group send requires at least one eligible recipient.",
        false,
      )
    }

    const encodedContent = encodeSecureGroupEpochContent({
      groupId: input.groupId,
      epochId: epochState.epochId,
      plaintext: input.content,
      senderPubkey,
      recipients: recipientResolution.eligibleRecipients,
    })

    if (!encodedContent.ok) {
      return errTransportResult("GROUP_TRANSPORT_VALIDATION_FAILED", encodedContent.message, false)
    }

    const result = await sendWrapped({
      delay: input.delay || 0,
      recipients: recipientResolution.eligibleRecipients,
      event: makeEvent(GROUP_KINDS.NIP_EE.GROUP_EVENT, {
        content: encodedContent.content,
        tags: withGroupMessageEpochTag({
          epochId: epochState.epochId,
          tags: [
            ["h", input.groupId],
            ...buildSecureGroupWrapTags({
              groupId: input.groupId,
              epochId: epochState.epochId,
              recipients: recipientResolution.eligibleRecipients,
              senderPubkey,
            }),
            ...getClientTags(),
          ],
        }),
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
  ensureSecureGroupEpochState(input.groupId)

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

const findInvalidEpochValidation = ({
  events,
  expectedEpochId,
}: {
  events: TrustedEvent[]
  expectedEpochId: string
}) =>
  events
    .map(event => validateGroupMessageEpochForReceive({event, expectedEpochId}))
    .find(result => !result.ok)

const findInvalidContentValidation = ({
  events,
  expectedEpochId,
}: {
  events: TrustedEvent[]
  expectedEpochId: string
}) =>
  events
    .map(event =>
      validateAndDecryptSecureGroupEventContent({
        event: {
          id: event.id,
          kind: event.kind,
          content: event.content,
        },
        expectedEpochId,
      }),
    )
    .find(result => !result.ok)

export const reconcileSecureGroupEvents = async ({
  groupId,
  remoteEvents,
  localState,
}: {
  groupId: string
  remoteEvents: unknown[]
  localState?: unknown
}): Promise<GroupTransportResult<unknown>> => {
  const epochState = ensureSecureGroupEpochState(groupId)

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

  let expectedEpochId = epochState.epochId
  let invalidEpochEvent = findInvalidEpochValidation({
    events: trustedEvents,
    expectedEpochId,
  })

  if (
    invalidEpochEvent &&
    !invalidEpochEvent.ok &&
    invalidEpochEvent.reason === "GROUP_EPOCH_MISMATCH"
  ) {
    const repaired = repairSecureGroupEpochStateFromEvents({
      groupId,
      currentState: epochState,
      events: trustedEvents,
    })

    if (repaired.repaired) {
      expectedEpochId = repaired.state.epochId
      invalidEpochEvent = findInvalidEpochValidation({
        events: trustedEvents,
        expectedEpochId,
      })
    }
  }

  if (invalidEpochEvent && !invalidEpochEvent.ok) {
    return errTransportResult(
      "GROUP_TRANSPORT_VALIDATION_FAILED",
      `Secure group epoch validation failed (${invalidEpochEvent.reason}) for event ${invalidEpochEvent.eventId}.`,
      true,
    )
  }

  const invalidContentEvent = findInvalidContentValidation({
    events: trustedEvents,
    expectedEpochId,
  })

  if (invalidContentEvent && !invalidContentEvent.ok) {
    return errTransportResult(
      "GROUP_TRANSPORT_VALIDATION_FAILED",
      `Secure group decrypt validation failed (${invalidContentEvent.reason}) for event ${invalidContentEvent.eventId}.`,
      false,
    )
  }

  const wrapExclusionValidation = validateRemovedMemberWrapExclusion({
    groupId,
    events: trustedEvents,
    projection,
  })

  if (!wrapExclusionValidation.ok) {
    return errTransportResult(
      "GROUP_TRANSPORT_VALIDATION_FAILED",
      `Secure group wrap exclusion validation failed (${wrapExclusionValidation.reason}) for event ${wrapExclusionValidation.eventId}.`,
      false,
    )
  }

  const removedMembers = collectGroupMembershipRemovalPubkeys({
    events: trustedEvents,
    groupId,
  })

  if (removedMembers.length > 0) {
    advanceSecureGroupEpochState(groupId)
  }

  scheduleSecureGroupMembershipTriggeredRotation({
    groupId,
    keyState: keyUse.state,
    remoteEvents: trustedEvents,
  })

  return okTransportResult(applyGroupTransportProjectionEvents(projection, trustedEvents))
}
