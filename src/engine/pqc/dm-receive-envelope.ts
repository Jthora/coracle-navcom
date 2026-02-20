import {
  validatePqcEnvelope,
  type EnvelopeValidationErrorCode,
} from "src/engine/pqc/envelope-validation"
import type {PqcPolicyMode} from "src/engine/pqc/negotiation"

export const DM_SECURE_UNDECRYPTABLE_PLACEHOLDER = "Secure message unavailable."

export const pqcEnvelopeModes = ["hybrid", "classical"] as const
export type PqcEnvelopeMode = (typeof pqcEnvelopeModes)[number]

export type DmEnvelopeParseReasonCode =
  | "DM_ENVELOPE_PARSE_OK"
  | "DM_ENVELOPE_PARSE_JSON_INVALID"
  | "DM_ENVELOPE_VERSION_UNSUPPORTED"
  | "DM_ENVELOPE_FIELD_MISSING"
  | "DM_ENVELOPE_FIELD_INVALID"
  | "DM_ENVELOPE_CANONICALIZATION_FAILED"
  | "DM_ENVELOPE_RECIPIENT_WRAP_INVALID"
  | "DM_ENVELOPE_CRITICAL_FIELD_UNSUPPORTED"
  | "DM_ENVELOPE_AD_BINDING_MISMATCH"

export type DmEnvelopeParseResult =
  | {
      ok: true
      plaintext: string
      reason: "DM_ENVELOPE_PARSE_OK"
    }
  | {
      ok: false
      reason: Exclude<DmEnvelopeParseReasonCode, "DM_ENVELOPE_PARSE_OK">
      details?: string
    }

export type ResolveDmReceiveContentInput = {
  tags: string[][]
  decryptedContent: string
  policyMode: PqcPolicyMode
  allowLegacyFallback?: boolean
  expectedSenderPubkey?: string
  expectedRecipientPubkey?: string
}

export type ResolveDmReceiveContentResult = {
  content: string
  usedLegacyFallback: boolean
  reason?: DmEnvelopeParseReasonCode
}

const envelopeModeSet = new Set<string>(pqcEnvelopeModes)

const decodeBase64Utf8 = (value: string) => {
  if (typeof atob === "function") {
    const binary = atob(value)

    if (typeof TextDecoder !== "undefined") {
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))

      return new TextDecoder().decode(bytes)
    }

    return binary
  }

  return Buffer.from(value, "base64").toString("utf8")
}

const mapValidationCodeToReason = (
  code: EnvelopeValidationErrorCode,
): DmEnvelopeParseReasonCode => {
  switch (code) {
    case "ERR_ENV_VERSION_UNSUPPORTED":
      return "DM_ENVELOPE_VERSION_UNSUPPORTED"
    case "ERR_ENV_FIELD_MISSING":
      return "DM_ENVELOPE_FIELD_MISSING"
    case "ERR_ENV_FIELD_INVALID":
      return "DM_ENVELOPE_FIELD_INVALID"
    case "ERR_ENV_CANONICALIZATION":
      return "DM_ENVELOPE_CANONICALIZATION_FAILED"
    case "ERR_ENV_RECIPIENT_WRAP_INVALID":
      return "DM_ENVELOPE_RECIPIENT_WRAP_INVALID"
    case "ERR_ENV_CRITICAL_FIELD_UNSUPPORTED":
      return "DM_ENVELOPE_CRITICAL_FIELD_UNSUPPORTED"
  }
}

const validateEnvelopeAssociatedDataBinding = ({
  ad,
  envelope,
  expectedSenderPubkey,
  expectedRecipientPubkey,
}: {
  ad: string
  envelope: {
    v: number
    mode: string
    alg: string
    ts: number
    msg_id: string
  }
  expectedSenderPubkey?: string
  expectedRecipientPubkey?: string
}) => {
  try {
    const parsedAd = JSON.parse(ad) as {
      sender?: unknown
      recipients?: unknown
      mode?: unknown
      algorithm?: unknown
      created_at?: unknown
      message_id?: unknown
      envelope_version?: unknown
    }

    if (!parsedAd || typeof parsedAd !== "object") {
      return false
    }

    if (expectedSenderPubkey && parsedAd.sender !== expectedSenderPubkey) {
      return false
    }

    if (expectedRecipientPubkey) {
      const recipients = Array.isArray(parsedAd.recipients)
        ? (parsedAd.recipients as unknown[]).filter(value => typeof value === "string")
        : []

      if (!recipients.includes(expectedRecipientPubkey)) {
        return false
      }
    }

    if (parsedAd.mode !== envelope.mode) {
      return false
    }

    if (parsedAd.algorithm !== envelope.alg) {
      return false
    }

    if (parsedAd.created_at !== envelope.ts) {
      return false
    }

    if (parsedAd.message_id !== envelope.msg_id) {
      return false
    }

    if (parsedAd.envelope_version !== envelope.v) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export const getPqcEnvelopeModeFromTags = (tags: string[][]): PqcEnvelopeMode | null => {
  const mode = tags.find(tag => tag[0] === "pqc")?.[1]

  if (!mode || !envelopeModeSet.has(mode)) {
    return null
  }

  return mode as PqcEnvelopeMode
}

export const parseDmPqcEnvelopeContent = (
  content: string,
  {
    expectedSenderPubkey,
    expectedRecipientPubkey,
  }: {expectedSenderPubkey?: string; expectedRecipientPubkey?: string} = {},
): DmEnvelopeParseResult => {
  try {
    const parsed = JSON.parse(content)
    const validation = validatePqcEnvelope(parsed, {strict: true, enforceCanonicalKeyOrder: true})

    if (!validation.ok) {
      return {
        ok: false,
        reason: mapValidationCodeToReason(validation.code),
        details: validation.message,
      }
    }

    const decodedAd = decodeBase64Utf8(validation.value.ad)
    const adBindingValid = validateEnvelopeAssociatedDataBinding({
      ad: decodedAd,
      envelope: validation.value,
      expectedSenderPubkey,
      expectedRecipientPubkey,
    })

    if (!adBindingValid) {
      return {
        ok: false,
        reason: "DM_ENVELOPE_AD_BINDING_MISMATCH",
        details: "Envelope associated-data binding check failed.",
      }
    }

    return {
      ok: true,
      plaintext: decodeBase64Utf8(validation.value.ct),
      reason: "DM_ENVELOPE_PARSE_OK",
    }
  } catch (error) {
    return {
      ok: false,
      reason: "DM_ENVELOPE_PARSE_JSON_INVALID",
      details: error instanceof Error ? error.message : "Invalid envelope JSON",
    }
  }
}

export const resolveDmReceiveContent = ({
  tags,
  decryptedContent,
  policyMode,
  allowLegacyFallback = true,
  expectedSenderPubkey,
  expectedRecipientPubkey,
}: ResolveDmReceiveContentInput): ResolveDmReceiveContentResult => {
  const mode = getPqcEnvelopeModeFromTags(tags)

  if (!mode) {
    return {content: decryptedContent, usedLegacyFallback: false}
  }

  const parsed = parseDmPqcEnvelopeContent(decryptedContent, {
    expectedSenderPubkey,
    expectedRecipientPubkey,
  })

  if (parsed.ok) {
    return {
      content: parsed.plaintext,
      usedLegacyFallback: false,
      reason: parsed.reason,
    }
  }

  const canFallback = policyMode !== "strict" && allowLegacyFallback

  if (canFallback) {
    return {
      content: decryptedContent,
      usedLegacyFallback: true,
      reason: parsed.reason,
    }
  }

  return {
    content: DM_SECURE_UNDECRYPTABLE_PLACEHOLDER,
    usedLegacyFallback: false,
    reason: parsed.reason,
  }
}
