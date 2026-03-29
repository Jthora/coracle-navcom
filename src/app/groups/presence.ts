import {derived} from "svelte/store"
import {groupProjections} from "./state"

export type PresenceStatus = "active" | "recent" | "cold" | "unknown"

// Freshness thresholds in seconds
const ACTIVE_THRESHOLD = 15 * 60 // 15 minutes
const RECENT_THRESHOLD = 2 * 60 * 60 // 2 hours
const COLD_THRESHOLD = 24 * 60 * 60 // 24 hours

export function classifyPresence(lastSeenTimestamp: number): PresenceStatus {
  if (lastSeenTimestamp <= 0) return "unknown"

  const now = Math.floor(Date.now() / 1000)
  const delta = now - lastSeenTimestamp

  if (delta < 0) return "active" // future timestamps treated as active (clock skew)
  if (delta <= ACTIVE_THRESHOLD) return "active"
  if (delta <= RECENT_THRESHOLD) return "recent"
  if (delta <= COLD_THRESHOLD) return "cold"
  return "unknown"
}

export type MemberPresenceData = {
  lastSeen: number
  status: PresenceStatus
}

/**
 * Derived store: Map<groupId, Map<pubkey, MemberPresenceData>>
 * Computes last-seen from the most recent event created_at per member per group.
 */
export const groupMemberPresence = derived(groupProjections, $groupProjections => {
  const presence = new Map<string, Map<string, MemberPresenceData>>()

  for (const [groupId, projection] of $groupProjections.entries()) {
    const groupPresence = new Map<string, MemberPresenceData>()

    // Build a map of pubkey → max created_at from sourceEvents
    const lastSeenByPubkey = new Map<string, number>()
    for (const event of projection.sourceEvents) {
      const prev = lastSeenByPubkey.get(event.pubkey) || 0
      if (event.created_at > prev) {
        lastSeenByPubkey.set(event.pubkey, event.created_at)
      }
    }

    for (const pubkey of Object.keys(projection.members)) {
      const lastSeen = lastSeenByPubkey.get(pubkey) || 0
      groupPresence.set(pubkey, {
        lastSeen,
        status: classifyPresence(lastSeen),
      })
    }

    presence.set(groupId, groupPresence)
  }

  return presence
})

export function getMemberPresence(
  presenceMap: Map<string, Map<string, MemberPresenceData>>,
  groupId: string,
  pubkey: string,
): PresenceStatus {
  return presenceMap.get(groupId)?.get(pubkey)?.status || "unknown"
}

export type GroupHealthLevel = "healthy" | "degraded" | "cold"

export function getGroupHealth(
  presenceMap: Map<string, Map<string, MemberPresenceData>>,
  groupId: string,
): GroupHealthLevel {
  const groupPresence = presenceMap.get(groupId)
  if (!groupPresence || groupPresence.size === 0) return "cold"

  const summary = getGroupPresenceSummary(presenceMap, groupId)
  const total = summary.active + summary.recent + summary.cold + summary.unknown

  if (total === 0) return "cold"
  if (summary.active / total > 0.5) return "healthy"
  if ((summary.active + summary.recent) / total > 0.5) return "degraded"
  return "cold"
}

export type PresenceSummary = {
  active: number
  recent: number
  cold: number
  unknown: number
}

export function getGroupPresenceSummary(
  presenceMap: Map<string, Map<string, MemberPresenceData>>,
  groupId: string,
): PresenceSummary {
  const summary: PresenceSummary = {active: 0, recent: 0, cold: 0, unknown: 0}
  const groupPresence = presenceMap.get(groupId)

  if (!groupPresence) return summary

  for (const data of groupPresence.values()) {
    summary[data.status]++
  }

  return summary
}
