import {mlKemKeygen, bytesToBase64} from "src/engine/pqc/crypto-provider"

export const PQC_KEY_SCHEMA_VERSION = 1 as const
export const DEFAULT_PQC_KEY_ROTATION_TTL_SECONDS = 60 * 60 * 24 * 90
export const DEFAULT_PQC_KEY_STALE_AFTER_SECONDS = 60 * 60 * 24

export const pqcKeyStatuses = ["active", "deprecated", "revoked"] as const

export type PqcKeyStatus = (typeof pqcKeyStatuses)[number]

export type PqcKeyPublicationRecord = {
  schema: number
  user_pubkey: string
  pq_alg: string
  pq_pub: string
  key_id: string
  created_at: number
  expires_at: number
  status: PqcKeyStatus
  device_hint?: string
}

export type PqcKeyValidationErrorCode =
  | "ERR_KEY_SCHEMA_INVALID"
  | "ERR_KEY_FIELD_MISSING"
  | "ERR_KEY_FIELD_INVALID"
  | "ERR_KEY_STATUS_INVALID"
  | "ERR_KEY_TIME_WINDOW_INVALID"
  | "ERR_KEY_NOT_ACTIVE"
  | "ERR_KEY_EXPIRED"

export type PqcKeyValidationResult =
  | {ok: true; value: PqcKeyPublicationRecord}
  | {
      ok: false
      code: PqcKeyValidationErrorCode
      message: string
      field?: string
    }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

export const isPqcKeyStatus = (value: unknown): value is PqcKeyStatus =>
  typeof value === "string" && pqcKeyStatuses.includes(value as PqcKeyStatus)

export const getPqcKeyFreshness = (
  record: Pick<PqcKeyPublicationRecord, "expires_at">,
  now = Math.floor(Date.now() / 1000),
) => (now > record.expires_at ? "expired" : "fresh")

export const getPqcKeyFreshnessState = (
  record: Pick<PqcKeyPublicationRecord, "expires_at">,
  {
    now = Math.floor(Date.now() / 1000),
    lastValidatedAt,
    staleAfterSeconds = DEFAULT_PQC_KEY_STALE_AFTER_SECONDS,
  }: {now?: number; lastValidatedAt?: number; staleAfterSeconds?: number} = {},
) => {
  if (now > record.expires_at) {
    return "expired" as const
  }

  if (typeof lastValidatedAt === "number" && now - lastValidatedAt > staleAfterSeconds) {
    return "stale" as const
  }

  return "fresh" as const
}

export const validatePqcKeyPublicationRecord = (
  input: unknown,
  {
    now = Math.floor(Date.now() / 1000),
    requireActive = false,
  }: {now?: number; requireActive?: boolean} = {},
): PqcKeyValidationResult => {
  if (!isRecord(input)) {
    return {
      ok: false,
      code: "ERR_KEY_FIELD_INVALID",
      message: "PQC key publication record must be an object.",
    }
  }

  const requiredStringFields = ["user_pubkey", "pq_alg", "pq_pub", "key_id"] as const

  for (const field of requiredStringFields) {
    if (typeof input[field] !== "string" || !String(input[field]).trim()) {
      return {
        ok: false,
        code: "ERR_KEY_FIELD_MISSING",
        message: `Missing required string field: ${field}`,
        field,
      }
    }
  }

  if (typeof input.schema !== "number" || input.schema !== PQC_KEY_SCHEMA_VERSION) {
    return {
      ok: false,
      code: "ERR_KEY_SCHEMA_INVALID",
      message: `Unsupported key schema version: ${String(input.schema)}`,
      field: "schema",
    }
  }

  if (typeof input.created_at !== "number" || typeof input.expires_at !== "number") {
    return {
      ok: false,
      code: "ERR_KEY_FIELD_INVALID",
      message: "created_at and expires_at must be numbers.",
      field: "created_at|expires_at",
    }
  }

  if (input.created_at > input.expires_at) {
    return {
      ok: false,
      code: "ERR_KEY_TIME_WINDOW_INVALID",
      message: "created_at cannot be greater than expires_at.",
      field: "created_at|expires_at",
    }
  }

  if (!isPqcKeyStatus(input.status)) {
    return {
      ok: false,
      code: "ERR_KEY_STATUS_INVALID",
      message: `Invalid key status: ${String(input.status)}`,
      field: "status",
    }
  }

  const record = input as PqcKeyPublicationRecord

  if (requireActive && record.status !== "active") {
    return {
      ok: false,
      code: "ERR_KEY_NOT_ACTIVE",
      message: `Key status must be active but was ${record.status}.`,
      field: "status",
    }
  }

  if (requireActive && getPqcKeyFreshness(record, now) === "expired") {
    return {
      ok: false,
      code: "ERR_KEY_EXPIRED",
      message: "Key is expired for active key requirement.",
      field: "expires_at",
    }
  }

  return {ok: true, value: record}
}

/**
 * Generate a fresh ML-KEM-768 keypair for PQC key publication.
 * Returns a PqcKeyPublicationRecord-shaped object with real key material.
 */
export const generatePqcKeyPair = ({
  userPubkey,
  deviceHint,
  ttlSeconds = DEFAULT_PQC_KEY_ROTATION_TTL_SECONDS,
}: {
  userPubkey: string
  deviceHint?: string
  ttlSeconds?: number
}): {record: PqcKeyPublicationRecord; secretKey: Uint8Array} => {
  const {publicKey, secretKey} = mlKemKeygen()
  const now = Math.floor(Date.now() / 1000)

  const record: PqcKeyPublicationRecord = {
    schema: PQC_KEY_SCHEMA_VERSION,
    user_pubkey: userPubkey,
    pq_alg: "mlkem768",
    pq_pub: bytesToBase64(publicKey),
    key_id: `mlkem768-${now}-${userPubkey.slice(0, 8)}`,
    created_at: now,
    expires_at: now + ttlSeconds,
    status: "active",
    ...(deviceHint ? {device_hint: deviceHint} : {}),
  }

  return {record, secretKey}
}

export const selectPreferredActivePqcKey = (
  records: PqcKeyPublicationRecord[],
  now = Math.floor(Date.now() / 1000),
) => {
  // Explicitly reject revoked and deprecated keys (defence-in-depth)
  const revokedCount = records.filter(r => r.status === "revoked").length
  const deprecatedCount = records.filter(r => r.status === "deprecated").length

  if (revokedCount > 0) {
    console.warn(`[PQC] Skipped ${revokedCount} revoked key(s) during selection`)
  }
  if (deprecatedCount > 0) {
    console.warn(`[PQC] Skipped ${deprecatedCount} deprecated key(s) during selection`)
  }

  const eligible = records.filter(
    record => record.status === "active" && getPqcKeyFreshness(record, now) === "fresh",
  )

  if (eligible.length === 0) {
    return null
  }

  return eligible.sort((a, b) => {
    if (a.created_at !== b.created_at) {
      return b.created_at - a.created_at
    }

    return b.key_id.localeCompare(a.key_id)
  })[0]
}

export type PqcKeySelectionErrorCode =
  | "NO_KEYS_AVAILABLE"
  | "ALL_KEYS_REVOKED"
  | "ALL_KEYS_EXPIRED"
  | "ALL_KEYS_DEPRECATED"
  | "NO_ACTIVE_FRESH_KEYS"

export type PqcKeySelectionResult =
  | {ok: true; key: PqcKeyPublicationRecord}
  | {ok: false; code: PqcKeySelectionErrorCode; message: string}

/**
 * Like selectPreferredActivePqcKey but returns a structured error
 * with a diagnostic reason when no valid key can be selected.
 */
export const selectPreferredActivePqcKeyOrError = (
  records: PqcKeyPublicationRecord[],
  now = Math.floor(Date.now() / 1000),
): PqcKeySelectionResult => {
  if (records.length === 0) {
    return {ok: false, code: "NO_KEYS_AVAILABLE", message: "No PQC keys found for recipient"}
  }

  const revokedCount = records.filter(r => r.status === "revoked").length
  const deprecatedCount = records.filter(r => r.status === "deprecated").length
  const expiredCount = records.filter(
    r => r.status === "active" && getPqcKeyFreshness(r, now) === "expired",
  ).length

  const selected = selectPreferredActivePqcKey(records, now)
  if (selected) {
    return {ok: true, key: selected}
  }

  if (revokedCount === records.length) {
    return {
      ok: false,
      code: "ALL_KEYS_REVOKED",
      message: "All recipient PQC keys have been revoked",
    }
  }
  if (deprecatedCount === records.length) {
    return {
      ok: false,
      code: "ALL_KEYS_DEPRECATED",
      message: "All recipient PQC keys are deprecated",
    }
  }
  if (expiredCount + revokedCount + deprecatedCount === records.length) {
    return {ok: false, code: "ALL_KEYS_EXPIRED", message: "All recipient PQC keys have expired"}
  }

  return {
    ok: false,
    code: "NO_ACTIVE_FRESH_KEYS",
    message: "No active and fresh PQC keys available for recipient",
  }
}
