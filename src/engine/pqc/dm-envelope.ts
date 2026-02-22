import {validatePqcEnvelope} from "src/engine/pqc/envelope-validation"
import type {PqcEnvelope, PqcEnvelopeMode} from "src/engine/pqc/envelope-contracts"

export type DmEnvelopeBuildInput = {
  plaintext: string
  senderPubkey: string
  recipients: string[]
  mode: PqcEnvelopeMode
  algorithm: string
  createdAt?: number
  messageId?: string
  fallbackReasonCode?: string
  nonceSeed?: string
}

export type DmEnvelopeBuildResult =
  | {
      ok: true
      content: string
      envelope: PqcEnvelope
    }
  | {
      ok: false
      reason: "DM_ENVELOPE_ENCODE_FAILED"
      message: string
    }

const encodeToBase64 = (value: string) => {
  if (typeof btoa === "function") {
    return btoa(value)
  }

  return Buffer.from(value, "utf8").toString("base64")
}

export const buildDmEnvelopeAssociatedData = ({
  senderPubkey,
  recipients,
  mode,
  algorithm,
  createdAt,
  messageId,
}: {
  senderPubkey: string
  recipients: string[]
  mode: PqcEnvelopeMode
  algorithm: string
  createdAt: number
  messageId: string
}) =>
  JSON.stringify({
    sender: senderPubkey,
    recipients: [...recipients].sort(),
    mode,
    algorithm,
    created_at: createdAt,
    message_id: messageId,
    envelope_version: 1,
  })

export const buildDmPqcEnvelope = ({
  plaintext,
  senderPubkey,
  recipients,
  mode,
  algorithm,
  createdAt = Math.floor(Date.now() / 1000),
  messageId = `dm-${createdAt}-${recipients.length}`,
  fallbackReasonCode,
  nonceSeed,
}: DmEnvelopeBuildInput): DmEnvelopeBuildResult => {
  if (!senderPubkey || recipients.length === 0) {
    return {
      ok: false,
      reason: "DM_ENVELOPE_ENCODE_FAILED",
      message: "Sender and at least one recipient are required for DM envelope encoding.",
    }
  }

  try {
    const ad = buildDmEnvelopeAssociatedData({
      senderPubkey,
      recipients,
      mode,
      algorithm,
      createdAt,
      messageId,
    })

    const nonceInput = nonceSeed || `${senderPubkey}:${createdAt}:${messageId}`

    const recipientsPayload = recipients.map(recipient => ({
      kem_alg: mode === "hybrid" ? "mlkem768" : "x25519",
      kem_ct: encodeToBase64(`${recipient}:${messageId}`),
      pk_ref: recipient,
    }))

    const envelope: PqcEnvelope = {
      ad: encodeToBase64(ad),
      alg: algorithm,
      ...(mode === "classical"
        ? {
            compat: {
              fallback_mode: "classical-x25519-aead-v1",
              reason_code: fallbackReasonCode || "NEGOTIATION_FALLBACK_CLASSICAL",
            },
          }
        : {}),
      ct: encodeToBase64(plaintext),
      mode,
      msg_id: messageId,
      nonce: encodeToBase64(nonceInput),
      recipients: recipientsPayload,
      ts: createdAt,
      v: 1,
    }

    const validation = validatePqcEnvelope(envelope)

    if (validation.ok === false) {
      return {
        ok: false,
        reason: "DM_ENVELOPE_ENCODE_FAILED",
        message: `Envelope validation failed: ${validation.code}`,
      }
    }

    return {
      ok: true,
      content: JSON.stringify(envelope),
      envelope,
    }
  } catch (error) {
    return {
      ok: false,
      reason: "DM_ENVELOPE_ENCODE_FAILED",
      message: error instanceof Error ? error.message : "Unknown envelope encoding error",
    }
  }
}
