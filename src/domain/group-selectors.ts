import {sortBy} from "@welshman/lib"
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
    Array.from(byGroup.values()).map(projection => selectGroupSummaryItem(projection, options)),
  )

export const selectGroupProjection = (
  byGroup: Map<string, GroupProjection>,
  groupId: string,
): GroupProjection | undefined => byGroup.get(groupId)
