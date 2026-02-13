import {derived, writable} from "svelte/store"
import type {TrustedEvent} from "@welshman/util"
import type {GroupProjection} from "src/domain/group"
import {buildGroupProjection} from "src/domain/group-projection"
import {selectGroupListItems} from "src/domain/group-selectors"

export const groupProjections = writable<Map<string, GroupProjection>>(new Map())

export const groupsHydrated = writable(false)

export const groupSummaries = derived(groupProjections, $groupProjections =>
  selectGroupListItems($groupProjections),
)

export const hydrateGroupsFromEvents = (events: TrustedEvent[]) => {
  groupProjections.set(buildGroupProjection(events))
  groupsHydrated.set(true)
}

export const setGroupProjections = (next: Map<string, GroupProjection>) => {
  groupProjections.set(new Map(next))
  groupsHydrated.set(true)
}

export const markGroupsHydrated = () => {
  groupsHydrated.set(true)
}

export const resetGroupsState = () => {
  groupProjections.set(new Map())
  groupsHydrated.set(false)
}
