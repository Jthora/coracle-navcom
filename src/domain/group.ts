import type {TrustedEvent} from "@welshman/util"
import type {GroupProtocol} from "src/domain/group-kinds"

export type GroupTransportMode = "baseline-nip29" | "secure-nip-ee"

export type GroupMemberRole = "owner" | "admin" | "moderator" | "member"

export type GroupMembershipStatus = "active" | "pending" | "removed" | "left"

export type GroupEntity = {
  id: string
  title: string
  description: string
  picture?: string
  protocol: GroupProtocol
  transportMode: GroupTransportMode
  createdAt: number
  updatedAt: number
}

export type GroupMembership = {
  groupId: string
  pubkey: string
  role: GroupMemberRole
  status: GroupMembershipStatus
  updatedAt: number
  eventId?: string
}

export type GroupAuditEvent = {
  groupId: string
  action: string
  actor: string
  createdAt: number
  reason?: string
  eventId?: string
}

export type GroupProjection = {
  group: GroupEntity
  members: Record<string, GroupMembership>
  audit: GroupAuditEvent[]
  sourceEvents: TrustedEvent[]
}

export const makeGroup = (input: Partial<GroupEntity> & {id: string}): GroupEntity => {
  const now = Math.floor(Date.now() / 1000)

  return {
    id: input.id,
    title: input.title || "",
    description: input.description || "",
    picture: input.picture,
    protocol: input.protocol || "nip29",
    transportMode: input.transportMode || "baseline-nip29",
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  }
}

export const makeMembership = (
  input: Partial<GroupMembership> & {groupId: string; pubkey: string},
): GroupMembership => ({
  groupId: input.groupId,
  pubkey: input.pubkey,
  role: input.role || "member",
  status: input.status || "pending",
  updatedAt: input.updatedAt || Math.floor(Date.now() / 1000),
  eventId: input.eventId,
})

export const makeAuditEvent = (
  input: Partial<GroupAuditEvent> & {groupId: string; action: string; actor: string},
): GroupAuditEvent => ({
  groupId: input.groupId,
  action: input.action,
  actor: input.actor,
  createdAt: input.createdAt || Math.floor(Date.now() / 1000),
  reason: input.reason,
  eventId: input.eventId,
})

export const makeProjection = (group: GroupEntity): GroupProjection => ({
  group,
  members: {},
  audit: [],
  sourceEvents: [],
})
