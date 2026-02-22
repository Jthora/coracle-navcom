import {sortBy} from "@welshman/lib"
import {GROUP_KINDS, classifyGroupEventKind} from "src/domain/group-kinds"
import type {GroupProjection} from "src/domain/group"
import {
  GROUP_PROJECTION_STALE_AFTER_SECONDS,
  isGroupProjectionStale,
} from "src/domain/group-projection"

export type GroupSummaryListItem = {
  id: string
  title: string
  description: string
  picture?: string
  protocol: GroupProjection["group"]["protocol"]
  transportMode: GroupProjection["group"]["transportMode"]
  memberCount: number
  lastUpdated: number
  stale: boolean
}

export type GroupSelectorOptions = {
  now?: number
  staleAfterSeconds?: number
  currentPubkey?: string | null
}

const hasSecureGroupAccessSignal = (projection: GroupProjection, currentPubkey: string | null) => {
  if (!currentPubkey) {
    return false
  }

  const membership = projection.members[currentPubkey]

  if (membership && (membership.status === "active" || membership.status === "pending")) {
    return true
  }

  for (const event of projection.sourceEvents) {
    if (event.pubkey === currentPubkey) {
      return true
    }

    if (event.kind === GROUP_KINDS.NIP_EE.WELCOME) {
      const directedToCurrentUser = event.tags.some(
        tag => tag[0] === "p" && tag[1] === currentPubkey,
      )

      if (directedToCurrentUser) {
        return true
      }
    }
  }

  return false
}

const shouldShowGroupProjection = (
  projection: GroupProjection,
  {currentPubkey = null}: GroupSelectorOptions = {},
) => {
  if (projection.group.transportMode !== "secure-nip-ee") {
    return true
  }

  const hasStructuredState = projection.sourceEvents.some(event => {
    const kindClass = classifyGroupEventKind(event.kind)

    return kindClass === "metadata" || kindClass === "membership" || kindClass === "moderation"
  })

  if (hasStructuredState) {
    return true
  }

  return hasSecureGroupAccessSignal(projection, currentPubkey)
}

export const selectGroupSummaryItem = (
  projection: GroupProjection,
  {now = Math.floor(Date.now() / 1000), staleAfterSeconds}: GroupSelectorOptions = {},
): GroupSummaryListItem => ({
  id: projection.group.id,
  title: projection.group.title || projection.group.id,
  description: projection.group.description,
  picture: projection.group.picture,
  protocol: projection.group.protocol,
  transportMode: projection.group.transportMode,
  memberCount: Object.values(projection.members).filter(member => member.status === "active")
    .length,
  lastUpdated: projection.group.updatedAt,
  stale: isGroupProjectionStale(
    projection,
    now,
    staleAfterSeconds ?? GROUP_PROJECTION_STALE_AFTER_SECONDS,
  ),
})

export const selectGroupListItems = (
  byGroup: Map<string, GroupProjection>,
  options: GroupSelectorOptions = {},
): GroupSummaryListItem[] =>
  sortBy(
    item => -item.lastUpdated,
    Array.from(byGroup.values())
      .filter(projection => shouldShowGroupProjection(projection, options))
      .map(projection => selectGroupSummaryItem(projection, options)),
  )

export const selectGroupProjection = (
  byGroup: Map<string, GroupProjection>,
  groupId: string,
): GroupProjection | undefined => byGroup.get(groupId)
