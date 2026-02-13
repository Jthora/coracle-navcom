import type {TrustedEvent} from "@welshman/util"
import {getTagValue, getTagValues} from "@welshman/util"
import {validateGroupContractEvent} from "src/domain/group-contracts"
import {classifyGroupEventKind, GROUP_KINDS} from "src/domain/group-kinds"
import {
  makeAuditEvent,
  makeGroup,
  makeMembership,
  makeProjection,
  type GroupMemberRole,
  type GroupProjection,
} from "src/domain/group"

export const GROUP_PROJECTION_CHECKPOINT_VERSION = 1 as const
export const GROUP_PROJECTION_STALE_AFTER_SECONDS = 60 * 60 * 24

export type GroupProjectionCheckpoint = {
  version: number
  savedAt: number
  group: GroupProjection["group"]
  members: GroupProjection["members"]
  audit: GroupProjection["audit"]
  sourceEventIds: string[]
  sourceEventCount: number
}

export type GroupProjectionRestoreOptions = {
  now?: number
  staleAfterSeconds?: number
  recoverStale?: boolean
}

const getGroupIdFromEvent = (event: TrustedEvent) =>
  getTagValue("h", event.tags) || getTagValue("d", event.tags)

const hasProcessedEvent = (projection: GroupProjection, eventId: string) =>
  projection.sourceEvents.some(event => event.id === eventId)

const shouldApplyMembershipEvent = (
  current: GroupProjection["members"][string] | undefined,
  incomingAt: number,
  incomingEventId: string,
) => {
  if (!current) return true
  if (incomingAt > current.updatedAt) return true
  if (incomingAt < current.updatedAt) return false

  return incomingEventId > (current.eventId || "")
}

const parseMemberRole = (value?: string): GroupMemberRole => {
  if (value === "owner" || value === "admin" || value === "moderator" || value === "member") {
    return value
  }

  return "member"
}

const getProtocolForKind = (kind: number) => {
  if (
    kind === GROUP_KINDS.NIP29.METADATA ||
    kind === GROUP_KINDS.NIP29.ADMINS ||
    kind === GROUP_KINDS.NIP29.MEMBERS ||
    kind === GROUP_KINDS.NIP29.ROLES ||
    (kind >= 9000 && kind <= 9030)
  ) {
    return "nip29" as const
  }

  return "nip-ee" as const
}

export const createProjectionFromEvent = (event: TrustedEvent): GroupProjection | null => {
  const validation = validateGroupContractEvent(event)

  if (!validation.ok) return null

  const groupId = getGroupIdFromEvent(event)

  if (!groupId) return null

  return makeProjection(
    makeGroup({
      id: groupId,
      protocol: getProtocolForKind(event.kind),
      transportMode:
        getProtocolForKind(event.kind) === "nip29" ? "baseline-nip29" : "secure-nip-ee",
      createdAt: event.created_at,
      updatedAt: event.created_at,
    }),
  )
}

export const applyGroupEvent = (
  projection: GroupProjection,
  event: TrustedEvent,
): GroupProjection => {
  const validation = validateGroupContractEvent(event)

  if (!validation.ok) return projection

  const eventType = classifyGroupEventKind(event.kind)
  const groupId = getGroupIdFromEvent(event)

  if (!groupId || groupId !== projection.group.id) return projection
  if (hasProcessedEvent(projection, event.id)) return projection

  projection.sourceEvents.push(event)
  projection.group.updatedAt = Math.max(projection.group.updatedAt, event.created_at)

  if (eventType === "metadata" && event.kind === GROUP_KINDS.NIP29.METADATA) {
    projection.group.title = getTagValue("name", event.tags) || projection.group.title
    projection.group.description = getTagValue("about", event.tags) || projection.group.description
    projection.group.picture = getTagValue("picture", event.tags) || projection.group.picture
  }

  if (eventType === "membership") {
    const target = getTagValue("p", event.tags)

    if (target) {
      const current = projection.members[target]

      if (shouldApplyMembershipEvent(current, event.created_at, event.id)) {
        projection.members[target] = makeMembership({
          groupId,
          pubkey: target,
          status:
            event.kind === GROUP_KINDS.NIP29.REMOVE_USER ||
            event.kind === GROUP_KINDS.NIP29.LEAVE_REQUEST
              ? "removed"
              : "active",
          role: parseMemberRole(getTagValues("role", event.tags)[0]),
          updatedAt: event.created_at,
          eventId: event.id,
        })
      }
    }
  }

  if (eventType === "moderation") {
    projection.audit.unshift(
      makeAuditEvent({
        groupId,
        action: `kind:${event.kind}`,
        actor: event.pubkey,
        createdAt: event.created_at,
        reason: event.content || undefined,
        eventId: event.id,
      }),
    )
  }

  return projection
}

export const buildGroupProjection = (events: TrustedEvent[]) => {
  const byGroup = new Map<string, GroupProjection>()

  for (const event of events) {
    const groupId = getGroupIdFromEvent(event)

    if (!groupId) continue

    let projection = byGroup.get(groupId)

    if (!projection) {
      projection = createProjectionFromEvent(event)
      if (!projection) continue
      byGroup.set(groupId, projection)
    }

    applyGroupEvent(projection, event)
  }

  return byGroup
}

export const createProjectionCheckpoint = (
  projection: GroupProjection,
  now = Math.floor(Date.now() / 1000),
): GroupProjectionCheckpoint => ({
  version: GROUP_PROJECTION_CHECKPOINT_VERSION,
  savedAt: now,
  group: projection.group,
  members: projection.members,
  audit: projection.audit,
  sourceEventIds: projection.sourceEvents.map(event => event.id),
  sourceEventCount: projection.sourceEvents.length,
})

export const isGroupProjectionStale = (
  projection: GroupProjection,
  now = Math.floor(Date.now() / 1000),
  staleAfterSeconds = GROUP_PROJECTION_STALE_AFTER_SECONDS,
) => now - projection.group.updatedAt > staleAfterSeconds

export const recoverStaleProjection = (
  projection: GroupProjection,
  now = Math.floor(Date.now() / 1000),
) => {
  const recovered = makeProjection(
    makeGroup({
      ...projection.group,
      updatedAt: now,
    }),
  )

  recovered.audit.unshift(
    makeAuditEvent({
      groupId: projection.group.id,
      action: "recovery:stale-checkpoint",
      actor: "system",
      createdAt: now,
      reason: "Checkpoint exceeded staleness window and was reset",
    }),
  )

  return recovered
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object"

export const restoreProjectionCheckpoint = (
  checkpoint: unknown,
  {
    now = Math.floor(Date.now() / 1000),
    staleAfterSeconds,
    recoverStale = true,
  }: GroupProjectionRestoreOptions = {},
): GroupProjection | null => {
  if (!isRecord(checkpoint)) return null

  if (checkpoint.version !== GROUP_PROJECTION_CHECKPOINT_VERSION) return null
  if (
    !isRecord(checkpoint.group) ||
    !isRecord(checkpoint.members) ||
    !Array.isArray(checkpoint.audit)
  ) {
    return null
  }

  const group = checkpoint.group as GroupProjection["group"]

  if (typeof group.id !== "string" || typeof group.protocol !== "string") {
    return null
  }

  const projection = {
    group,
    members: checkpoint.members as GroupProjection["members"],
    audit: checkpoint.audit as GroupProjection["audit"],
    sourceEvents: [],
  }

  if (isGroupProjectionStale(projection, now, staleAfterSeconds)) {
    return recoverStale ? recoverStaleProjection(projection, now) : null
  }

  return projection
}
