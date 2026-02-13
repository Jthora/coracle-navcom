import {
  parseGroupInvitePayload,
  type GroupInvitePayload,
  type GroupInviteMissionTier,
} from "src/app/invite/schema"

export type GroupInviteAcceptResolution = {
  groups: GroupInvitePayload[]
  invalidCount: number
}

export type GroupInviteAutoJoinContext = {
  hasSession: boolean
  groups: GroupInvitePayload[]
  invalidCount: number
  peopleCount?: number
  relayCount?: number
}

const isSupportedMode = (value: unknown): value is GroupInvitePayload["preferredMode"] =>
  value === "baseline-nip29" || value === "secure-nip-ee"

const isSupportedTier = (value: unknown): value is GroupInviteMissionTier =>
  value === 0 || value === 1 || value === 2

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null

const dedupeByGroupId = (groups: GroupInvitePayload[]) => {
  const seen = new Set<string>()

  return groups.filter(group => {
    if (seen.has(group.groupId)) return false

    seen.add(group.groupId)

    return true
  })
}

export const resolveGroupInviteAcceptPayloads = (
  groups: unknown[],
): GroupInviteAcceptResolution => {
  const validGroups: GroupInvitePayload[] = []
  let invalidCount = 0

  for (const entry of groups || []) {
    const candidate = asRecord(entry)

    if (!candidate) {
      invalidCount += 1
      continue
    }

    const normalizedCandidate = {
      groupId: candidate.groupId,
      preferredMode: isSupportedMode(candidate.preferredMode) ? candidate.preferredMode : undefined,
      missionTier: isSupportedTier(candidate.missionTier) ? candidate.missionTier : undefined,
      label: typeof candidate.label === "string" ? candidate.label : undefined,
    }

    const parsed = parseGroupInvitePayload(normalizedCandidate)

    if (!parsed.ok) {
      invalidCount += 1
      continue
    }

    validGroups.push(parsed.value)
  }

  return {
    groups: dedupeByGroupId(validGroups),
    invalidCount,
  }
}

export const buildGroupJoinPrefillPath = (group: GroupInvitePayload) => {
  const params = new URLSearchParams({
    groupId: group.groupId,
  })

  if (group.preferredMode) {
    params.set("preferredMode", group.preferredMode)
  }

  if (group.missionTier !== undefined) {
    params.set("missionTier", String(group.missionTier))
  }

  if (group.label) {
    params.set("label", group.label)
  }

  return `/groups/create?${params.toString()}`
}

export const buildGroupChatPath = (groupId: string) => `/groups/${encodeURIComponent(groupId)}/chat`

export const resolveGroupInviteDestinationPath = ({
  group,
  hasActiveMembership,
}: {
  group: GroupInvitePayload
  hasActiveMembership: boolean
}) => (hasActiveMembership ? buildGroupChatPath(group.groupId) : buildGroupJoinPrefillPath(group))

export const getGroupInviteEntryMeta = (group: GroupInvitePayload) => {
  const parts: string[] = []

  if (group.preferredMode) {
    parts.push(group.preferredMode)
  }

  if (group.missionTier !== undefined) {
    parts.push(`tier ${group.missionTier}`)
  }

  return parts.join(" · ")
}

export const resolveAutoJoinGroupInvite = ({
  hasSession,
  groups,
  invalidCount,
  peopleCount = 0,
  relayCount = 0,
}: GroupInviteAutoJoinContext): GroupInvitePayload | null => {
  if (!hasSession) return null
  if (invalidCount > 0) return null
  if (peopleCount > 0 || relayCount > 0) return null
  if (groups.length !== 1) return null

  return groups[0]
}
