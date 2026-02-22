type StorageLike = {
  getItem: (key: string) => string | null
}

export const GROUP_SECURE_PILOT_STORAGE_KEY = "group_secure_pilot_enabled"
export const GROUP_SECURE_PILOT_KILL_SWITCH_STORAGE_KEY = "group_secure_pilot_kill_switch"

export const resolveSecurePilotEnabled = ({
  envEnabled,
  envForceDisabled,
  storage,
}: {
  envEnabled: boolean
  envForceDisabled?: boolean
  storage?: StorageLike | null
}) => {
  if (envForceDisabled) {
    return {enabled: false, source: "kill-switch-env" as const}
  }

  let enabled = Boolean(envEnabled)
  let source: "env" | "storage" | "kill-switch-storage" = "env"

  try {
    const killSwitch = storage?.getItem(GROUP_SECURE_PILOT_KILL_SWITCH_STORAGE_KEY)

    if (killSwitch === "true") {
      return {enabled: false, source: "kill-switch-storage" as const}
    }

    const override = storage?.getItem(GROUP_SECURE_PILOT_STORAGE_KEY)

    if (override === "true") {
      enabled = true
      source = "storage"
    } else if (override === "false") {
      enabled = false
      source = "storage"
    }
  } catch {
    // Fall back to environment defaults when storage is unavailable.
  }

  return {enabled, source}
}

export const initializeSecurePilotRuntime = ({
  envEnabled,
  envForceDisabled,
  storage,
  setEnabled,
}: {
  envEnabled: boolean
  envForceDisabled?: boolean
  storage?: StorageLike | null
  setEnabled: (enabled: boolean) => void
}) => {
  const result = resolveSecurePilotEnabled({envEnabled, envForceDisabled, storage})

  setEnabled(result.enabled)

  return result
}
