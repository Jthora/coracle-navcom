import {derived, writable} from "svelte/store"
import {pubkey} from "@welshman/app"
import type {TrustedEvent} from "@welshman/util"
import type {GroupProjection} from "src/domain/group"
import {buildGroupProjection} from "src/domain/group-projection"
import {classifyGroupEventKind} from "src/domain/group-kinds"
import {checked} from "src/engine/state"
import {selectGroupListItems} from "src/domain/group-selectors"

export const groupProjections = writable<Map<string, GroupProjection>>(new Map())

export const groupsHydrated = writable(false)

export const groupSummaries = derived(groupProjections, $groupProjections =>
  selectGroupListItems($groupProjections),
)

const getSeenAt = (state: Record<string, number>, path: string) => {
  const scope = `${path.split("/")[0]}/*`

  return Math.max(state[path] || 0, state[scope] || 0, state["*"] || 0)
}

export const unreadGroupMessageCounts = derived(
  [groupProjections, checked, pubkey],
  ([$groupProjections, $checked, $pubkey]) => {
    const unreadCounts = new Map<string, number>()

    for (const [groupId, projection] of $groupProjections.entries()) {
      const seenAt = getSeenAt($checked, `groups/${groupId}`)
      let unread = 0

      for (const event of projection.sourceEvents) {
        if (classifyGroupEventKind(event.kind) !== "message") continue
        if (!event.content) continue
        if ($pubkey && event.pubkey === $pubkey) continue
        if (event.created_at > seenAt) unread += 1
      }

      unreadCounts.set(groupId, unread)
    }

    return unreadCounts
  },
)

export const hasUnreadGroupMessages = derived(unreadGroupMessageCounts, $counts => {
  for (const count of $counts.values()) {
    if (count > 0) return true
  }

  return false
})

export const totalUnreadGroupMessages = derived(unreadGroupMessageCounts, $counts => {
  let total = 0

  for (const count of $counts.values()) {
    total += count
  }

  return total
})

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
