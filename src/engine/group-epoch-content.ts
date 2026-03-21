import {
  aesGcmEncrypt,
  aesGcmDecrypt,
  importAesGcmKey,
  randomNonce,
  bytesToBase64,
  base64ToBytes,
  stringToBytes,
  bytesToString,
} from "src/engine/pqc/crypto-provider"

export const GROUP_EPOCH_CONTENT_VERSION = 1 as const
export const GROUP_EPOCH_CONTENT_VERSION_PQ = 2 as const
export const GROUP_EPOCH_CONTENT_ALGORITHM = "aes-256-gcm"
export const GROUP_EPOCH_CONTENT_ALGORITHM_PQ = "ml-kem-768-hkdf-aes256-gcm"

export type SecureGroupEpochContentEnvelope = {
  v: typeof GROUP_EPOCH_CONTENT_VERSION
  mode: "group-epoch-v1"
  alg: typeof GROUP_EPOCH_CONTENT_ALGORITHM
  epoch_id: string
  nonce: string
  ad: string
  ct: string
  ts: number
}

export type SecureGroupEpochContentEnvelopePQ = {
  v: typeof GROUP_EPOCH_CONTENT_VERSION_PQ
  mode: "group-epoch-pq-v1"
  alg: typeof GROUP_EPOCH_CONTENT_ALGORITHM_PQ
  epoch_id: string
  nonce: string
  ad: string
  ct: string
  ts: number
}

export type AnySecureGroupEpochContentEnvelope =
  | SecureGroupEpochContentEnvelope
  | SecureGroupEpochContentEnvelopePQ

export type SecureGroupEpochContentEncodeResult =
  | {
      ok: true
      envelope: AnySecureGroupEpochContentEnvelope
      content: string
    }
  | {
      ok: false
      reason: "GROUP_EPOCH_CONTENT_ENCODE_FAILED"
      message: string
    }

export type SecureGroupEpochContentDecodeResult =
  | {
      ok: true
      plaintext: string
      envelope: AnySecureGroupEpochContentEnvelope
    }
  | {
      ok: false
      reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED"
      message: string
    }

const buildAssociatedData = ({
  groupId,
  epochId,
  senderPubkey,
  recipients,
  createdAt,
  pqDerived = false,
}: {
  groupId: string
  epochId: string
  senderPubkey: string
  recipients: string[]
  createdAt: number
  pqDerived?: boolean
}) =>
  JSON.stringify({
    group_id: groupId,
    epoch_id: epochId,
    sender: senderPubkey,
    recipients: [...recipients].sort(),
    created_at: createdAt,
    envelope_version: pqDerived ? GROUP_EPOCH_CONTENT_VERSION_PQ : GROUP_EPOCH_CONTENT_VERSION,
    algorithm: pqDerived ? GROUP_EPOCH_CONTENT_ALGORITHM_PQ : GROUP_EPOCH_CONTENT_ALGORITHM,
  })

export const encodeSecureGroupEpochContent = async ({
  groupId,
  epochId,
  plaintext,
  senderPubkey,
  recipients,
  epochKeyBytes,
  pqDerived = false,
  createdAt = Math.floor(Date.now() / 1000),
}: {
  groupId: string
  epochId: string
  plaintext: string
  senderPubkey: string
  recipients: string[]
  epochKeyBytes: Uint8Array
  pqDerived?: boolean
  createdAt?: number
}): Promise<SecureGroupEpochContentEncodeResult> => {
  if (!groupId || !epochId) {
    return {
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_ENCODE_FAILED",
      message: "Secure group epoch metadata is unavailable for content encryption.",
    }
  }

  if (!senderPubkey || recipients.length === 0 || !plaintext) {
    return {
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_ENCODE_FAILED",
      message: "Secure group content encryption requires sender, recipients, and plaintext.",
    }
  }

  try {
    const nonce = randomNonce()
    const adString = buildAssociatedData({
      groupId,
      epochId,
      senderPubkey,
      recipients,
      createdAt,
      pqDerived,
    })
    const adBytes = stringToBytes(adString)

    const key = await importAesGcmKey(epochKeyBytes)
    const plaintextBytes = stringToBytes(plaintext)
    const ciphertextBytes = await aesGcmEncrypt(plaintextBytes, key, nonce, adBytes)

    const envelope: AnySecureGroupEpochContentEnvelope = pqDerived
      ? {
          v: GROUP_EPOCH_CONTENT_VERSION_PQ,
          mode: "group-epoch-pq-v1",
          alg: GROUP_EPOCH_CONTENT_ALGORITHM_PQ,
          epoch_id: epochId,
          nonce: bytesToBase64(nonce),
          ad: bytesToBase64(adBytes),
          ct: bytesToBase64(ciphertextBytes),
          ts: createdAt,
        }
      : {
          v: GROUP_EPOCH_CONTENT_VERSION,
          mode: "group-epoch-v1",
          alg: GROUP_EPOCH_CONTENT_ALGORITHM,
          epoch_id: epochId,
          nonce: bytesToBase64(nonce),
          ad: bytesToBase64(adBytes),
          ct: bytesToBase64(ciphertextBytes),
          ts: createdAt,
        }

    return {
      ok: true,
      envelope,
      content: JSON.stringify(envelope),
    }
  } catch (error) {
    return {
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_ENCODE_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Unknown secure group epoch content encoding failure.",
    }
  }
}

const isEnvelope = (value: unknown): value is AnySecureGroupEpochContentEnvelope => {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  const hasCommonFields =
    typeof candidate.epoch_id === "string" &&
    typeof candidate.nonce === "string" &&
    typeof candidate.ad === "string" &&
    typeof candidate.ct === "string" &&
    typeof candidate.ts === "number"

  if (!hasCommonFields) return false

  if (
    candidate.v === GROUP_EPOCH_CONTENT_VERSION &&
    candidate.mode === "group-epoch-v1" &&
    candidate.alg === GROUP_EPOCH_CONTENT_ALGORITHM
  ) {
    return true
  }

  if (
    candidate.v === GROUP_EPOCH_CONTENT_VERSION_PQ &&
    candidate.mode === "group-epoch-pq-v1" &&
    candidate.alg === GROUP_EPOCH_CONTENT_ALGORITHM_PQ
  ) {
    return true
  }

  return false
}

export const decodeSecureGroupEpochContent = async (
  content: string,
  epochKeyBytes: Uint8Array,
): Promise<SecureGroupEpochContentDecodeResult> => {
  try {
    const parsed = JSON.parse(content)

    if (!isEnvelope(parsed)) {
      return {
        ok: false,
        reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED",
        message: "Secure group content envelope is invalid.",
      }
    }

    const key = await importAesGcmKey(epochKeyBytes)
    const nonce = base64ToBytes(parsed.nonce)
    const ciphertext = base64ToBytes(parsed.ct)
    const ad = base64ToBytes(parsed.ad)

    const plaintextBytes = await aesGcmDecrypt(ciphertext, key, nonce, ad)

    return {
      ok: true,
      envelope: parsed,
      plaintext: bytesToString(plaintextBytes),
    }
  } catch (error) {
    return {
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED",
      message: error instanceof Error ? error.message : "Secure group content parse failed.",
    }
  }
}
