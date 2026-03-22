import {validatePqcEnvelope} from "src/engine/pqc/envelope-validation"
import {pqcEnvelopeModes, type PqcEnvelopeMode} from "src/engine/pqc/envelope-contracts"
import type {EnvelopeValidationErrorCode} from "src/engine/pqc/envelope-contracts"
import type {PqcPolicyMode} from "src/engine/pqc/negotiation"
import {
  aesGcmDecrypt,
  importAesGcmKey,
  hkdfDeriveKey,
  base64ToBytes,
  bytesToString,
  stringToBytes,
  mlKemDecapsulate,
  hmacSha256,
} from "src/engine/pqc/crypto-provider"

export const DM_SECURE_UNDECRYPTABLE_PLACEHOLDER = "Secure message unavailable."

/** Constant-time comparison to prevent timing side-channel on HMAC verification. */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i]
  }
  return result === 0
}

export type CryptoErrorClass = "key-mismatch" | "format-invalid" | "integrity-fail" | "unknown"

/**
 * Classify a crypto/decryption error into diagnostic buckets for internal logging.
 * Never expose the result to users — it's for developer telemetry only.
 */
function classifyCryptoError(error: unknown): CryptoErrorClass {
  const msg = error instanceof Error ? error.message.toLowerCase() : ""
  if (msg.includes("decrypt") || msg.includes("operationerror") || msg.includes("tag")) {
    return "integrity-fail"
  }
  if (msg.includes("key") || msg.includes("encapsulat") || msg.includes("unwrap")) {
    return "key-mismatch"
  }
  if (
    msg.includes("json") ||
    msg.includes("parse") ||
    msg.includes("base64") ||
    msg.includes("invalid")
  ) {
    return "format-invalid"
  }
  return "unknown"
}

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
  recipientSecretKey: Uint8Array
  recipientPubkey: string
  senderPubkey: string
  allowLegacyFallback?: boolean
  expectedSenderPubkey?: string
  expectedRecipientPubkey?: string
  expectedRecipientPubkeys?: string[]
}

export type ResolveDmReceiveContentResult = {
  content: string
  usedLegacyFallback: boolean
  reason?: DmEnvelopeParseReasonCode
}

const envelopeModeSet = new Set<string>(pqcEnvelopeModes)

const normalizePubkey = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : ""

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
): Exclude<DmEnvelopeParseReasonCode, "DM_ENVELOPE_PARSE_OK"> => {
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
  expectedRecipientPubkeys,
}: {
  ad: string
  envelope: {
    v: number
    mode: PqcEnvelopeMode
    alg: string
    ts: number
    msg_id: string
  }
  expectedSenderPubkey?: string
  expectedRecipientPubkey?: string
  expectedRecipientPubkeys?: string[]
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

    if (
      expectedSenderPubkey &&
      normalizePubkey(parsedAd.sender) !== normalizePubkey(expectedSenderPubkey)
    ) {
      return false
    }

    const recipientCandidates = Array.from(
      new Set(
        [expectedRecipientPubkey, ...(expectedRecipientPubkeys || [])]
          .map(candidate => normalizePubkey(candidate))
          .filter(Boolean),
      ),
    )

    if (recipientCandidates.length > 0) {
      const recipients = Array.isArray(parsedAd.recipients)
        ? (parsedAd.recipients as unknown[]).map(value => normalizePubkey(value)).filter(Boolean)
        : []

      if (!recipientCandidates.some(candidate => recipients.includes(candidate))) {
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

export const parseDmPqcEnvelopeContent = async (
  content: string,
  {
    recipientSecretKey,
    recipientPubkey,
    senderPubkey,
    expectedSenderPubkey,
    expectedRecipientPubkey,
    expectedRecipientPubkeys,
  }: {
    recipientSecretKey: Uint8Array
    recipientPubkey: string
    senderPubkey: string
    expectedSenderPubkey?: string
    expectedRecipientPubkey?: string
    expectedRecipientPubkeys?: string[]
  },
): Promise<DmEnvelopeParseResult> => {
  try {
    const parsed = JSON.parse(content)
    const validation = validatePqcEnvelope(parsed, {strict: true, enforceCanonicalKeyOrder: true})

    if (validation.ok === false) {
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
      expectedRecipientPubkeys,
    })

    if (!adBindingValid) {
      return {
        ok: false,
        reason: "DM_ENVELOPE_AD_BINDING_MISMATCH",
        details: "Envelope associated-data binding check failed.",
      }
    }

    // Find the recipient entry for this user
    const recipientEntry = validation.value.recipients.find(r => r.pk_ref === recipientPubkey)
    if (!recipientEntry || !recipientEntry.wrapped_cek || !recipientEntry.wrap_nonce) {
      return {
        ok: false,
        reason: "DM_ENVELOPE_RECIPIENT_WRAP_INVALID",
        details: "No matching recipient entry with wrapped CEK found.",
      }
    }

    // ML-KEM-768 decapsulate to recover shared secret
    const kemCt = base64ToBytes(recipientEntry.kem_ct)
    const kemSs = mlKemDecapsulate(kemCt, recipientSecretKey)

    // Derive the wrapping key from KEM shared secret via HKDF
    const salt = stringToBytes(`navcom-pqc-dm:${senderPubkey}:${recipientPubkey}`)
    const info = stringToBytes(`dm-cek-wrap:${validation.value.msg_id}`)
    let wrapKey: Uint8Array
    try {
      wrapKey = await hkdfDeriveKey(kemSs, salt, info, 32)
    } finally {
      kemSs.fill(0)
      salt.fill(0)
    }

    // Verify confirmation tag if present (backward-compatible: accept old envelopes without tag)
    if (recipientEntry.confirmation_tag) {
      const expectedTagInput = new Uint8Array(
        kemCt.length + base64ToBytes(validation.value.ad).length,
      )
      expectedTagInput.set(kemCt, 0)
      expectedTagInput.set(base64ToBytes(validation.value.ad), kemCt.length)
      const expectedTag = await hmacSha256(wrapKey, expectedTagInput)
      const actualTag = base64ToBytes(recipientEntry.confirmation_tag)
      if (!constantTimeEqual(expectedTag, actualTag)) {
        console.warn(
          `[SecurityAudit] Key confirmation tag mismatch: sender=${senderPubkey.slice(0, 8)}… msg=${validation.value.msg_id}`,
        )
        return {
          ok: false,
          reason: "DM_ENVELOPE_AD_BINDING_MISMATCH",
          details: "Key agreement confirmation failed — possible tampering.",
        }
      }
    }

    // Unwrap the CEK
    const wrapNonce = base64ToBytes(recipientEntry.wrap_nonce)
    const wrappedCek = base64ToBytes(recipientEntry.wrapped_cek)
    const wrapKeyObj = await importAesGcmKey(wrapKey)
    const cek = await aesGcmDecrypt(wrappedCek, wrapKeyObj, wrapNonce)

    // Decrypt the content with the CEK
    const nonce = base64ToBytes(validation.value.nonce)
    const ciphertext = base64ToBytes(validation.value.ct)
    const ad = base64ToBytes(validation.value.ad)
    const cekKey = await importAesGcmKey(cek)
    const plaintextBytes = await aesGcmDecrypt(ciphertext, cekKey, nonce, ad)

    return {
      ok: true,
      plaintext: bytesToString(plaintextBytes),
      reason: "DM_ENVELOPE_PARSE_OK",
    }
  } catch (error) {
    // Classify error for internal diagnostics without leaking to user
    const errorClass = classifyCryptoError(error)
    console.warn(`[PQC] DM envelope parse/decrypt failed [${errorClass}]:`, error)
    return {
      ok: false,
      reason: "DM_ENVELOPE_PARSE_JSON_INVALID",
      details: "Decryption failed",
    }
  }
}

export const resolveDmReceiveContent = async (
  input: ResolveDmReceiveContentInput,
): Promise<ResolveDmReceiveContentResult> => {
  try {
    return await _resolveDmReceiveContentInner(input)
  } catch (error) {
    // Defensive: guarantee a corrupt message never throws past this boundary
    console.warn("[PQC] Unexpected error in resolveDmReceiveContent:", error)
    return {
      content: DM_SECURE_UNDECRYPTABLE_PLACEHOLDER,
      usedLegacyFallback: false,
    }
  }
}

const _resolveDmReceiveContentInner = async ({
  tags,
  decryptedContent,
  policyMode,
  recipientSecretKey,
  recipientPubkey,
  senderPubkey,
  allowLegacyFallback = true,
  expectedSenderPubkey,
  expectedRecipientPubkey,
  expectedRecipientPubkeys,
}: ResolveDmReceiveContentInput): Promise<ResolveDmReceiveContentResult> => {
  const mode = getPqcEnvelopeModeFromTags(tags)

  if (!mode) {
    return {content: decryptedContent, usedLegacyFallback: false}
  }

  const parsed = await parseDmPqcEnvelopeContent(decryptedContent, {
    recipientSecretKey,
    recipientPubkey,
    senderPubkey,
    expectedSenderPubkey,
    expectedRecipientPubkey,
    expectedRecipientPubkeys,
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
