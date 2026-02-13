import type {GroupMemberRole, GroupProjection} from "src/domain/group"
import {
  GROUP_PROJECTION_STALE_AFTER_SECONDS,
  isGroupProjectionStale,
} from "src/domain/group-projection"

const ROLE_PRIORITY: Record<GroupMemberRole, number> = {
  member: 0,
  moderator: 1,
  admin: 2,
  owner: 3,
}

export const GROUP_DETAIL_MEMBER_PREVIEW_LIMIT = 8
export const GROUP_DETAIL_AUDIT_PREVIEW_LIMIT = 10

export type GroupDetailMemberPreview = {
  pubkey: string
  role: GroupMemberRole
  status: string
  updatedAt: number
}

export type GroupDetailAuditPreview = {
  action: string
  actor: string
  reason?: string
  createdAt: number
}

export type GroupDetailViewModel = {
  id: string
  title: string
  description: string
  picture?: string
  protocol: string
  transportMode: string
  memberCount: number
  activeMemberCount: number
  pendingMemberCount: number
  lastUpdated: number
  stale: boolean
  memberPreview: GroupDetailMemberPreview[]
  auditPreview: GroupDetailAuditPreview[]
}

export const buildGroupDetailViewModel = (
  projection: GroupProjection,
  {
    now = Math.floor(Date.now() / 1000),
    staleAfterSeconds = GROUP_PROJECTION_STALE_AFTER_SECONDS,
    memberLimit = GROUP_DETAIL_MEMBER_PREVIEW_LIMIT,
    auditLimit = GROUP_DETAIL_AUDIT_PREVIEW_LIMIT,
  }: {
    now?: number
    staleAfterSeconds?: number
    memberLimit?: number
    auditLimit?: number
  } = {},
): GroupDetailViewModel => {
  const members = Object.values(projection.members)
  const activeMembers = members.filter(member => member.status === "active")
  const pendingMembers = members.filter(member => member.status === "pending")

  const memberPreview = members
    .slice()
    .sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === "active" ? -1 : 1
      }

      if (left.role !== right.role) {
        return ROLE_PRIORITY[right.role] - ROLE_PRIORITY[left.role]
      }

      return right.updatedAt - left.updatedAt
    })
    .slice(0, memberLimit)
    .map(member => ({
      pubkey: member.pubkey,
      role: member.role,
      status: member.status,
      updatedAt: member.updatedAt,
    }))

  const auditPreview = projection.audit.slice(0, auditLimit).map(entry => ({
    action: entry.action,
    actor: entry.actor,
    reason: entry.reason,
    createdAt: entry.createdAt,
  }))

  return {
    id: projection.group.id,
    title: projection.group.title || projection.group.id,
    description: projection.group.description,
    picture: projection.group.picture,
    protocol: projection.group.protocol,
    transportMode: projection.group.transportMode,
    memberCount: members.length,
    activeMemberCount: activeMembers.length,
    pendingMemberCount: pendingMembers.length,
    lastUpdated: projection.group.updatedAt,
    stale: isGroupProjectionStale(projection, now, staleAfterSeconds),
    memberPreview,
    auditPreview,
  }
}

export const getGroupRouteSection = (
  path: string,
): "overview" | "members" | "moderation" | "settings" => {
  if (path.endsWith("/members")) return "members"
  if (path.endsWith("/moderation")) return "moderation"
  if (path.endsWith("/settings")) return "settings"

  return "overview"
}
