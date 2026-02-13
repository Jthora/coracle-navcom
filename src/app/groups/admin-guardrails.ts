export const ADMIN_DESTRUCTIVE_ACTION = {
  REMOVE_MEMBER: "remove-member",
} as const

export type AdminDestructiveAction =
  (typeof ADMIN_DESTRUCTIVE_ACTION)[keyof typeof ADMIN_DESTRUCTIVE_ACTION]

export const buildDestructiveConfirmationToken = ({
  action,
  groupId,
}: {
  action: AdminDestructiveAction
  groupId: string
}) => `${action}:${groupId}`

export const canRunDestructiveAction = ({
  action,
  groupId,
  confirmationInput,
  reason,
}: {
  action: AdminDestructiveAction
  groupId: string
  confirmationInput: string
  reason?: string
}) => {
  const expected = buildDestructiveConfirmationToken({action, groupId})

  if ((confirmationInput || "").trim() !== expected) {
    return {
      ok: false,
      message: `Enter '${expected}' to confirm this destructive action.`,
    }
  }

  if (!(reason || "").trim()) {
    return {
      ok: false,
      message: "Provide a reason for this destructive action.",
    }
  }

  return {ok: true, message: ""}
}
