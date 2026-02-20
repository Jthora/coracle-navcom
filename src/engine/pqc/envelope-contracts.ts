export const PQC_ENVELOPE_VERSION = 1 as const

export const requiredTopLevelFields = [
  "v",
  "mode",
  "alg",
  "nonce",
  "ct",
  "ad",
  "recipients",
  "ts",
  "msg_id",
] as const

export const optionalTopLevelFields = ["pad_len", "ext", "compat", "chunk"] as const

export const requiredRecipientFields = ["pk_ref", "kem_alg", "kem_ct"] as const

export const optionalRecipientFields = ["key_epoch", "flags"] as const

export type RequiredTopLevelField = (typeof requiredTopLevelFields)[number]
export type OptionalTopLevelField = (typeof optionalTopLevelFields)[number]

export type PqcEnvelopeRecipient = {
  pk_ref: string
  kem_alg: string
  kem_ct: string
  key_epoch?: string
  flags?: Record<string, unknown>
}

export type PqcEnvelope = {
  v: number
  mode: string
  alg: string
  nonce: string
  ct: string
  ad: string
  recipients: PqcEnvelopeRecipient[]
  ts: number
  msg_id: string
  pad_len?: number
  ext?: Record<string, unknown>
  compat?: Record<string, unknown>
  chunk?: {
    id: string
    index: number
    total: number
    hash: string
  }
}

export type EnvelopeValidationErrorCode =
  | "ERR_ENV_VERSION_UNSUPPORTED"
  | "ERR_ENV_FIELD_MISSING"
  | "ERR_ENV_FIELD_INVALID"
  | "ERR_ENV_CANONICALIZATION"
  | "ERR_ENV_RECIPIENT_WRAP_INVALID"
  | "ERR_ENV_CRITICAL_FIELD_UNSUPPORTED"

export type EnvelopeValidationResult =
  | {ok: true; value: PqcEnvelope}
  | {
      ok: false
      code: EnvelopeValidationErrorCode
      message: string
      field?: string
    }

export type EnvelopeValidationOptions = {
  strict?: boolean
  enforceCanonicalKeyOrder?: boolean
}
