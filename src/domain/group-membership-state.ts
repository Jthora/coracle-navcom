import {
  makeMembership,
  type GroupMemberRole,
  type GroupMembership,
  type GroupMembershipStatus,
} from "src/domain/group"

export const GROUP_MEMBERSHIP_REASON = {
  INVALID_TRANSITION: "GROUP_MEMBERSHIP_INVALID_TRANSITION",
  PERMISSION_DENIED: "GROUP_MEMBERSHIP_PERMISSION_DENIED",
  STALE_EVENT: "GROUP_MEMBERSHIP_STALE_EVENT",
  DUPLICATE_EVENT: "GROUP_MEMBERSHIP_DUPLICATE_EVENT",
} as const

export type GroupMembershipReasonCode =
  (typeof GROUP_MEMBERSHIP_REASON)[keyof typeof GROUP_MEMBERSHIP_REASON]

export type MembershipTransitionAction =
  | "join-request"
  | "approve"
  | "reject"
  | "leave"
  | "remove"
  | "restore"
  | "set-role"

export type MembershipTransitionState = GroupMembershipStatus | "none"

export const GROUP_MEMBERSHIP_STATES: MembershipTransitionState[] = [
  "none",
  "pending",
  "active",
  "removed",
  "left",
]

export const GROUP_MEMBERSHIP_TRANSITIONS: Record<
  MembershipTransitionState,
  Partial<Record<MembershipTransitionAction, GroupMembershipStatus>>
> = {
  none: {
    "join-request": "pending",
    approve: "active",
  },
  pending: {
    approve: "active",
    reject: "removed",
    leave: "left",
    remove: "removed",
  },
  active: {
    leave: "left",
    remove: "removed",
    "set-role": "active",
  },
  removed: {
    restore: "pending",
  },
  left: {
    "join-request": "pending",
    approve: "active",
  },
}

const ROLE_PRIORITY: Record<GroupMemberRole, number> = {
  member: 0,
  moderator: 1,
  admin: 2,
  owner: 3,
}

const hasMinimumRole = (actual: GroupMemberRole, minimum: GroupMemberRole) =>
  ROLE_PRIORITY[actual] >= ROLE_PRIORITY[minimum]

const ACTION_MIN_ROLE: Partial<Record<MembershipTransitionAction, GroupMemberRole>> = {
  approve: "admin",
  reject: "admin",
  remove: "moderator",
  restore: "admin",
  "set-role": "admin",
}

export type MembershipTransitionInput = {
  groupId: string
  pubkey: string
  action: MembershipTransitionAction
  actorRole: GroupMemberRole
  eventAt: number
  eventId: string
  current?: GroupMembership
  requestedRole?: GroupMemberRole
}

export type MembershipTransitionResult =
  | {
      ok: true
      changed: boolean
      membership: GroupMembership
    }
  | {
      ok: false
      reason: GroupMembershipReasonCode
      current?: GroupMembership
    }

export const isNewerMembershipTransitionEvent = (
  current: GroupMembership | undefined,
  eventAt: number,
  eventId: string,
) => {
  if (!current) return {ok: true as const, duplicate: false}

  if (eventId === current.eventId) {
    return {ok: false as const, duplicate: true}
  }

  if (eventAt > current.updatedAt) {
    return {ok: true as const, duplicate: false}
  }

  if (eventAt < current.updatedAt) {
    return {ok: false as const, duplicate: false}
  }

  return {ok: eventId > (current.eventId || ""), duplicate: false}
}

const getCurrentState = (current?: GroupMembership): MembershipTransitionState =>
  current?.status || "none"

export const applyMembershipTransition = (
  input: MembershipTransitionInput,
): MembershipTransitionResult => {
  const {groupId, pubkey, action, actorRole, eventAt, eventId, current, requestedRole} = input

  const recency = isNewerMembershipTransitionEvent(current, eventAt, eventId)

  if (!recency.ok) {
    return {
      ok: false,
      reason: recency.duplicate
        ? GROUP_MEMBERSHIP_REASON.DUPLICATE_EVENT
        : GROUP_MEMBERSHIP_REASON.STALE_EVENT,
      current,
    }
  }

  const requiredRole = ACTION_MIN_ROLE[action]

  if (requiredRole && !hasMinimumRole(actorRole, requiredRole)) {
    return {
      ok: false,
      reason: GROUP_MEMBERSHIP_REASON.PERMISSION_DENIED,
      current,
    }
  }

  const currentState = getCurrentState(current)
  const nextStatus = GROUP_MEMBERSHIP_TRANSITIONS[currentState][action]

  if (!nextStatus) {
    return {
      ok: false,
      reason: GROUP_MEMBERSHIP_REASON.INVALID_TRANSITION,
      current,
    }
  }

  const nextRole =
    action === "set-role" ? requestedRole || current?.role || "member" : current?.role || "member"

  const membership = makeMembership({
    groupId,
    pubkey,
    role: nextRole,
    status: nextStatus,
    updatedAt: eventAt,
    eventId,
  })

  return {
    ok: true,
    changed:
      !current ||
      current.status !== membership.status ||
      current.role !== membership.role ||
      current.updatedAt !== membership.updatedAt ||
      current.eventId !== membership.eventId,
    membership,
  }
}
