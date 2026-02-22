export type GroupInviteRecoveryError = {
  reason: string
  value: unknown
}

const asInviteRecoveryErrors = (value: unknown): GroupInviteRecoveryError[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      entry =>
        entry &&
        typeof entry === "object" &&
        typeof (entry as Record<string, unknown>).reason === "string",
    )
    .map(entry => ({
      reason: (entry as Record<string, unknown>).reason as string,
      value: (entry as Record<string, unknown>).value,
    }))
}

export const buildRouteRecoveryRedirectContext = ({
  fromPath,
  message,
  reason,
  props,
}: {
  fromPath: string
  message: string
  reason: string
  props?: Record<string, unknown>
}) => {
  const inviteRecoveryErrors = asInviteRecoveryErrors(props?.groupInviteRecoveryErrors)

  return {
    guardMessage: message,
    guardFrom: fromPath,
    guardReason: reason,
    ...(inviteRecoveryErrors.length > 0 ? {groupInviteRecoveryErrors: inviteRecoveryErrors} : {}),
  }
}
