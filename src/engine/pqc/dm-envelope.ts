import {validatePqcEnvelope} from "src/engine/pqc/envelope-validation"
import type {PqcEnvelope, PqcEnvelopeMode} from "src/engine/pqc/envelope-contracts"
import {
  aesGcmEncrypt,
  importAesGcmKey,
  hkdfDeriveKey,
  randomNonce,
  randomBytes,
  bytesToBase64,
  stringToBytes,
  mlKemEncapsulate,
  hmacSha256,
} from "src/engine/pqc/crypto-provider"

export type DmEnvelopeBuildInput = {
  plaintext: string
  senderPubkey: string
  recipients: string[]
  mode: PqcEnvelopeMode
  algorithm: string
  recipientPqPublicKeys: Map<string, Uint8Array>
  createdAt?: number
  messageId?: string
  fallbackReasonCode?: string
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

export const buildDmPqcEnvelope = async ({
  plaintext,
  senderPubkey,
  recipients,
  mode,
  algorithm,
  recipientPqPublicKeys,
  createdAt = Math.floor(Date.now() / 1000),
  messageId = `dm-${createdAt}-${recipients.length}`,
  fallbackReasonCode,
}: DmEnvelopeBuildInput): Promise<DmEnvelopeBuildResult> => {
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

    // Generate a random content encryption key (CEK)
    const cek = randomBytes(32)

    // For each recipient, encapsulate the CEK using their ML-KEM public key
    const recipientsPayload = await Promise.all(
      recipients.map(async recipient => {
        const pqPubKey = recipientPqPublicKeys.get(recipient)
        if (!pqPubKey) {
          throw new Error(`No PQ public key for recipient ${recipient.slice(0, 8)}...`)
        }

        // ML-KEM-768 encapsulate: produces (ciphertext, sharedSecret)
        const {cipherText: kemCt, sharedSecret: kemSs} = mlKemEncapsulate(pqPubKey)

        // Derive a wrapping key from the KEM shared secret via HKDF
        const salt = stringToBytes(`navcom-pqc-dm:${senderPubkey}:${recipient}`)
        const info = stringToBytes(`dm-cek-wrap:${messageId}`)
        let wrapKey: Uint8Array
        try {
          wrapKey = await hkdfDeriveKey(kemSs, salt, info, 32)
        } finally {
          kemSs.fill(0)
          salt.fill(0)
        }

        // Wrap the CEK with the derived key
        const wrapNonce = randomNonce()
        const wrapKeyObj = await importAesGcmKey(wrapKey)
        const wrappedCek = await aesGcmEncrypt(cek, wrapKeyObj, wrapNonce)

        // Compute confirmation tag: HMAC-SHA256(wrapKey, kem_ct || ad_bytes)
        // Binds the KEM ciphertext to the associated data for key confirmation
        const adBytes = stringToBytes(ad)
        const tagInput = new Uint8Array(kemCt.length + adBytes.length)
        tagInput.set(kemCt, 0)
        tagInput.set(adBytes, kemCt.length)
        const confirmationTag = await hmacSha256(wrapKey, tagInput)

        return {
          kem_alg: "mlkem768",
          kem_ct: bytesToBase64(kemCt),
          pk_ref: recipient,
          wrapped_cek: bytesToBase64(wrappedCek),
          wrap_nonce: bytesToBase64(wrapNonce),
          confirmation_tag: bytesToBase64(confirmationTag),
        }
      }),
    )

    // Encrypt plaintext with the CEK
    const nonce = randomNonce()
    const adBytes = stringToBytes(ad)
    const cekKey = await importAesGcmKey(cek)
    const ctBytes = await aesGcmEncrypt(stringToBytes(plaintext), cekKey, nonce, adBytes)

    const envelope: PqcEnvelope = {
      ad: bytesToBase64(adBytes),
      alg: algorithm,
      ...(mode === "classical"
        ? {
            compat: {
              fallback_mode: "classical-x25519-aead-v1",
              reason_code: fallbackReasonCode || "NEGOTIATION_FALLBACK_CLASSICAL",
            },
          }
        : {}),
      ct: bytesToBase64(ctBytes),
      mode,
      msg_id: messageId,
      nonce: bytesToBase64(nonce),
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
