import {pubkey, publishThunk} from "@welshman/app"
import {Router, addMaximalFallbacks} from "@welshman/router"
import {uniq} from "@welshman/lib"
import {makeEvent} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {GROUP_KINDS} from "src/domain/group-kinds"
import type {GroupProjection} from "src/domain/group"
import {myRequest, getClientTags} from "src/engine/state"
import {prepareSecureGroupKeyUse} from "src/engine/group-key-lifecycle"
import {
  advanceSecureGroupEpochState,
  ensureSecureGroupEpochState,
} from "src/engine/group-epoch-state"
import {
  getGroupMessageEpochId,
  validateGroupMessageEpochForReceive,
  withGroupMessageEpochTag,
} from "src/engine/group-epoch-message"
import {
  encodeSecureGroupEpochContent,
  extractSealedMeta,
  buildSealedContent,
} from "src/engine/group-epoch-content"
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
import {retrieveKey} from "src/engine/keys/secure-store"
import {deriveEpochContentKey} from "src/engine/pqc/epoch-key-manager"
import {getActivePassphrase} from "src/engine/pqc/pq-key-store"
import {ensureOwnPqcKey} from "src/engine/pqc/pq-key-lifecycle"
import {
  errTransportResult,
  okTransportResult,
  type GroupTransportResult,
  type GroupTransportSubscribeHandlers,
  type GroupTransportSubscription,
} from "src/engine/group-transport-contracts"
import {evaluateSecureGroupSendTierPolicy} from "src/engine/group-transport-secure-tier"
import {
  buildSecureSubscribeFilters,
  type SecureGroupSendInput,
  type SecureGroupSubscribeInput,
} from "src/engine/group-transport-secure-input"
export {
  buildSecureSubscribeFilters,
  parseSecureGroupSendInput,
  parseSecureGroupSendInputResult,
  parseSecureGroupSubscribeInput,
  type GroupSecureSendInputReason,
  type ParseSecureGroupSendInputResult,
  type SecureGroupSendInput,
  type SecureGroupSubscribeInput,
  GROUP_SECURE_SEND_INPUT_REASON,
} from "src/engine/group-transport-secure-input"

/**
 * Resolve a derived epoch content key from secure storage.
 * Loads the group's PQC master secret from IndexedDB, then HKDF-derives the
 * AES-GCM-256 content key for the given epoch.
 *
 * @param groupId  - group identifier
 * @param epochId  - epoch identifier
 * @param passphrase - passphrase for unwrapping the master secret
 * @returns 32-byte epoch content key, or null if unavailable
 */
export const resolveEpochKey = async (
  groupId: string,
  epochId: string,
  passphrase: string,
): Promise<Uint8Array | null> => {
  const masterKey = await retrieveKey(`pqc-group-master:${groupId}:epoch:${epochId}`, passphrase)
  if (!masterKey) return null
  return deriveEpochContentKey(masterKey, groupId, epochId)
}

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

  if (tierPolicy.ok === false) {
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

    // Ensure sender's PQC key is published (kind 10051)
    await ensureOwnPqcKey()

    const recipientResolution = resolveEligibleSecureWrapRecipients({
      recipients: uniq(input.recipients.concat(senderPubkey).filter(Boolean)),
      senderPubkey,
      projection:
        input.localState && typeof input.localState === "object"
          ? (input.localState as GroupProjection)
          : null,
    })

    if (recipientResolution.eligibleRecipients.length === 0) {
      return errTransportResult(
        "GROUP_TRANSPORT_VALIDATION_FAILED",
        "Secure group send requires at least one eligible recipient.",
        false,
      )
    }

    if (!input.epochKeyBytes) {
      // Resolve epoch key from secure store (no auto-provisioning)
      const passphrase = getActivePassphrase()
      if (!passphrase) {
        return errTransportResult(
          "GROUP_TRANSPORT_VALIDATION_FAILED",
          "PQC passphrase not available. Key store is locked.",
          true,
        )
      }

      const resolved = await resolveEpochKey(input.groupId, epochState.epochId, passphrase)
      if (!resolved) {
        return errTransportResult(
          "GROUP_TRANSPORT_VALIDATION_FAILED",
          "No epoch key for this group. You may not have received the key share yet.",
          true,
        )
      }

      input = {...input, epochKeyBytes: resolved}
    }

    if (!input.epochKeyBytes) {
      return errTransportResult(
        "GROUP_TRANSPORT_VALIDATION_FAILED",
        "Epoch key bytes are required for secure group send. Ensure the group has a PQC epoch key.",
        false,
      )
    }

    // Seal sensitive metadata tags inside the encrypted content body
    const rawExtraTags = Array.isArray(input.extraTags) ? input.extraTags : []
    const {meta, remainingTags: extraTags} = extractSealedMeta(rawExtraTags)
    const sealedPlaintext = buildSealedContent(input.content, meta)

    const encodedContent = await encodeSecureGroupEpochContent({
      groupId: input.groupId,
      epochId: epochState.epochId,
      plaintext: sealedPlaintext,
      senderPubkey,
      recipients: recipientResolution.eligibleRecipients,
      epochKeyBytes: input.epochKeyBytes,
      pqDerived: true,
    })

    if (encodedContent.ok === false) {
      return errTransportResult("GROUP_TRANSPORT_VALIDATION_FAILED", encodedContent.message, false)
    }

    const relays = Router.get().FromUser().policy(addMaximalFallbacks).getUrls()

    const result = await publishThunk({
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
            ...extraTags,
          ],
        }),
      }),
      relays,
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
      onEvent: async event => {
        // Attempt to decrypt secure group content before passing to handler
        const epochState = ensureSecureGroupEpochState(input.groupId)
        const passphrase = getActivePassphrase()

        if (passphrase && event.kind === GROUP_KINDS.NIP_EE.GROUP_EVENT) {
          const epochKey = await resolveEpochKey(input.groupId, epochState.epochId, passphrase)
          if (epochKey) {
            const decrypted = await validateAndDecryptSecureGroupEventContent({
              event,
              expectedEpochId: epochState.epochId,
              epochKeyBytes: epochKey,
            })
            if (decrypted.ok && decrypted.plaintext) {
              handlers.onEvent({...event, content: decrypted.plaintext})
              return
            }
          }

          // Multi-epoch fallback: try the epoch tagged in the message
          const msgEpochId = getGroupMessageEpochId(event)
          if (msgEpochId && msgEpochId !== epochState.epochId) {
            const altKey = await resolveEpochKey(input.groupId, msgEpochId, passphrase)
            if (altKey) {
              const altDecrypted = await validateAndDecryptSecureGroupEventContent({
                event,
                expectedEpochId: msgEpochId,
                epochKeyBytes: altKey,
              })
              if (altDecrypted.ok && altDecrypted.plaintext) {
                handlers.onEvent({...event, content: altDecrypted.plaintext})
                return
              }
            }
          }
        }

        // Fall through: pass raw event if decryption unavailable
        handlers.onEvent(event)
      },
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

const findInvalidContentValidation = async ({
  events,
  expectedEpochId,
  epochKeyBytes,
}: {
  events: TrustedEvent[]
  expectedEpochId: string
  epochKeyBytes: Uint8Array
}) => {
  const results = await Promise.all(
    events.map(event =>
      validateAndDecryptSecureGroupEventContent({
        event: {
          id: event.id,
          kind: event.kind,
          content: event.content,
        },
        expectedEpochId,
        epochKeyBytes,
      }),
    ),
  )

  return results.find(result => !result.ok)
}

export const reconcileSecureGroupEvents = async ({
  groupId,
  remoteEvents,
  localState,
  epochKeyBytes,
}: {
  groupId: string
  remoteEvents: unknown[]
  localState?: unknown
  epochKeyBytes?: Uint8Array
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

  const projection = localState as GroupProjection

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
    invalidEpochEvent.ok === false &&
    "reason" in invalidEpochEvent &&
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

  if (invalidEpochEvent && invalidEpochEvent.ok === false) {
    const reason =
      "reason" in invalidEpochEvent ? String(invalidEpochEvent.reason) : "GROUP_EPOCH_INVALID"
    const eventId = "eventId" in invalidEpochEvent ? String(invalidEpochEvent.eventId) : "unknown"

    return errTransportResult(
      "GROUP_TRANSPORT_VALIDATION_FAILED",
      `Secure group epoch validation failed (${reason}) for event ${eventId}.`,
      true,
    )
  }

  const invalidContentEvent = epochKeyBytes
    ? await findInvalidContentValidation({
        events: trustedEvents,
        expectedEpochId,
        epochKeyBytes,
      })
    : undefined

  if (invalidContentEvent && invalidContentEvent.ok === false) {
    const reason =
      "reason" in invalidContentEvent ? String(invalidContentEvent.reason) : "GROUP_DECRYPT_INVALID"
    const eventId =
      "eventId" in invalidContentEvent ? String(invalidContentEvent.eventId) : "unknown"

    return errTransportResult(
      "GROUP_TRANSPORT_VALIDATION_FAILED",
      `Secure group decrypt validation failed (${reason}) for event ${eventId}.`,
      false,
    )
  }

  const wrapExclusionValidation = validateRemovedMemberWrapExclusion({
    groupId,
    events: trustedEvents,
    projection,
  })

  if (wrapExclusionValidation.ok === false) {
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
