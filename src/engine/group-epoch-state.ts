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

const rotr = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount))

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

const sha256 = (input: Uint8Array) => {
  const messageLength = input.length
  const bitLength = messageLength * 8
  const paddedLength = (((messageLength + 9 + 63) >> 6) << 6) >>> 0
  const padded = new Uint8Array(paddedLength)

  padded.set(input)
  padded[messageLength] = 0x80

  const dataView = new DataView(padded.buffer)
  dataView.setUint32(paddedLength - 8, Math.floor(bitLength / 0x1_0000_0000), false)
  dataView.setUint32(paddedLength - 4, bitLength >>> 0, false)

  let h0 = 0x6a09e667
  let h1 = 0xbb67ae85
  let h2 = 0x3c6ef372
  let h3 = 0xa54ff53a
  let h4 = 0x510e527f
  let h5 = 0x9b05688c
  let h6 = 0x1f83d9ab
  let h7 = 0x5be0cd19

  const w = new Uint32Array(64)

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = dataView.getUint32(offset + i * 4, false)
    }

    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4
    let f = h5
    let g = h6
    let h = h7

    for (let i = 0; i < 64; i += 1) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + s1 + ch + SHA256_K[i] + w[i]) >>> 0
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (s0 + maj) >>> 0

      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
    h5 = (h5 + f) >>> 0
    h6 = (h6 + g) >>> 0
    h7 = (h7 + h) >>> 0
  }

  const digest = new Uint8Array(32)
  const digestView = new DataView(digest.buffer)
  digestView.setUint32(0, h0, false)
  digestView.setUint32(4, h1, false)
  digestView.setUint32(8, h2, false)
  digestView.setUint32(12, h3, false)
  digestView.setUint32(16, h4, false)
  digestView.setUint32(20, h5, false)
  digestView.setUint32(24, h6, false)
  digestView.setUint32(28, h7, false)

  return digest
}

const bytesToBase64Url = (bytes: Uint8Array) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

  if (typeof btoa !== "function") {
    let output = ""

    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i]!
      const b = bytes[i + 1]
      const c = bytes[i + 2]

      output += alphabet[a >> 2]
      output += alphabet[((a & 0x03) << 4) | ((b ?? 0) >> 4)]
      output += b === undefined ? "=" : alphabet[((b & 0x0f) << 2) | ((c ?? 0) >> 6)]
      output += c === undefined ? "=" : alphabet[c & 0x3f]
    }

    return output.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
  }

  let binary = ""

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })

  const base64 = btoa(binary)

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

const base64UrlToBytes = (value: string) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  const reverse = new Map<string, number>()

  for (let i = 0; i < alphabet.length; i += 1) {
    reverse.set(alphabet[i]!, i)
  }

  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4 || 4)) % 4)

  if (typeof atob !== "function") {
    const output = [] as number[]

    for (let i = 0; i < padded.length; i += 4) {
      const c1 = padded[i]
      const c2 = padded[i + 1]
      const c3 = padded[i + 2]
      const c4 = padded[i + 3]

      if (!c1 || !c2) {
        break
      }

      const n1 = reverse.get(c1) ?? 0
      const n2 = reverse.get(c2) ?? 0
      const n3 = c3 === "=" || !c3 ? 0 : (reverse.get(c3) ?? 0)
      const n4 = c4 === "=" || !c4 ? 0 : (reverse.get(c4) ?? 0)

      output.push(((n1 << 2) | (n2 >> 4)) & 0xff)

      if (c3 !== "=" && c3) {
        output.push((((n2 & 0x0f) << 4) | (n3 >> 2)) & 0xff)
      }

      if (c4 !== "=" && c4) {
        output.push((((n3 & 0x03) << 6) | n4) & 0xff)
      }
    }

    return new Uint8Array(output)
  }

  const decoded = atob(padded)
  const bytes = new Uint8Array(decoded.length)

  for (let i = 0; i < decoded.length; i += 1) {
    bytes[i] = decoded.charCodeAt(i)
  }

  return bytes
}

const hmacSha256 = (key: Uint8Array, message: Uint8Array) => {
  const blockSize = 64
  let normalizedKey = key

  if (normalizedKey.length > blockSize) {
    normalizedKey = sha256(normalizedKey)
  }

  if (normalizedKey.length < blockSize) {
    const extended = new Uint8Array(blockSize)
    extended.set(normalizedKey)
    normalizedKey = extended
  }

  const oKeyPad = new Uint8Array(blockSize)
  const iKeyPad = new Uint8Array(blockSize)

  for (let i = 0; i < blockSize; i += 1) {
    oKeyPad[i] = normalizedKey[i] ^ 0x5c
    iKeyPad[i] = normalizedKey[i] ^ 0x36
  }

  const inner = new Uint8Array(iKeyPad.length + message.length)
  inner.set(iKeyPad)
  inner.set(message, iKeyPad.length)

  const innerHash = sha256(inner)
  const outer = new Uint8Array(oKeyPad.length + innerHash.length)
  outer.set(oKeyPad)
  outer.set(innerHash, oKeyPad.length)

  return sha256(outer)
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
