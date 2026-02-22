import {getTagValue, getTagValues} from "@welshman/util"
import {GROUP_KINDS} from "src/domain/group-kinds"
import type {GroupProjection} from "src/domain/group"

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null

const asTags = (value: unknown): string[][] =>
  Array.isArray(value) ? (value.filter(tag => Array.isArray(tag)) as string[][]) : []

const asCreatedAt = (event: unknown) => {
  const candidate = asRecord(event)

  return typeof candidate?.created_at === "number" ? candidate.created_at : null
}

const asEventId = (event: unknown) => {
  const candidate = asRecord(event)

  return typeof candidate?.id === "string" ? candidate.id : "unknown"
}

const asKind = (event: unknown) => {
  const candidate = asRecord(event)

  return typeof candidate?.kind === "number" ? candidate.kind : null
}

export type RemovedMemberWrapExclusionViolation = {
  reason: "REMOVED_MEMBER_INCLUDED"
  eventId: string
  removedPubkey: string
}

export type RemovedMemberWrapExclusionValidationResult =
  | {ok: true}
  | ({ok: false} & RemovedMemberWrapExclusionViolation)

type EventOrdering = {
  sequence: number
  createdAt: number
  eventId: string
}

const compareOrdering = (left: EventOrdering, right: EventOrdering) => {
  if (left.sequence !== right.sequence) {
    return left.sequence - right.sequence
  }

  if (left.createdAt !== right.createdAt) {
    return left.createdAt - right.createdAt
  }

  return left.eventId.localeCompare(right.eventId)
}

const buildRemovedMemberCutoff = ({
  groupId,
  events,
  projection,
}: {
  groupId: string
  events: unknown[]
  projection: GroupProjection
}) => {
  const cutoffByPubkey = new Map<string, EventOrdering>()

  for (const membership of Object.values(projection.members)) {
    if (membership.status === "removed") {
      cutoffByPubkey.set(membership.pubkey, {
        sequence: Number.MIN_SAFE_INTEGER,
        createdAt: membership.updatedAt,
        eventId: `projection:${membership.pubkey}`,
      })
    }
  }

  for (const [index, event] of events.entries()) {
    const kind = asKind(event)

    if (kind !== GROUP_KINDS.NIP29.REMOVE_USER && kind !== GROUP_KINDS.NIP29.LEAVE_REQUEST) {
      continue
    }

    const tags = asTags((event as {tags?: unknown}).tags)

    if (getTagValue("h", tags) !== groupId) {
      continue
    }

    const removedPubkey = getTagValue("p", tags)
    const removedAt = asCreatedAt(event)

    if (!removedPubkey || typeof removedAt !== "number") {
      continue
    }

    const current = cutoffByPubkey.get(removedPubkey)
    const next: EventOrdering = {
      sequence: index,
      createdAt: removedAt,
      eventId: asEventId(event),
    }

    if (!current || compareOrdering(next, current) > 0) {
      cutoffByPubkey.set(removedPubkey, next)
    }
  }

  return cutoffByPubkey
}

export const validateRemovedMemberWrapExclusion = ({
  groupId,
  events,
  projection,
}: {
  groupId: string
  events: unknown[]
  projection: GroupProjection
}): RemovedMemberWrapExclusionValidationResult => {
  const removedCutoff = buildRemovedMemberCutoff({groupId, events, projection})

  if (removedCutoff.size === 0) {
    return {ok: true}
  }

  for (const [index, event] of events.entries()) {
    if (asKind(event) !== GROUP_KINDS.NIP_EE.GROUP_EVENT) {
      continue
    }

    const createdAt = asCreatedAt(event)

    if (typeof createdAt !== "number") {
      continue
    }

    const tags = asTags((event as {tags?: unknown}).tags)

    if (getTagValue("h", tags) !== groupId) {
      continue
    }

    const recipients = getTagValues("p", tags)
    const eventOrdering: EventOrdering = {
      sequence: index,
      createdAt,
      eventId: asEventId(event),
    }

    for (const recipient of recipients) {
      const cutoff = removedCutoff.get(recipient)

      if (cutoff && compareOrdering(eventOrdering, cutoff) >= 0) {
        return {
          ok: false,
          reason: "REMOVED_MEMBER_INCLUDED",
          eventId: asEventId(event),
          removedPubkey: recipient,
        }
      }
    }
  }

  return {ok: true}
}
