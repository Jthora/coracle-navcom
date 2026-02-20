import type {PqcEnvelope} from "../../../../src/engine/pqc/envelope-contracts"

export const makeValidMinimalEnvelope = (): PqcEnvelope => ({
  ad: "ad:sender:recipient",
  alg: "hybrid-mlkem768+x25519-aead-v1",
  ct: "base64:ciphertext",
  mode: "hybrid",
  msg_id: "msg-001",
  nonce: "base64:nonce",
  recipients: [
    {
      kem_alg: "mlkem768",
      kem_ct: "base64:kem-ct",
      pk_ref: "npub1recipient",
    },
  ],
  ts: 1739836800,
  v: 1,
})

export const makeValidFullEnvelope = (): PqcEnvelope => ({
  ad: "ad:sender:group",
  alg: "hybrid-mlkem768+x25519-aead-v1",
  chunk: {
    hash: "sha256:abc",
    id: "chunk-set-1",
    index: 0,
    total: 2,
  },
  compat: {
    fallback_mode: "classical-x25519-aead-v1",
    reason_code: "NEGOTIATION_NO_CAPS",
  },
  ct: "base64:ciphertext-full",
  ext: {
    trace_id: "trace-1",
  },
  mode: "hybrid",
  msg_id: "msg-002",
  nonce: "base64:nonce-full",
  pad_len: 32,
  recipients: [
    {
      flags: {primary: true},
      kem_alg: "mlkem768",
      kem_ct: "base64:kem-ct-1",
      key_epoch: "group-epoch-3",
      pk_ref: "npub1alpha",
    },
    {
      kem_alg: "mlkem768",
      kem_ct: "base64:kem-ct-2",
      pk_ref: "npub1beta",
    },
  ],
  ts: 1739836801,
  v: 1,
})

export const makeMalformedEnvelopeMissingField = () => {
  const envelope = makeValidMinimalEnvelope() as Record<string, unknown>
  delete envelope.alg

  return envelope
}

export const makeMalformedEnvelopeUnknownCriticalField = () => ({
  ...makeValidMinimalEnvelope(),
  critical_future: "must-fail-in-strict-mode",
})

export const makeMalformedEnvelopeBadRecipient = () => ({
  ...makeValidMinimalEnvelope(),
  recipients: [{pk_ref: "npub1only"}],
})

export const makeMalformedEnvelopeUnsupportedVersion = () => ({
  ...makeValidMinimalEnvelope(),
  v: 2,
})

export const makeMalformedEnvelopeInvalidFieldType = () => ({
  ...makeValidMinimalEnvelope(),
  ts: "1739836800",
})

export const makeMalformedEnvelopeUnknownCriticalRecipientField = () => ({
  ...makeValidMinimalEnvelope(),
  recipients: [
    {
      kem_alg: "mlkem768",
      kem_ct: "base64:kem-ct",
      pk_ref: "npub1recipient",
      critical_recipient_hint: "must-fail",
    },
  ],
})
