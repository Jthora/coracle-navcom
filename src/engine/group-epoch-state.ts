import {
  hmacSha256Sync as hmacSha256,
  bytesToBase64Url,
  base64UrlToBytes,
} from "src/engine/crypto/sync-primitives"

const LEGACY_SECURE_GROUP_EPOCH_SCHEMA_VERSION = 1 as const
const SECURE_GROUP_EPOCH_SCHEMA_VERSION = 2 as const
const SECURE_GROUP_EPOCH_STORAGE_PREFIX = "secure-group-epoch-state:"
const SECURE_GROUP_EPOCH_INTEGRITY_KEY_STORAGE_KEY = "secure-group-epoch-integrity-key:v1"

export type SecureGroupEpochIntegrityAlgorithm = "hmac-sha256-v1" | "legacy-djb2-v1"

export type SecureGroupEpochState = {
  schema: typeof SECURE_GROUP_EPOCH_SCHEMA_VERSION
  groupId: string
  epochId: string
  sequence: number
  createdAt: number
  updatedAt: number
  integrityAlg: SecureGroupEpochIntegrityAlgorithm
  integrityKeyId: string
  integrityMac: string
}

type LegacySecureGroupEpochState = {
  schema: typeof LEGACY_SECURE_GROUP_EPOCH_SCHEMA_VERSION
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
const textEncoder = new TextEncoder()

const hashValue = (value: string) => {
  let hash = 5381

  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i)
  }

  return (hash >>> 0).toString(36)
}

const secureRandomBytes = (length: number) => {
  if (typeof globalThis === "undefined" || !globalThis.crypto?.getRandomValues) {
    return null
  }

  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)

  return bytes
}

const toIntegrityPayload = (
  state:
    | Omit<SecureGroupEpochState, "integrityAlg" | "integrityKeyId" | "integrityMac">
    | SecureGroupEpochState,
) =>
  [
    String(state.schema),
    state.groupId,
    state.epochId,
    String(state.sequence),
    String(state.createdAt),
    String(state.updatedAt),
  ].join("|")

const toLegacyIntegrityPayload = (
  state: Omit<LegacySecureGroupEpochState, "integrity"> | LegacySecureGroupEpochState,
) =>
  [
    String(state.schema),
    state.groupId,
    state.epochId,
    String(state.sequence),
    String(state.createdAt),
    String(state.updatedAt),
  ].join("|")

const resolveIntegrityAlgorithm = (storage: StorageLike | null | undefined) => {
  if (storage && secureRandomBytes(1)) {
    return "hmac-sha256-v1" as const
  }

  return "legacy-djb2-v1" as const
}

const resolveIntegrityKeyMaterial = (storage: StorageLike | null | undefined) => {
  if (!storage) {
    return null
  }

  try {
    const existing = storage.getItem(SECURE_GROUP_EPOCH_INTEGRITY_KEY_STORAGE_KEY)

    if (existing) {
      return existing
    }

    const generated = secureRandomBytes(32)

    if (!generated) {
      return null
    }

    const encoded = bytesToBase64Url(generated)
    storage.setItem(SECURE_GROUP_EPOCH_INTEGRITY_KEY_STORAGE_KEY, encoded)

    return encoded
  } catch {
    return null
  }
}

const computeSecureGroupEpochMac = ({
  algorithm,
  keyMaterial,
  payload,
}: {
  algorithm: SecureGroupEpochIntegrityAlgorithm
  keyMaterial?: string | null
  payload: string
}) => {
  if (algorithm === "legacy-djb2-v1") {
    return hashValue(payload)
  }

  if (!keyMaterial) {
    return null
  }

  const key = base64UrlToBytes(keyMaterial)
  const mac = hmacSha256(key, textEncoder.encode(payload))

  return bytesToBase64Url(mac)
}

export const computeSecureGroupEpochIntegrity = (
  state:
    | Omit<SecureGroupEpochState, "integrityAlg" | "integrityKeyId" | "integrityMac">
    | SecureGroupEpochState,
  {
    algorithm = "legacy-djb2-v1",
    keyMaterial,
  }: {
    algorithm?: SecureGroupEpochIntegrityAlgorithm
    keyMaterial?: string | null
  } = {},
) => computeSecureGroupEpochMac({algorithm, keyMaterial, payload: toIntegrityPayload(state)})

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
    (candidate.integrityAlg === "hmac-sha256-v1" || candidate.integrityAlg === "legacy-djb2-v1") &&
    typeof candidate.integrityKeyId === "string" &&
    typeof candidate.integrityMac === "string"
  )
}

const isLegacySecureGroupEpochState = (input: unknown): input is LegacySecureGroupEpochState => {
  if (!input || typeof input !== "object") {
    return false
  }

  const candidate = input as Record<string, unknown>

  return (
    candidate.schema === LEGACY_SECURE_GROUP_EPOCH_SCHEMA_VERSION &&
    typeof candidate.groupId === "string" &&
    typeof candidate.epochId === "string" &&
    typeof candidate.sequence === "number" &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.updatedAt === "number" &&
    typeof candidate.integrity === "string"
  )
}

const verifyLegacySecureGroupEpochIntegrity = (state: LegacySecureGroupEpochState) =>
  hashValue(toLegacyIntegrityPayload(state)) === state.integrity

export const verifySecureGroupEpochIntegrity = (
  state: SecureGroupEpochState,
  {
    keyMaterial,
  }: {
    keyMaterial?: string | null
  } = {},
) => {
  const mac = computeSecureGroupEpochMac({
    algorithm: state.integrityAlg,
    keyMaterial,
    payload: toIntegrityPayload(state),
  })

  return mac === state.integrityMac
}

const makeStorageKey = (groupId: string) => `${SECURE_GROUP_EPOCH_STORAGE_PREFIX}${groupId}`

export const createSecureGroupEpochState = ({
  groupId,
  epochId,
  sequence,
  createdAt,
  updatedAt,
  integrityAlg,
  integrityKeyId,
  integrityKeyMaterial,
}: {
  groupId: string
  epochId: string
  sequence: number
  createdAt: number
  updatedAt: number
  integrityAlg?: SecureGroupEpochIntegrityAlgorithm
  integrityKeyId?: string
  integrityKeyMaterial?: string | null
}): SecureGroupEpochState => {
  const resolvedAlg = integrityAlg || "legacy-djb2-v1"
  const resolvedKeyId = integrityKeyId || "local-legacy"
  const base = {
    schema: SECURE_GROUP_EPOCH_SCHEMA_VERSION,
    groupId,
    epochId,
    sequence,
    createdAt,
    updatedAt,
    integrityAlg: resolvedAlg,
    integrityKeyId: resolvedKeyId,
  }

  const integrityMac =
    computeSecureGroupEpochMac({
      algorithm: resolvedAlg,
      keyMaterial: integrityKeyMaterial,
      payload: toIntegrityPayload(base),
    }) || ""

  return {
    ...base,
    integrityMac,
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

    if (isSecureGroupEpochState(parsed)) {
      const keyMaterial =
        parsed.integrityAlg === "hmac-sha256-v1" ? resolveIntegrityKeyMaterial(storage) : undefined

      return verifySecureGroupEpochIntegrity(parsed, {keyMaterial}) ? parsed : null
    }

    if (!isLegacySecureGroupEpochState(parsed)) {
      return null
    }

    if (!verifyLegacySecureGroupEpochIntegrity(parsed)) {
      return null
    }

    const algorithm = resolveIntegrityAlgorithm(storage)
    const keyMaterial = algorithm === "hmac-sha256-v1" ? resolveIntegrityKeyMaterial(storage) : null

    const migrated = createSecureGroupEpochState({
      groupId: parsed.groupId,
      epochId: parsed.epochId,
      sequence: parsed.sequence,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
      integrityAlg: algorithm,
      integrityKeyId: algorithm === "hmac-sha256-v1" ? "local-v1" : "local-legacy",
      integrityKeyMaterial: keyMaterial,
    })

    saveSecureGroupEpochState(storage, migrated)

    return migrated
  } catch {
    return null
  }
}

export const saveSecureGroupEpochState = (
  storage: StorageLike | null | undefined,
  state: SecureGroupEpochState,
) => {
  const keyMaterial =
    state.integrityAlg === "hmac-sha256-v1" ? resolveIntegrityKeyMaterial(storage) : undefined

  if (
    !storage ||
    !isSecureGroupEpochState(state) ||
    !verifySecureGroupEpochIntegrity(state, {keyMaterial})
  ) {
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

  const integrityAlg = resolveIntegrityAlgorithm(storage)
  const integrityKeyMaterial =
    integrityAlg === "hmac-sha256-v1" ? resolveIntegrityKeyMaterial(storage) : null

  const created = createSecureGroupEpochState({
    groupId,
    epochId: nextEpochId(groupId, 1, at),
    sequence: 1,
    createdAt: at,
    updatedAt: at,
    integrityAlg,
    integrityKeyId: integrityAlg === "hmac-sha256-v1" ? "local-v1" : "local-legacy",
    integrityKeyMaterial,
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
  const integrityAlg = current.integrityAlg
  const integrityKeyMaterial =
    integrityAlg === "hmac-sha256-v1" ? resolveIntegrityKeyMaterial(storage) : null
  const advanced = createSecureGroupEpochState({
    groupId,
    epochId: nextEpochId(groupId, nextSequence, at),
    sequence: nextSequence,
    createdAt: current.createdAt,
    updatedAt: at,
    integrityAlg,
    integrityKeyId: current.integrityKeyId,
    integrityKeyMaterial,
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
  const integrityAlg = current.integrityAlg
  const integrityKeyMaterial =
    integrityAlg === "hmac-sha256-v1" ? resolveIntegrityKeyMaterial(storage) : null

  const adopted = createSecureGroupEpochState({
    groupId,
    epochId,
    sequence,
    createdAt: current.createdAt,
    updatedAt: at,
    integrityAlg,
    integrityKeyId: current.integrityKeyId,
    integrityKeyMaterial,
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
