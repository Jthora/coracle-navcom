import type {EventTemplate, TrustedEvent} from "@welshman/util"
import {GROUP_KINDS} from "src/domain/group-kinds"
import type {GroupMemberRole} from "src/domain/group"

export type GroupControlAction =
  | "create"
  | "join"
  | "leave"
  | "put-member"
  | "remove-member"
  | "edit-metadata"

export const GROUP_CONTROL_REASON = {
  PERMISSION_DENIED: "GROUP_CONTROL_PERMISSION_DENIED",
  INVALID_INPUT: "GROUP_CONTROL_INVALID_INPUT",
} as const

export type GroupControlReasonCode =
  (typeof GROUP_CONTROL_REASON)[keyof typeof GROUP_CONTROL_REASON]

const ROLE_PRIORITY: Record<GroupMemberRole, number> = {
  member: 0,
  moderator: 1,
  admin: 2,
  owner: 3,
}

const ACTION_MIN_ROLE: Partial<Record<GroupControlAction, GroupMemberRole>> = {
  create: "admin",
  "put-member": "admin",
  "remove-member": "moderator",
  "edit-metadata": "admin",
}

export const canPerformGroupControlAction = (
  actorRole: GroupMemberRole,
  action: GroupControlAction,
) => {
  const minRole = ACTION_MIN_ROLE[action]

  if (!minRole) return true

  return ROLE_PRIORITY[actorRole] >= ROLE_PRIORITY[minRole]
}

const asTags = (pairs: Array<[string, string | undefined]>) =>
  pairs.filter(([, value]) => Boolean(value)).map(([k, v]) => [k, v as string])

export const buildGroupCreateTemplate = ({
  groupId,
  title,
  description,
  picture,
}: {
  groupId: string
  title?: string
  description?: string
  picture?: string
}): EventTemplate => ({
  kind: GROUP_KINDS.NIP29.CREATE_GROUP,
  tags: asTags([
    ["h", groupId],
    ["name", title],
    ["about", description],
    ["picture", picture],
  ]),
  content: "",
})

export const buildGroupJoinTemplate = ({
  groupId,
  memberPubkey,
  reason,
}: {
  groupId: string
  memberPubkey: string
  reason?: string
}): EventTemplate => ({
  kind: GROUP_KINDS.NIP29.JOIN_REQUEST,
  tags: asTags([
    ["h", groupId],
    ["p", memberPubkey],
  ]),
  content: reason || "",
})

export const buildGroupLeaveTemplate = ({
  groupId,
  memberPubkey,
  reason,
}: {
  groupId: string
  memberPubkey: string
  reason?: string
}): EventTemplate => ({
  kind: GROUP_KINDS.NIP29.LEAVE_REQUEST,
  tags: asTags([
    ["h", groupId],
    ["p", memberPubkey],
  ]),
  content: reason || "",
})

export const buildGroupPutMemberTemplate = ({
  groupId,
  memberPubkey,
  role,
  reason,
}: {
  groupId: string
  memberPubkey: string
  role?: GroupMemberRole
  reason?: string
}): EventTemplate => ({
  kind: GROUP_KINDS.NIP29.PUT_USER,
  tags: asTags([
    ["h", groupId],
    ["p", memberPubkey],
    ["role", role],
  ]),
  content: reason || "",
})

export const buildGroupRemoveMemberTemplate = ({
  groupId,
  memberPubkey,
  reason,
}: {
  groupId: string
  memberPubkey: string
  reason?: string
}): EventTemplate => ({
  kind: GROUP_KINDS.NIP29.REMOVE_USER,
  tags: asTags([
    ["h", groupId],
    ["p", memberPubkey],
  ]),
  content: reason || "",
})

export const buildGroupMetadataEditTemplate = ({
  groupId,
  title,
  description,
  picture,
  reason,
}: {
  groupId: string
  title?: string
  description?: string
  picture?: string
  reason?: string
}): EventTemplate => ({
  kind: GROUP_KINDS.NIP29.EDIT_METADATA,
  tags: asTags([
    ["h", groupId],
    ["name", title],
    ["about", description],
    ["picture", picture],
  ]),
  content: reason || "",
})

export const applyGroupControlEventsToProjection = (
  projection: {group: {id: string}},
  events: TrustedEvent[],
  apply: (projection: any, event: TrustedEvent) => any,
) =>
  events
    .slice()
    .sort((a, b) => a.created_at - b.created_at || a.id.localeCompare(b.id))
    .filter(event =>
      event.tags.some(tag => (tag[0] === "h" || tag[0] === "d") && tag[1] === projection.group.id),
    )
    .reduce((result, event) => apply(result, event), projection)
