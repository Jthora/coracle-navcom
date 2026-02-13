const SECURE_GROUP_STATE_SCHEMA_VERSION = 1 as const

export type SecureGroupEncryptionAlgorithm = "AES-GCM-256"

export type SecureGroupStateEnvelope = {
  version: typeof SECURE_GROUP_STATE_SCHEMA_VERSION
  algorithm: SecureGroupEncryptionAlgorithm
  accountId: string
  groupId: string
  keyContext: string
  saltBase64: string
  ivBase64: string
  ciphertextBase64: string
  createdAt: number
  updatedAt: number
}

export type SecureGroupStateRecord = {
  id: string
  accountId: string
  groupId: string
  envelope: SecureGroupStateEnvelope
}

export type SecureGroupStateStore = {
  put: (record: SecureGroupStateRecord) => Promise<void>
  get: (id: string) => Promise<SecureGroupStateRecord | null>
  delete: (id: string) => Promise<void>
  listByAccount: (accountId: string) => Promise<SecureGroupStateRecord[]>
}

export type EncryptSecureGroupStateInput = {
  accountId: string
  groupId: string
  encryptionRoot: string
  state: unknown
  now?: number
}

export type DecryptSecureGroupStateInput = {
  record: SecureGroupStateRecord
  encryptionRoot: string
}

export type MigrateLegacySecureGroupStateInput = {
  accountId: string
  encryptionRoot: string
  legacyByGroupId: Record<string, unknown>
  now?: number
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const randomBytes = (length: number) => {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)

  return bytes
}

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ""

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })

  if (typeof btoa === "function") {
    return btoa(binary)
  }

  throw new Error("Base64 encoder is unavailable in this runtime.")
}

const base64ToBytes = (value: string) => {
  if (typeof atob === "function") {
    const decoded = atob(value)
    const bytes = new Uint8Array(decoded.length)

    for (let index = 0; index < decoded.length; index++) {
      bytes[index] = decoded.charCodeAt(index)
    }

    return bytes
  }

  throw new Error("Base64 decoder is unavailable in this runtime.")
}

const toRecordId = (accountId: string, groupId: string) =>
  `secure-group-state:${accountId}:${groupId}`

const toKeyContext = (accountId: string, groupId: string) => `secure-group:${accountId}:${groupId}`

const deriveAesGcmKey = async ({
  encryptionRoot,
  accountId,
  keyContext,
  salt,
}: {
  encryptionRoot: string
  accountId: string
  keyContext: string
  salt: Uint8Array
}) => {
  const rootMaterial = textEncoder.encode(`${encryptionRoot}:${accountId}`)
  const rootKey = await globalThis.crypto.subtle.importKey(
    "raw",
    rootMaterial,
    {name: "PBKDF2"},
    false,
    ["deriveKey"],
  )

  return globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: textEncoder.encode(`${keyContext}:${bytesToBase64(salt)}`),
      iterations: 120_000,
    },
    rootKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  )
}

export const encryptSecureGroupState = async ({
  accountId,
  groupId,
  encryptionRoot,
  state,
  now = Math.floor(Date.now() / 1000),
}: EncryptSecureGroupStateInput): Promise<SecureGroupStateRecord> => {
  const id = toRecordId(accountId, groupId)
  const keyContext = toKeyContext(accountId, groupId)
  const salt = randomBytes(16)
  const iv = randomBytes(12)

  const key = await deriveAesGcmKey({
    encryptionRoot,
    accountId,
    keyContext,
    salt,
  })

  const plaintext = textEncoder.encode(JSON.stringify(state))
  const ciphertextBuffer = await globalThis.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    plaintext,
  )

  const envelope: SecureGroupStateEnvelope = {
    version: SECURE_GROUP_STATE_SCHEMA_VERSION,
    algorithm: "AES-GCM-256",
    accountId,
    groupId,
    keyContext,
    saltBase64: bytesToBase64(salt),
    ivBase64: bytesToBase64(iv),
    ciphertextBase64: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    createdAt: now,
    updatedAt: now,
  }

  return {
    id,
    accountId,
    groupId,
    envelope,
  }
}

export const decryptSecureGroupState = async <T = unknown>({
  record,
  encryptionRoot,
}: DecryptSecureGroupStateInput): Promise<T> => {
  const {envelope} = record

  if (envelope.version !== SECURE_GROUP_STATE_SCHEMA_VERSION) {
    throw new Error("Unsupported secure group state schema version.")
  }

  const salt = base64ToBytes(envelope.saltBase64)
  const iv = base64ToBytes(envelope.ivBase64)
  const ciphertext = base64ToBytes(envelope.ciphertextBase64)

  const key = await deriveAesGcmKey({
    encryptionRoot,
    accountId: envelope.accountId,
    keyContext: envelope.keyContext,
    salt,
  })

  const plaintext = await globalThis.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    ciphertext,
  )

  return JSON.parse(textDecoder.decode(plaintext)) as T
}

export const createSecureGroupStateMemoryStore = (): SecureGroupStateStore => {
  const byId = new Map<string, SecureGroupStateRecord>()

  return {
    put: async record => {
      byId.set(record.id, record)
    },
    get: async id => byId.get(id) || null,
    delete: async id => {
      byId.delete(id)
    },
    listByAccount: async accountId =>
      Array.from(byId.values()).filter(record => record.accountId === accountId),
  }
}

export const writeEncryptedSecureGroupState = async (
  store: SecureGroupStateStore,
  input: EncryptSecureGroupStateInput,
) => {
  const record = await encryptSecureGroupState(input)
  await store.put(record)

  return record
}

export const readEncryptedSecureGroupState = async <T = unknown>(
  store: SecureGroupStateStore,
  {
    accountId,
    groupId,
    encryptionRoot,
  }: {
    accountId: string
    groupId: string
    encryptionRoot: string
  },
): Promise<T | null> => {
  const record = await store.get(toRecordId(accountId, groupId))

  if (!record) {
    return null
  }

  return decryptSecureGroupState<T>({record, encryptionRoot})
}

export const migrateLegacyPlaintextSecureGroupState = async ({
  accountId,
  encryptionRoot,
  legacyByGroupId,
  now = Math.floor(Date.now() / 1000),
}: MigrateLegacySecureGroupStateInput) => {
  const records: SecureGroupStateRecord[] = []

  for (const [groupId, state] of Object.entries(legacyByGroupId)) {
    records.push(
      await encryptSecureGroupState({
        accountId,
        groupId,
        encryptionRoot,
        state,
        now,
      }),
    )
  }

  return records
}
