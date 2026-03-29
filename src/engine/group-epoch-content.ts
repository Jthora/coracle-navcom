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

/** Tags that leak operationally-sensitive metadata and must be sealed inside encrypted content. */
export const SEALED_META_TAG_NAMES = ["msg-type", "location", "g", "priority"] as const

/**
 * Sealed metadata envelope — wraps plaintext + sensitive tag metadata
 * inside a single JSON structure that gets encrypted as the content body.
 *
 * Format: `{ text: "...", meta: { type?, location?, geohash?, priority? } }`
 */
export type SealedMetaEnvelope = {
  text: string
  meta: {
    type?: string
    location?: string
    geohash?: string
    priority?: string
  }
}

/**
 * Extracts sensitive metadata tags from an extraTags array, returning:
 * - `meta`: the sealed metadata object for inclusion in encrypted content
 * - `remainingTags`: non-sensitive tags that stay as plaintext event tags
 */
export function extractSealedMeta(extraTags: string[][]): {
  meta: SealedMetaEnvelope["meta"]
  remainingTags: string[][]
} {
  const sealedNames = new Set<string>(SEALED_META_TAG_NAMES)
  const meta: SealedMetaEnvelope["meta"] = {}
  const remainingTags: string[][] = []

  for (const tag of extraTags) {
    if (!tag[0] || !sealedNames.has(tag[0])) {
      remainingTags.push(tag)
      continue
    }
    switch (tag[0]) {
      case "msg-type":
        meta.type = tag[1]
        break
      case "location":
        meta.location = tag[1]
        break
      case "g":
        meta.geohash = tag[1]
        break
      case "priority":
        meta.priority = tag[1]
        break
    }
  }

  return {meta, remainingTags}
}

/**
 * Build sealed content: wraps plaintext + metadata into a SealedMetaEnvelope JSON string.
 * If no metadata is present, returns the plaintext as-is (no envelope wrapping).
 */
export function buildSealedContent(plaintext: string, meta: SealedMetaEnvelope["meta"]): string {
  const hasAnyMeta = meta.type || meta.location || meta.geohash || meta.priority
  if (!hasAnyMeta) return plaintext
  const envelope: SealedMetaEnvelope = {text: plaintext, meta}
  return JSON.stringify(envelope)
}

/**
 * Parse potentially-sealed decrypted content. Returns text + metadata.
 * Handles both old format (plain text) and new format (SealedMetaEnvelope JSON).
 */
export function parseSealedContent(decrypted: string): {
  text: string
  meta: SealedMetaEnvelope["meta"]
} {
  // Try to parse as SealedMetaEnvelope
  try {
    const parsed = JSON.parse(decrypted)
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.text === "string" &&
      parsed.meta &&
      typeof parsed.meta === "object"
    ) {
      // Validate meta fields are strings or undefined
      const meta: SealedMetaEnvelope["meta"] = {}
      if (typeof parsed.meta.type === "string") meta.type = parsed.meta.type
      if (typeof parsed.meta.location === "string") meta.location = parsed.meta.location
      if (typeof parsed.meta.geohash === "string") meta.geohash = parsed.meta.geohash
      if (typeof parsed.meta.priority === "string") meta.priority = parsed.meta.priority
      return {text: parsed.text, meta}
    }
  } catch {
    // Not JSON — old format, plain text
  }
  return {text: decrypted, meta: {}}
}

/**
 * Re-inject sealed metadata as event tags (for UI rendering compatibility).
 * Returns an array of tags derived from the sealed metadata.
 */
export function sealedMetaToTags(meta: SealedMetaEnvelope["meta"]): string[][] {
  const tags: string[][] = []
  if (meta.type) tags.push(["msg-type", meta.type])
  if (meta.location) tags.push(["location", meta.location])
  if (meta.geohash) tags.push(["g", meta.geohash])
  if (meta.priority) tags.push(["priority", meta.priority])
  return tags
}

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
