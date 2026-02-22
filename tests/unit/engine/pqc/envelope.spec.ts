import {describe, expect, it} from "vitest"
import {
  isValidPqcEnvelope,
  validatePqcEnvelope,
} from "../../../../src/engine/pqc/envelope-validation"
import {
  makeMalformedEnvelopeBadRecipient,
  makeMalformedEnvelopeInvalidFieldType,
  makeMalformedEnvelopeMissingField,
  makeMalformedEnvelopeUnknownCriticalRecipientField,
  makeMalformedEnvelopeUnknownCriticalField,
  makeMalformedEnvelopeUnsupportedVersion,
  makeValidFullEnvelope,
  makeValidMinimalEnvelope,
} from "./envelope.fixtures"

describe("engine/pqc/envelope-validation", () => {
  it("accepts a canonical minimal envelope", () => {
    const envelope = makeValidMinimalEnvelope()
    const result = validatePqcEnvelope(envelope)

    expect(result.ok).toBe(true)
    expect(isValidPqcEnvelope(envelope)).toBe(true)
  })

  it("accepts a full envelope with optional fields", () => {
    const envelope = makeValidFullEnvelope()
    const result = validatePqcEnvelope(envelope)

    expect(result.ok).toBe(true)
  })

  it("rejects missing required fields", () => {
    const result = validatePqcEnvelope(makeMalformedEnvelopeMissingField())

    expect(result).toMatchObject({
      ok: false,
      code: "ERR_ENV_FIELD_MISSING",
      field: "alg",
    })
  })

  it("rejects recipient entries missing required wrap fields", () => {
    const result = validatePqcEnvelope(makeMalformedEnvelopeBadRecipient())

    expect(result).toMatchObject({
      ok: false,
      code: "ERR_ENV_RECIPIENT_WRAP_INVALID",
    })
  })

  it("rejects unsupported envelope versions", () => {
    const result = validatePqcEnvelope(makeMalformedEnvelopeUnsupportedVersion())

    expect(result).toMatchObject({
      ok: false,
      code: "ERR_ENV_VERSION_UNSUPPORTED",
      field: "v",
    })
  })

  it("rejects invalid top-level field types", () => {
    const result = validatePqcEnvelope(makeMalformedEnvelopeInvalidFieldType())

    expect(result).toMatchObject({
      ok: false,
      code: "ERR_ENV_FIELD_INVALID",
      field: "ts",
    })
  })

  it("rejects envelopes with unsupported mode values", () => {
    const result = validatePqcEnvelope({...makeValidMinimalEnvelope(), mode: "future-mode" as any})

    expect(result).toMatchObject({
      ok: false,
      code: "ERR_ENV_FIELD_INVALID",
      field: "mode",
    })
  })

  it("rejects invalid compat metadata field types", () => {
    const result = validatePqcEnvelope(
      {
        ...makeValidMinimalEnvelope(),
        compat: {fallback_mode: 123 as any},
      },
      {enforceCanonicalKeyOrder: false},
    )

    expect(result).toMatchObject({
      ok: false,
      code: "ERR_ENV_FIELD_INVALID",
      field: "compat.fallback_mode",
    })
  })

  it("rejects unknown critical fields in strict mode", () => {
    const result = validatePqcEnvelope(makeMalformedEnvelopeUnknownCriticalField(), {strict: true})

    expect(result).toMatchObject({
      ok: false,
      code: "ERR_ENV_CRITICAL_FIELD_UNSUPPORTED",
      field: "critical_future",
    })
  })

  it("allows unknown critical fields in compatibility mode", () => {
    const result = validatePqcEnvelope(makeMalformedEnvelopeUnknownCriticalField(), {
      strict: false,
    })

    expect(result.ok).toBe(true)
  })

  it("rejects unknown critical recipient fields in strict mode", () => {
    const result = validatePqcEnvelope(makeMalformedEnvelopeUnknownCriticalRecipientField(), {
      strict: true,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "ERR_ENV_CRITICAL_FIELD_UNSUPPORTED",
      field: "critical_recipient_hint",
    })
  })

  it("can skip canonical key order enforcement when needed", () => {
    const envelope = {
      v: 1,
      mode: "hybrid",
      alg: "hybrid-mlkem768+x25519-aead-v1",
      ct: "base64:ciphertext",
      nonce: "base64:nonce",
      ad: "ad:sender:recipient",
      recipients: [{pk_ref: "npub1recipient", kem_alg: "mlkem768", kem_ct: "base64:ct"}],
      ts: 1739836800,
      msg_id: "msg-003",
    }

    const strictCanonical = validatePqcEnvelope(envelope, {
      enforceCanonicalKeyOrder: true,
    })
    expect(strictCanonical).toMatchObject({
      ok: false,
      code: "ERR_ENV_CANONICALIZATION",
    })

    const nonCanonicalAllowed = validatePqcEnvelope(envelope, {
      enforceCanonicalKeyOrder: false,
    })
    expect(nonCanonicalAllowed.ok).toBe(true)
  })
})
