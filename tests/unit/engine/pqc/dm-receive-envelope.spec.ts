import {describe, expect, it} from "vitest"
import {buildDmPqcEnvelope} from "../../../../src/engine/pqc/dm-envelope"
import {
  makeMalformedEnvelopeBadRecipient,
  makeMalformedEnvelopeInvalidFieldType,
  makeMalformedEnvelopeMissingField,
  makeMalformedEnvelopeUnknownCriticalField,
  makeMalformedEnvelopeUnsupportedVersion,
} from "./envelope.fixtures"
import {
  DM_SECURE_UNDECRYPTABLE_PLACEHOLDER,
  getPqcEnvelopeModeFromTags,
  parseDmPqcEnvelopeContent,
  resolveDmReceiveContent,
} from "../../../../src/engine/pqc/dm-receive-envelope"

describe("engine/pqc/dm-receive-envelope", () => {
  it("detects envelope mode tag from dm event tags", () => {
    expect(getPqcEnvelopeModeFromTags([["pqc", "hybrid"]])).toBe("hybrid")
    expect(getPqcEnvelopeModeFromTags([["pqc", "classical"]])).toBe("classical")
    expect(getPqcEnvelopeModeFromTags([["pqc", "size-fallback"]])).toBeNull()
  })

  it("parses a valid envelope and decodes plaintext", () => {
    const built = buildDmPqcEnvelope({
      plaintext: "hello secure world",
      senderPubkey: "sender",
      recipients: ["peer"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      createdAt: 1739836800,
      messageId: "msg-parse-1",
      nonceSeed: "seed",
    })

    expect(built.ok).toBe(true)

    if (built.ok) {
      const parsed = parseDmPqcEnvelopeContent(built.content, {
        expectedSenderPubkey: "sender",
        expectedRecipientPubkey: "peer",
      })

      expect(parsed.ok).toBe(true)
      if (parsed.ok) {
        expect(parsed.reason).toBe("DM_ENVELOPE_PARSE_OK")
        expect(parsed.plaintext).toBe("hello secure world")
      }
    }
  })

  it("fails parsing when associated-data sender binding does not match event context", () => {
    const built = buildDmPqcEnvelope({
      plaintext: "hello secure world",
      senderPubkey: "sender",
      recipients: ["peer"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      createdAt: 1739836800,
      messageId: "msg-parse-2",
      nonceSeed: "seed",
    })

    expect(built.ok).toBe(true)

    if (built.ok) {
      const parsed = parseDmPqcEnvelopeContent(built.content, {
        expectedSenderPubkey: "different-sender",
        expectedRecipientPubkey: "peer",
      })

      expect(parsed.ok).toBe(false)
      if (!parsed.ok) {
        expect(parsed.reason).toBe("DM_ENVELOPE_AD_BINDING_MISMATCH")
      }
    }
  })

  it("maps invalid envelope json to a stable parse reason", () => {
    const parsed = parseDmPqcEnvelopeContent("{not-json")

    expect(parsed.ok).toBe(false)
    if (!parsed.ok) {
      expect(parsed.reason).toBe("DM_ENVELOPE_PARSE_JSON_INVALID")
    }
  })

  it("falls back to legacy content in compatibility mode when parse fails", () => {
    const resolved = resolveDmReceiveContent({
      tags: [["pqc", "hybrid"]],
      decryptedContent: "not a valid envelope",
      policyMode: "compatibility",
      allowLegacyFallback: true,
    })

    expect(resolved.content).toBe("not a valid envelope")
    expect(resolved.usedLegacyFallback).toBe(true)
    expect(resolved.reason).toBe("DM_ENVELOPE_PARSE_JSON_INVALID")
  })

  it("fails closed with placeholder in strict mode when parse fails", () => {
    const resolved = resolveDmReceiveContent({
      tags: [["pqc", "hybrid"]],
      decryptedContent: "not a valid envelope",
      policyMode: "strict",
      allowLegacyFallback: true,
    })

    expect(resolved.content).toBe(DM_SECURE_UNDECRYPTABLE_PLACEHOLDER)
    expect(resolved.usedLegacyFallback).toBe(false)
    expect(resolved.reason).toBe("DM_ENVELOPE_PARSE_JSON_INVALID")
  })

  it.each([
    {
      label: "unsupported version",
      envelope: makeMalformedEnvelopeUnsupportedVersion(),
      expectedReason: "DM_ENVELOPE_VERSION_UNSUPPORTED",
    },
    {
      label: "missing required field",
      envelope: makeMalformedEnvelopeMissingField(),
      expectedReason: "DM_ENVELOPE_FIELD_MISSING",
    },
    {
      label: "invalid field type",
      envelope: makeMalformedEnvelopeInvalidFieldType(),
      expectedReason: "DM_ENVELOPE_FIELD_INVALID",
    },
    {
      label: "recipient wrap invalid",
      envelope: makeMalformedEnvelopeBadRecipient(),
      expectedReason: "DM_ENVELOPE_RECIPIENT_WRAP_INVALID",
    },
    {
      label: "critical unsupported field",
      envelope: makeMalformedEnvelopeUnknownCriticalField(),
      expectedReason: "DM_ENVELOPE_CRITICAL_FIELD_UNSUPPORTED",
    },
    {
      label: "canonicalization failure",
      envelope: {
        v: 1,
        mode: "hybrid",
        alg: "hybrid-mlkem768+x25519-aead-v1",
        ct: "base64:ciphertext",
        nonce: "base64:nonce",
        ad: "ad:sender:recipient",
        recipients: [{pk_ref: "npub1recipient", kem_alg: "mlkem768", kem_ct: "base64:ct"}],
        ts: 1739836800,
        msg_id: "msg-canonical-fail",
      },
      expectedReason: "DM_ENVELOPE_CANONICALIZATION_FAILED",
    },
  ])(
    "maps validation errors to stable parse reason codes: $label",
    ({envelope, expectedReason}) => {
      const content = JSON.stringify(envelope)
      const parsed = parseDmPqcEnvelopeContent(content)

      expect(parsed.ok).toBe(false)
      if (!parsed.ok) {
        expect(parsed.reason).toBe(expectedReason)
      }
    },
  )
})
