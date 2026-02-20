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

const buildRemovedMemberCutoff = ({
  groupId,
  events,
  projection,
}: {
  groupId: string
  events: unknown[]
  projection: GroupProjection
}) => {
  const cutoffByPubkey = new Map<string, number>()

  for (const membership of Object.values(projection.members)) {
    if (membership.status === "removed") {
      cutoffByPubkey.set(membership.pubkey, membership.updatedAt)
    }
  }

  for (const event of events) {
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

    if (typeof current !== "number" || removedAt > current) {
      cutoffByPubkey.set(removedPubkey, removedAt)
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

  for (const event of events) {
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

    for (const recipient of recipients) {
      const cutoff = removedCutoff.get(recipient)

      if (typeof cutoff === "number" && createdAt >= cutoff) {
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
