export const GROUP_EPOCH_CONTENT_VERSION = 1 as const
export const GROUP_EPOCH_CONTENT_ALGORITHM = "group-epoch-aead-v1"

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

export type SecureGroupEpochContentEncodeResult =
  | {
      ok: true
      envelope: SecureGroupEpochContentEnvelope
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
      envelope: SecureGroupEpochContentEnvelope
    }
  | {
      ok: false
      reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED"
      message: string
    }

const encodeUtf8Base64 = (value: string) => {
  if (typeof btoa === "function") {
    return btoa(value)
  }

  return Buffer.from(value, "utf8").toString("base64")
}

const decodeUtf8Base64 = (value: string) => {
  if (typeof atob === "function") {
    return atob(value)
  }

  return Buffer.from(value, "base64").toString("utf8")
}

const buildAssociatedData = ({
  groupId,
  epochId,
  senderPubkey,
  recipients,
  createdAt,
}: {
  groupId: string
  epochId: string
  senderPubkey: string
  recipients: string[]
  createdAt: number
}) =>
  JSON.stringify({
    group_id: groupId,
    epoch_id: epochId,
    sender: senderPubkey,
    recipients: [...recipients].sort(),
    created_at: createdAt,
    envelope_version: GROUP_EPOCH_CONTENT_VERSION,
    algorithm: GROUP_EPOCH_CONTENT_ALGORITHM,
  })

export const encodeSecureGroupEpochContent = ({
  groupId,
  epochId,
  plaintext,
  senderPubkey,
  recipients,
  createdAt = Math.floor(Date.now() / 1000),
}: {
  groupId: string
  epochId: string
  plaintext: string
  senderPubkey: string
  recipients: string[]
  createdAt?: number
}): SecureGroupEpochContentEncodeResult => {
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
    const nonce = encodeUtf8Base64(`${groupId}:${epochId}:${createdAt}`)
    const ad = encodeUtf8Base64(
      buildAssociatedData({
        groupId,
        epochId,
        senderPubkey,
        recipients,
        createdAt,
      }),
    )

    const envelope: SecureGroupEpochContentEnvelope = {
      v: GROUP_EPOCH_CONTENT_VERSION,
      mode: "group-epoch-v1",
      alg: GROUP_EPOCH_CONTENT_ALGORITHM,
      epoch_id: epochId,
      nonce,
      ad,
      ct: encodeUtf8Base64(plaintext),
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

const isEnvelope = (value: unknown): value is SecureGroupEpochContentEnvelope => {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    candidate.v === GROUP_EPOCH_CONTENT_VERSION &&
    candidate.mode === "group-epoch-v1" &&
    candidate.alg === GROUP_EPOCH_CONTENT_ALGORITHM &&
    typeof candidate.epoch_id === "string" &&
    typeof candidate.nonce === "string" &&
    typeof candidate.ad === "string" &&
    typeof candidate.ct === "string" &&
    typeof candidate.ts === "number"
  )
}

export const decodeSecureGroupEpochContent = (
  content: string,
): SecureGroupEpochContentDecodeResult => {
  try {
    const parsed = JSON.parse(content)

    if (!isEnvelope(parsed)) {
      return {
        ok: false,
        reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED",
        message: "Secure group content envelope is invalid.",
      }
    }

    return {
      ok: true,
      envelope: parsed,
      plaintext: decodeUtf8Base64(parsed.ct),
    }
  } catch (error) {
    return {
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED",
      message: error instanceof Error ? error.message : "Secure group content parse failed.",
    }
  }
}
