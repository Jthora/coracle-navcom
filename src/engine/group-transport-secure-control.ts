import {publishThunk, pubkey} from "@welshman/app"
import {makeEvent} from "@welshman/util"
import {get} from "svelte/store"
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
import {
  ensureSecureGroupEpochState,
  advanceSecureGroupEpochState,
} from "src/engine/group-epoch-state"
import {ensureOwnPqcKey} from "src/engine/pqc/pq-key-lifecycle"
import {buildSecureGroupWelcomeEvent} from "src/engine/group-epoch-welcome"
import {buildEpochKeyShareEvent} from "src/engine/group-epoch-key-share"
import {generateEpochKey} from "src/engine/pqc/epoch-key-manager"
import {storeKey, retrieveKey} from "src/engine/keys/secure-store"
import {getActivePassphrase} from "src/engine/pqc/pq-key-store"
import {
  completeSecureGroupKeyRotation,
  recordSecureGroupKeyRotationFailure,
} from "src/engine/group-key-rotation-service"
import {groupProjections} from "src/app/groups/state"

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
    const relays = Router.get().FromUser().policy(addMaximalFallbacks).getUrls()
    const value = await publishThunk({
      event: makeEvent(template.kind, template),
      relays,
    })

    if (parsed.value.action === "create") {
      await publishWelcomeForNewGroup(parsed.value.payload.groupId, relays)
    }

    if (parsed.value.action === "put-member" && parsed.value.payload.memberPubkey) {
      await publishKeyShareForNewMember(
        parsed.value.payload.groupId,
        parsed.value.payload.memberPubkey,
        relays,
      )
    }

    if (parsed.value.action === "remove-member") {
      await rotateEpochAfterMemberRemoval(
        parsed.value.payload.groupId,
        parsed.value.payload.memberPubkey || "",
        relays,
      )
    }

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

export const publishWelcomeForNewGroup = async (groupId: string, relays: string[]) => {
  const epochState = ensureSecureGroupEpochState(groupId)
  const ownKey = await ensureOwnPqcKey()
  const creatorPubkey = get(pubkey) || ""
  const creatorPqKeyId = ownKey?.record.key_id || ""

  const welcomeTemplate = buildSecureGroupWelcomeEvent({
    groupId,
    epochId: epochState.epochId,
    epochSequence: epochState.sequence,
    creatorPubkey,
    creatorPqKeyId,
  })

  await publishThunk({
    event: makeEvent(welcomeTemplate.kind, welcomeTemplate),
    relays,
  })

  // Generate epoch master key and store locally
  const epochMasterKey = generateEpochKey()
  const passphrase = getActivePassphrase()

  if (passphrase) {
    await storeKey(
      `pqc-group-master:${groupId}:epoch:${epochState.epochId}`,
      epochMasterKey,
      passphrase,
      "pqc-secret",
      {
        groupId,
        epochId: epochState.epochId,
      },
    )
  }

  // Publish key share for creator (initially the only member)
  const keyShareResult = await buildEpochKeyShareEvent({
    groupId,
    epochId: epochState.epochId,
    epochSequence: epochState.sequence,
    epochMasterKey,
    recipients: [creatorPubkey],
  })

  if (keyShareResult.ok && keyShareResult.template) {
    await publishThunk({
      event: makeEvent(keyShareResult.template.kind, keyShareResult.template),
      relays,
    })
  }
}

/**
 * E.1 — After "put-member" on a secure group, send the current epoch key
 * to the newly added member so they can decrypt messages.
 */
export const publishKeyShareForNewMember = async (
  groupId: string,
  memberPubkey: string,
  relays: string[],
) => {
  const projection = get(groupProjections).get(groupId)
  if (!projection || projection.group.transportMode !== "secure-nip-ee") return

  const passphrase = getActivePassphrase()
  if (!passphrase) return

  const epochState = ensureSecureGroupEpochState(groupId)
  const masterKey = await retrieveKey(
    `pqc-group-master:${groupId}:epoch:${epochState.epochId}`,
    passphrase,
  )
  if (!masterKey) return

  const keyShareResult = await buildEpochKeyShareEvent({
    groupId,
    epochId: epochState.epochId,
    epochSequence: epochState.sequence,
    epochMasterKey: masterKey,
    recipients: [memberPubkey],
  })

  if (keyShareResult.ok && keyShareResult.template) {
    await publishThunk({
      event: makeEvent(keyShareResult.template.kind, keyShareResult.template),
      relays,
    })
  }
}

/**
 * E.2 — After "remove-member" on a secure group, rotate the epoch so the
 * removed member can no longer decrypt new messages.
 * Advances epoch, generates a new master key, publishes a new WELCOME and
 * KEY_SHARE to all remaining active members (excluding the removed member).
 */
export const rotateEpochAfterMemberRemoval = async (
  groupId: string,
  removedPubkey: string,
  relays: string[],
) => {
  const projection = get(groupProjections).get(groupId)
  if (!projection || projection.group.transportMode !== "secure-nip-ee") return

  const passphrase = getActivePassphrase()
  if (!passphrase) return

  // Advance to new epoch
  const newEpochState = advanceSecureGroupEpochState(groupId)
  const creatorPubkey = get(pubkey) || ""
  const ownKey = await ensureOwnPqcKey()
  const creatorPqKeyId = ownKey?.record.key_id || ""

  // Publish new WELCOME with updated epoch
  const welcomeTemplate = buildSecureGroupWelcomeEvent({
    groupId,
    epochId: newEpochState.epochId,
    epochSequence: newEpochState.sequence,
    creatorPubkey,
    creatorPqKeyId,
  })

  await publishThunk({
    event: makeEvent(welcomeTemplate.kind, welcomeTemplate),
    relays,
  })

  // Generate new epoch master key and store locally
  const newMasterKey = generateEpochKey()

  await storeKey(
    `pqc-group-master:${groupId}:epoch:${newEpochState.epochId}`,
    newMasterKey,
    passphrase,
    "pqc-secret",
    {
      groupId,
      epochId: newEpochState.epochId,
    },
  )

  // Collect remaining active members (excluding the removed member)
  const remainingMembers = Object.values(projection.members)
    .filter(m => m.status === "active" && m.pubkey !== removedPubkey)
    .map(m => m.pubkey)

  if (remainingMembers.length === 0) return

  // Publish key shares to all remaining members
  const keyShareResult = await buildEpochKeyShareEvent({
    groupId,
    epochId: newEpochState.epochId,
    epochSequence: newEpochState.sequence,
    epochMasterKey: newMasterKey,
    recipients: remainingMembers,
  })

  if (keyShareResult.ok && keyShareResult.template) {
    await publishThunk({
      event: makeEvent(keyShareResult.template.kind, keyShareResult.template),
      relays,
    })
  }
}

/**
 * E.3 — Execute a scheduled key rotation for a secure group.
 * Advances epoch, publishes new WELCOME + KEY_SHARE to all active members.
 * On success, marks the rotation job as completed; on failure, records the error.
 */
export const executeSecureGroupKeyRotation = async (groupId: string) => {
  try {
    const projection = get(groupProjections).get(groupId)
    if (!projection || projection.group.transportMode !== "secure-nip-ee") {
      completeSecureGroupKeyRotation(groupId)
      return
    }

    const passphrase = getActivePassphrase()
    if (!passphrase) {
      recordSecureGroupKeyRotationFailure(groupId, new Error("Passphrase not available"))
      return
    }

    const relays = Router.get().FromUser().policy(addMaximalFallbacks).getUrls()
    const newEpochState = advanceSecureGroupEpochState(groupId)
    const creatorPubkey = get(pubkey) || ""
    const ownKey = await ensureOwnPqcKey()
    const creatorPqKeyId = ownKey?.record.key_id || ""

    const welcomeTemplate = buildSecureGroupWelcomeEvent({
      groupId,
      epochId: newEpochState.epochId,
      epochSequence: newEpochState.sequence,
      creatorPubkey,
      creatorPqKeyId,
    })

    await publishThunk({
      event: makeEvent(welcomeTemplate.kind, welcomeTemplate),
      relays,
    })

    const newMasterKey = generateEpochKey()

    await storeKey(
      `pqc-group-master:${groupId}:epoch:${newEpochState.epochId}`,
      newMasterKey,
      passphrase,
      "pqc-secret",
      {
        groupId,
        epochId: newEpochState.epochId,
      },
    )

    const allMembers = Object.values(projection.members)
      .filter(m => m.status === "active")
      .map(m => m.pubkey)

    if (allMembers.length > 0) {
      const keyShareResult = await buildEpochKeyShareEvent({
        groupId,
        epochId: newEpochState.epochId,
        epochSequence: newEpochState.sequence,
        epochMasterKey: newMasterKey,
        recipients: allMembers,
      })

      if (keyShareResult.ok && keyShareResult.template) {
        await publishThunk({
          event: makeEvent(keyShareResult.template.kind, keyShareResult.template),
          relays,
        })
      }
    }

    completeSecureGroupKeyRotation(groupId)
  } catch (error) {
    recordSecureGroupKeyRotationFailure(groupId, error)
  }
}
