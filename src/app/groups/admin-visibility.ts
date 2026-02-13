import type {GroupMemberRole} from "src/domain/group"

export const GROUP_ADMIN_UI_CONTROL = {
  POLICY_EDITOR: "policy-editor",
  MODERATION_COMPOSER: "moderation-composer",
  PUT_MEMBER: "put-member",
  REMOVE_MEMBER: "remove-member",
  AUDIT_HISTORY: "audit-history",
} as const

export type GroupAdminUiControl =
  (typeof GROUP_ADMIN_UI_CONTROL)[keyof typeof GROUP_ADMIN_UI_CONTROL]

export type GroupAdminUiControlState = {
  visible: boolean
  enabled: boolean
  disabledReason?: string
}

export type GroupAdminUiVisibilityMap = Record<GroupAdminUiControl, GroupAdminUiControlState>

const ROLE_PRIORITY: Record<GroupMemberRole, number> = {
  member: 0,
  moderator: 1,
  admin: 2,
  owner: 3,
}

const canAccessAtLeastRole = (actorRole: GroupMemberRole, minRole: GroupMemberRole) =>
  ROLE_PRIORITY[actorRole] >= ROLE_PRIORITY[minRole]

export const createGroupAdminUiVisibilityMap = (
  actorRole: GroupMemberRole,
): GroupAdminUiVisibilityMap => {
  const canSeePolicyEditor = canAccessAtLeastRole(actorRole, "moderator")
  const canEditPolicyEditor = canAccessAtLeastRole(actorRole, "admin")
  const canSeeModerationComposer = canAccessAtLeastRole(actorRole, "moderator")
  const canSeePutMember = canAccessAtLeastRole(actorRole, "admin")
  const canSeeRemoveMember = canAccessAtLeastRole(actorRole, "moderator")

  return {
    [GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR]: {
      visible: canSeePolicyEditor,
      enabled: canEditPolicyEditor,
      disabledReason: canEditPolicyEditor
        ? undefined
        : "Admin role required to edit policy and metadata.",
    },
    [GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER]: {
      visible: canSeeModerationComposer,
      enabled: canSeeModerationComposer,
      disabledReason: undefined,
    },
    [GROUP_ADMIN_UI_CONTROL.PUT_MEMBER]: {
      visible: canSeePutMember,
      enabled: canSeePutMember,
      disabledReason: undefined,
    },
    [GROUP_ADMIN_UI_CONTROL.REMOVE_MEMBER]: {
      visible: canSeeRemoveMember,
      enabled: canSeeRemoveMember,
      disabledReason: undefined,
    },
    [GROUP_ADMIN_UI_CONTROL.AUDIT_HISTORY]: {
      visible: true,
      enabled: true,
      disabledReason: undefined,
    },
  }
}

export const hasAnyVisibleAdminAction = (visibility: GroupAdminUiVisibilityMap) =>
  visibility[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].visible ||
  visibility[GROUP_ADMIN_UI_CONTROL.PUT_MEMBER].visible ||
  visibility[GROUP_ADMIN_UI_CONTROL.REMOVE_MEMBER].visible
