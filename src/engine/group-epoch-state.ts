const SECURE_GROUP_EPOCH_SCHEMA_VERSION = 1 as const
const SECURE_GROUP_EPOCH_STORAGE_PREFIX = "secure-group-epoch-state:"

export type SecureGroupEpochState = {
  schema: typeof SECURE_GROUP_EPOCH_SCHEMA_VERSION
  groupId: string
  epochId: string
  sequence: number
  createdAt: number
  updatedAt: number
  integrity: string
}

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const defaultNow = () => Math.floor(Date.now() / 1000)

const hashValue = (value: string) => {
  let hash = 5381

  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i)
  }

  return (hash >>> 0).toString(36)
}

const toIntegrityPayload = (
  state: Omit<SecureGroupEpochState, "integrity"> | SecureGroupEpochState,
) =>
  [
    String(state.schema),
    state.groupId,
    state.epochId,
    String(state.sequence),
    String(state.createdAt),
    String(state.updatedAt),
  ].join("|")

export const computeSecureGroupEpochIntegrity = (
  state: Omit<SecureGroupEpochState, "integrity"> | SecureGroupEpochState,
) => hashValue(toIntegrityPayload(state))

export const isSecureGroupEpochState = (input: unknown): input is SecureGroupEpochState => {
  if (!input || typeof input !== "object") {
    return false
  }

  const candidate = input as Record<string, unknown>

  return (
    candidate.schema === SECURE_GROUP_EPOCH_SCHEMA_VERSION &&
    typeof candidate.groupId === "string" &&
    typeof candidate.epochId === "string" &&
    typeof candidate.sequence === "number" &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.updatedAt === "number" &&
    typeof candidate.integrity === "string"
  )
}

export const verifySecureGroupEpochIntegrity = (state: SecureGroupEpochState) =>
  computeSecureGroupEpochIntegrity(state) === state.integrity

const makeStorageKey = (groupId: string) => `${SECURE_GROUP_EPOCH_STORAGE_PREFIX}${groupId}`

export const createSecureGroupEpochState = ({
  groupId,
  epochId,
  sequence,
  createdAt,
  updatedAt,
}: {
  groupId: string
  epochId: string
  sequence: number
  createdAt: number
  updatedAt: number
}): SecureGroupEpochState => {
  const base = {
    schema: SECURE_GROUP_EPOCH_SCHEMA_VERSION,
    groupId,
    epochId,
    sequence,
    createdAt,
    updatedAt,
  }

  return {
    ...base,
    integrity: computeSecureGroupEpochIntegrity(base),
  }
}

export const loadSecureGroupEpochState = (
  storage: StorageLike | null | undefined,
  groupId: string,
) => {
  if (!storage || !groupId) {
    return null
  }

  const raw = storage.getItem(makeStorageKey(groupId))

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)

    if (!isSecureGroupEpochState(parsed)) {
      return null
    }

    return verifySecureGroupEpochIntegrity(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const saveSecureGroupEpochState = (
  storage: StorageLike | null | undefined,
  state: SecureGroupEpochState,
) => {
  if (!storage || !isSecureGroupEpochState(state) || !verifySecureGroupEpochIntegrity(state)) {
    return false
  }

  storage.setItem(makeStorageKey(state.groupId), JSON.stringify(state))

  return true
}

const defaultStorage =
  typeof globalThis !== "undefined" && "localStorage" in globalThis
    ? (globalThis.localStorage as StorageLike)
    : null

const nextEpochId = (groupId: string, sequence: number, at: number) =>
  `epoch:${groupId}:${sequence}:${at}`

export const ensureSecureGroupEpochState = (
  groupId: string,
  {at = defaultNow(), storage = defaultStorage}: {at?: number; storage?: StorageLike | null} = {},
) => {
  const existing = loadSecureGroupEpochState(storage, groupId)

  if (existing) {
    return existing
  }

  const created = createSecureGroupEpochState({
    groupId,
    epochId: nextEpochId(groupId, 1, at),
    sequence: 1,
    createdAt: at,
    updatedAt: at,
  })

  saveSecureGroupEpochState(storage, created)

  return created
}

export const advanceSecureGroupEpochState = (
  groupId: string,
  {at = defaultNow(), storage = defaultStorage}: {at?: number; storage?: StorageLike | null} = {},
) => {
  const current = ensureSecureGroupEpochState(groupId, {at, storage})
  const nextSequence = current.sequence + 1
  const advanced = createSecureGroupEpochState({
    groupId,
    epochId: nextEpochId(groupId, nextSequence, at),
    sequence: nextSequence,
    createdAt: current.createdAt,
    updatedAt: at,
  })

  saveSecureGroupEpochState(storage, advanced)

  return advanced
}

export const adoptSecureGroupEpochState = (
  groupId: string,
  {
    epochId,
    sequence,
    at = defaultNow(),
    storage = defaultStorage,
  }: {
    epochId: string
    sequence: number
    at?: number
    storage?: StorageLike | null
  },
) => {
  const current = ensureSecureGroupEpochState(groupId, {at, storage})

  const adopted = createSecureGroupEpochState({
    groupId,
    epochId,
    sequence,
    createdAt: current.createdAt,
    updatedAt: at,
  })

  saveSecureGroupEpochState(storage, adopted)

  return adopted
}

export const clearSecureGroupEpochState = (
  groupId: string,
  {storage = defaultStorage}: {storage?: StorageLike | null} = {},
) => {
  if (!storage || !groupId) {
    return
  }

  storage.removeItem(makeStorageKey(groupId))
}
