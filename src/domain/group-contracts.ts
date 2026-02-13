import type {TrustedEvent} from "@welshman/util"
import {getTagValue} from "@welshman/util"
import {classifyGroupEventKind, isGroupKind} from "src/domain/group-kinds"
import {normalizeGroupTags} from "src/domain/group-normalization"

export const GROUP_CONTRACT_REASON = {
  UNKNOWN_KIND: "GROUP_CONTRACT_UNKNOWN_KIND",
  MISSING_GROUP_TAG: "GROUP_CONTRACT_MISSING_GROUP_TAG",
  MISSING_MEMBER_TAG: "GROUP_CONTRACT_MISSING_MEMBER_TAG",
  INVALID_TAG_FORMAT: "GROUP_CONTRACT_INVALID_TAG_FORMAT",
} as const

export type GroupContractReasonCode =
  (typeof GROUP_CONTRACT_REASON)[keyof typeof GROUP_CONTRACT_REASON]

export type GroupContractDiagnostic = {
  reason: GroupContractReasonCode
  eventId: string
  kind: number
  groupId?: string
}

export type GroupContractValidationResult =
  | {
      ok: true
      groupId?: string
      className: ReturnType<typeof classifyGroupEventKind>
    }
  | {
      ok: false
      diagnostic: GroupContractDiagnostic
    }

const hasValidTags = (event: TrustedEvent) =>
  Array.isArray(event.tags) &&
  event.tags.every(tag => Array.isArray(tag) && tag.every(v => typeof v === "string"))

export const validateGroupContractEvent = (event: TrustedEvent): GroupContractValidationResult => {
  if (!isGroupKind(event.kind)) {
    return {
      ok: false,
      diagnostic: {
        reason: GROUP_CONTRACT_REASON.UNKNOWN_KIND,
        eventId: event.id,
        kind: event.kind,
      },
    }
  }

  if (!hasValidTags(event)) {
    return {
      ok: false,
      diagnostic: {
        reason: GROUP_CONTRACT_REASON.INVALID_TAG_FORMAT,
        eventId: event.id,
        kind: event.kind,
      },
    }
  }

  const tags = normalizeGroupTags(event.tags as string[][])
  const className = classifyGroupEventKind(event.kind)
  const groupId = getTagValue("h", tags) || getTagValue("d", tags)

  if (!groupId) {
    return {
      ok: false,
      diagnostic: {
        reason: GROUP_CONTRACT_REASON.MISSING_GROUP_TAG,
        eventId: event.id,
        kind: event.kind,
      },
    }
  }

  if (className === "membership" && !getTagValue("p", tags)) {
    return {
      ok: false,
      diagnostic: {
        reason: GROUP_CONTRACT_REASON.MISSING_MEMBER_TAG,
        eventId: event.id,
        kind: event.kind,
        groupId,
      },
    }
  }

  return {
    ok: true,
    groupId,
    className,
  }
}
