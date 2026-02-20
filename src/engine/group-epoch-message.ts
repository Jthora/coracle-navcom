import type {TrustedEvent} from "@welshman/util"
import {GROUP_KINDS} from "src/domain/group-kinds"

export const GROUP_EPOCH_TAG_KEY = "epoch"

const isTagList = (value: unknown): value is string[][] =>
  Array.isArray(value) && value.every(tag => Array.isArray(tag))

const getTagValue = (tags: string[][], key: string) => tags.find(tag => tag[0] === key)?.[1]

export const getGroupMessageEpochId = (event: Pick<TrustedEvent, "tags">) => {
  const tags = isTagList(event.tags) ? event.tags : []

  return getTagValue(tags, GROUP_EPOCH_TAG_KEY) || null
}

export const withGroupMessageEpochTag = ({tags, epochId}: {tags: string[][]; epochId: string}) => {
  const next = tags.filter(tag => tag[0] !== GROUP_EPOCH_TAG_KEY)

  next.push([GROUP_EPOCH_TAG_KEY, epochId])

  return next
}

export type GroupMessageEpochValidationResult =
  | {ok: true}
  | {
      ok: false
      reason: "GROUP_EPOCH_MISSING" | "GROUP_EPOCH_MISMATCH"
      eventId: string
      expectedEpochId: string
      receivedEpochId: string | null
    }

export const validateGroupMessageEpochForReceive = ({
  event,
  expectedEpochId,
}: {
  event: Pick<TrustedEvent, "id" | "kind" | "tags">
  expectedEpochId: string
}): GroupMessageEpochValidationResult => {
  if (event.kind !== GROUP_KINDS.NIP_EE.GROUP_EVENT) {
    return {ok: true}
  }

  const receivedEpochId = getGroupMessageEpochId(event)

  if (!receivedEpochId) {
    return {
      ok: false,
      reason: "GROUP_EPOCH_MISSING",
      eventId: event.id,
      expectedEpochId,
      receivedEpochId: null,
    }
  }

  if (receivedEpochId !== expectedEpochId) {
    return {
      ok: false,
      reason: "GROUP_EPOCH_MISMATCH",
      eventId: event.id,
      expectedEpochId,
      receivedEpochId,
    }
  }

  return {ok: true}
}
