export type GroupSecretClass = "S1" | "S2" | "S3" | "S4" | "S5"

export type GroupKeyLifecycleStatus = "active" | "rotating" | "revoked" | "destroyed" | "expired"

export type GroupKeyUseAction = "send" | "subscribe" | "reconcile" | "control"

export type GroupKeyLifecycleState = {
  keyId: string
  groupId: string
  secretClass: GroupSecretClass
  status: GroupKeyLifecycleStatus
  createdAt: number
  updatedAt: number
  expiresAt?: number
  lastUsedAt?: number
  useCount: number
  usageByAction: Record<GroupKeyUseAction, number>
}

export type RegisterGroupKeyInput = {
  keyId: string
  groupId: string
  secretClass: GroupSecretClass
  createdAt?: number
  expiresAt?: number
}

export type RecordGroupKeyUseInput = {
  keyId: string
  groupId: string
  action: GroupKeyUseAction
  at?: number
}

export type GroupKeyUseResult =
  | {
      ok: true
      state: GroupKeyLifecycleState
    }
  | {
      ok: false
      reason: string
      state?: GroupKeyLifecycleState
    }

export type GroupKeyLifecycleRegistry = {
  registerKey: (input: RegisterGroupKeyInput) => GroupKeyLifecycleState
  getKeyState: (groupId: string, keyId: string) => GroupKeyLifecycleState | null
  listGroupKeyStates: (groupId?: string) => GroupKeyLifecycleState[]
  setKeyStatus: (
    groupId: string,
    keyId: string,
    status: GroupKeyLifecycleStatus,
    at?: number,
  ) => GroupKeyLifecycleState | null
  setGroupKeyStatus: (
    groupId: string,
    status: GroupKeyLifecycleStatus,
    at?: number,
  ) => GroupKeyLifecycleState[]
  recordKeyUse: (input: RecordGroupKeyUseInput) => GroupKeyUseResult
  enforceExpiry: (groupId?: string, at?: number) => GroupKeyLifecycleState[]
  reset: () => void
}

const DEFAULT_SECURE_GROUP_KEY_TTL_SECONDS = 60 * 60 * 24

const makeRegistryKey = (groupId: string, keyId: string) => `${groupId}:${keyId}`

const baseUsageCounters = (): Record<GroupKeyUseAction, number> => ({
  send: 0,
  subscribe: 0,
  reconcile: 0,
  control: 0,
})

const isTerminalState = (status: GroupKeyLifecycleStatus) =>
  status === "expired" || status === "revoked" || status === "destroyed"

export const createGroupKeyLifecycleRegistry = (
  nowProvider: () => number = () => Math.floor(Date.now() / 1000),
): GroupKeyLifecycleRegistry => {
  const byKey = new Map<string, GroupKeyLifecycleState>()

  const registerKey = ({
    keyId,
    groupId,
    secretClass,
    createdAt,
    expiresAt,
  }: RegisterGroupKeyInput) => {
    const now = createdAt ?? nowProvider()
    const registryKey = makeRegistryKey(groupId, keyId)
    const existing = byKey.get(registryKey)

    if (existing) {
      const next: GroupKeyLifecycleState = {
        ...existing,
        secretClass,
        expiresAt,
        updatedAt: now,
      }

      byKey.set(registryKey, next)

      return next
    }

    const state: GroupKeyLifecycleState = {
      keyId,
      groupId,
      secretClass,
      status: "active",
      createdAt: now,
      updatedAt: now,
      expiresAt,
      useCount: 0,
      usageByAction: baseUsageCounters(),
    }

    byKey.set(registryKey, state)

    return state
  }

  const getKeyState = (groupId: string, keyId: string) =>
    byKey.get(makeRegistryKey(groupId, keyId)) || null

  const listGroupKeyStates = (groupId?: string) => {
    const all = Array.from(byKey.values())

    if (!groupId) {
      return all
    }

    return all.filter(state => state.groupId === groupId)
  }

  const enforceExpiry = (groupId?: string, at?: number) => {
    const now = at ?? nowProvider()
    const expired: GroupKeyLifecycleState[] = []

    for (const state of listGroupKeyStates(groupId)) {
      if (isTerminalState(state.status)) {
        continue
      }

      if (typeof state.expiresAt === "number" && now >= state.expiresAt) {
        const next: GroupKeyLifecycleState = {
          ...state,
          status: "expired",
          updatedAt: now,
        }

        byKey.set(makeRegistryKey(state.groupId, state.keyId), next)
        expired.push(next)
      }
    }

    return expired
  }

  const recordKeyUse = ({
    keyId,
    groupId,
    action,
    at,
  }: RecordGroupKeyUseInput): GroupKeyUseResult => {
    const now = at ?? nowProvider()

    enforceExpiry(groupId, now)

    const state = getKeyState(groupId, keyId)

    if (!state) {
      return {
        ok: false,
        reason: "Key state is not registered.",
      }
    }

    if (isTerminalState(state.status)) {
      return {
        ok: false,
        reason: `Key is not usable because it is ${state.status}.`,
        state,
      }
    }

    const next: GroupKeyLifecycleState = {
      ...state,
      updatedAt: now,
      lastUsedAt: now,
      useCount: state.useCount + 1,
      usageByAction: {
        ...state.usageByAction,
        [action]: state.usageByAction[action] + 1,
      },
    }

    byKey.set(makeRegistryKey(groupId, keyId), next)

    return {
      ok: true,
      state: next,
    }
  }

  const reset = () => {
    byKey.clear()
  }

  const setKeyStatus = (
    groupId: string,
    keyId: string,
    status: GroupKeyLifecycleStatus,
    at?: number,
  ) => {
    const now = at ?? nowProvider()
    const current = getKeyState(groupId, keyId)

    if (!current) {
      return null
    }

    const next: GroupKeyLifecycleState = {
      ...current,
      status,
      updatedAt: now,
    }

    byKey.set(makeRegistryKey(groupId, keyId), next)

    return next
  }

  const setGroupKeyStatus = (groupId: string, status: GroupKeyLifecycleStatus, at?: number) => {
    const now = at ?? nowProvider()
    const updated: GroupKeyLifecycleState[] = []

    for (const state of listGroupKeyStates(groupId)) {
      const next = setKeyStatus(groupId, state.keyId, status, now)

      if (next) {
        updated.push(next)
      }
    }

    return updated
  }

  return {
    registerKey,
    getKeyState,
    listGroupKeyStates,
    setKeyStatus,
    setGroupKeyStatus,
    recordKeyUse,
    enforceExpiry,
    reset,
  }
}

const secureTransportRegistry = createGroupKeyLifecycleRegistry()

const getSecureTransportSessionKeyId = (groupId: string) => `secure-session:${groupId}`

export type PrepareSecureGroupKeyUseInput = {
  groupId: string
  action: GroupKeyUseAction
  now?: number
  ttlSeconds?: number
}

export type PrepareSecureGroupKeyUseResult =
  | {
      ok: true
      keyId: string
      state: GroupKeyLifecycleState
    }
  | {
      ok: false
      reason: string
      keyId: string
      state?: GroupKeyLifecycleState
    }

export const prepareSecureGroupKeyUse = ({
  groupId,
  action,
  now,
  ttlSeconds = DEFAULT_SECURE_GROUP_KEY_TTL_SECONDS,
}: PrepareSecureGroupKeyUseInput): PrepareSecureGroupKeyUseResult => {
  const timestamp = now ?? Math.floor(Date.now() / 1000)
  const keyId = getSecureTransportSessionKeyId(groupId)
  const expiresAt = timestamp + ttlSeconds

  if (!secureTransportRegistry.getKeyState(groupId, keyId)) {
    secureTransportRegistry.registerKey({
      keyId,
      groupId,
      secretClass: "S2",
      createdAt: timestamp,
      expiresAt,
    })
  }

  secureTransportRegistry.enforceExpiry(groupId, timestamp)

  const usage = secureTransportRegistry.recordKeyUse({
    keyId,
    groupId,
    action,
    at: timestamp,
  })

  if (!usage.ok) {
    return {
      ok: false,
      reason: "reason" in usage ? usage.reason : "GROUP_KEY_USE_FAILED",
      keyId,
      state: usage.state,
    }
  }

  return {
    ok: true,
    keyId,
    state: usage.state,
  }
}

export const getSecureGroupKeyState = (groupId: string) =>
  secureTransportRegistry.getKeyState(groupId, getSecureTransportSessionKeyId(groupId))

export const listSecureGroupKeyStates = (groupId?: string) =>
  secureTransportRegistry.listGroupKeyStates(groupId)

export const enforceSecureGroupKeyExpiry = (groupId?: string, at?: number) =>
  secureTransportRegistry.enforceExpiry(groupId, at)

export const setSecureGroupKeyStatus = (
  groupId: string,
  status: GroupKeyLifecycleStatus,
  at?: number,
) => secureTransportRegistry.setGroupKeyStatus(groupId, status, at)

export const revokeSecureGroupKeys = (groupId: string, at?: number) =>
  setSecureGroupKeyStatus(groupId, "revoked", at)

export const resetSecureGroupKeyLifecycle = () => {
  secureTransportRegistry.reset()
}
