import {getTagValue} from "@welshman/util"
import {GROUP_KINDS} from "src/domain/group-kinds"

const MEMBERSHIP_REMOVAL_KINDS = new Set<number>([
  GROUP_KINDS.NIP29.REMOVE_USER,
  GROUP_KINDS.NIP29.LEAVE_REQUEST,
])

const asTags = (value: unknown): string[][] =>
  Array.isArray(value) ? (value.filter(tag => Array.isArray(tag)) as string[][]) : []

export const isGroupMembershipRemovalEvent = (event: unknown) => {
  if (!event || typeof event !== "object") {
    return false
  }

  const candidate = event as Record<string, unknown>

  return (
    typeof candidate.kind === "number" &&
    MEMBERSHIP_REMOVAL_KINDS.has(candidate.kind) &&
    asTags(candidate.tags).length > 0
  )
}

export const collectGroupMembershipRemovalPubkeys = ({
  events,
  groupId,
}: {
  events: unknown[]
  groupId?: string
}) => {
  const removed = new Set<string>()

  for (const event of events) {
    if (!isGroupMembershipRemovalEvent(event)) {
      continue
    }

    const tags = asTags((event as {tags?: unknown}).tags)
    const eventGroupId = getTagValue("h", tags)

    if (groupId && eventGroupId !== groupId) {
      continue
    }

    const target = getTagValue("p", tags)

    if (target) {
      removed.add(target)
    }
  }

  return Array.from(removed)
}
