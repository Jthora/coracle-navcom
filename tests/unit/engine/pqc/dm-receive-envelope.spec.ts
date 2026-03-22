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
import {
  mlKemKeygen,
  randomBytes,
  base64ToBytes,
  bytesToBase64,
} from "../../../../src/engine/pqc/crypto-provider"

// Shared key material for tests that need build+parse roundtrips
const peerKeys = mlKemKeygen()
const senderKeys = mlKemKeygen()
const dummySecretKey = randomBytes(32) // For tests that don't need real decryption

describe("engine/pqc/dm-receive-envelope", () => {
  it("detects envelope mode tag from dm event tags", () => {
    expect(getPqcEnvelopeModeFromTags([["pqc", "hybrid"]])).toBe("hybrid")
    expect(getPqcEnvelopeModeFromTags([["pqc", "classical"]])).toBe("classical")
    expect(getPqcEnvelopeModeFromTags([["pqc", "size-fallback"]])).toBeNull()
  })

  it("parses a valid envelope and decodes plaintext", async () => {
    const recipientPqPublicKeys = new Map<string, Uint8Array>([["peer", peerKeys.publicKey]])

    const built = await buildDmPqcEnvelope({
      plaintext: "hello secure world",
      senderPubkey: "sender",
      recipients: ["peer"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys,
      createdAt: 1739836800,
      messageId: "msg-parse-1",
    })

    expect(built.ok).toBe(true)

    if (built.ok) {
      const parsed = await parseDmPqcEnvelopeContent(built.content, {
        recipientSecretKey: peerKeys.secretKey,
        recipientPubkey: "peer",
        senderPubkey: "sender",
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

  it("fails parsing when associated-data sender binding does not match event context", async () => {
    const recipientPqPublicKeys = new Map<string, Uint8Array>([["peer", peerKeys.publicKey]])

    const built = await buildDmPqcEnvelope({
      plaintext: "hello secure world",
      senderPubkey: "sender",
      recipients: ["peer"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys,
      createdAt: 1739836800,
      messageId: "msg-parse-2",
    })

    expect(built.ok).toBe(true)

    if (built.ok) {
      const parsed = await parseDmPqcEnvelopeContent(built.content, {
        recipientSecretKey: peerKeys.secretKey,
        recipientPubkey: "peer",
        senderPubkey: "sender",
        expectedSenderPubkey: "different-sender",
        expectedRecipientPubkey: "peer",
      })

      expect(parsed.ok).toBe(false)
      if (!parsed.ok) {
        expect(parsed.reason).toBe("DM_ENVELOPE_AD_BINDING_MISMATCH")
      }
    }
  })

  it("accepts parse when any provided expected recipient candidate matches associated data", async () => {
    const peerAKeys = mlKemKeygen()
    const peerBKeys = mlKemKeygen()
    const recipientPqPublicKeys = new Map<string, Uint8Array>([
      ["peer-a", peerAKeys.publicKey],
      ["peer-b", peerBKeys.publicKey],
    ])

    const built = await buildDmPqcEnvelope({
      plaintext: "hello candidate binding",
      senderPubkey: "sender",
      recipients: ["peer-a", "peer-b"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys,
      createdAt: 1739836800,
      messageId: "msg-parse-candidates",
    })

    expect(built.ok).toBe(true)

    if (built.ok) {
      const parsed = await parseDmPqcEnvelopeContent(built.content, {
        recipientSecretKey: peerBKeys.secretKey,
        recipientPubkey: "peer-b",
        senderPubkey: "sender",
        expectedSenderPubkey: "sender",
        expectedRecipientPubkeys: ["peer-z", "peer-b"],
      })

      expect(parsed.ok).toBe(true)
      if (parsed.ok) {
        expect(parsed.reason).toBe("DM_ENVELOPE_PARSE_OK")
        expect(parsed.plaintext).toBe("hello candidate binding")
      }
    }
  })

  it("maps invalid envelope json to a stable parse reason", async () => {
    const parsed = await parseDmPqcEnvelopeContent("{not-json", {
      recipientSecretKey: dummySecretKey,
      recipientPubkey: "peer",
      senderPubkey: "sender",
    })

    expect(parsed.ok).toBe(false)
    if (!parsed.ok) {
      expect(parsed.reason).toBe("DM_ENVELOPE_PARSE_JSON_INVALID")
    }
  })

  it("falls back to legacy content in compatibility mode when parse fails", async () => {
    const resolved = await resolveDmReceiveContent({
      tags: [["pqc", "hybrid"]],
      decryptedContent: "not a valid envelope",
      policyMode: "compatibility",
      allowLegacyFallback: true,
      recipientSecretKey: dummySecretKey,
      recipientPubkey: "peer",
      senderPubkey: "sender",
    })

    expect(resolved.content).toBe("not a valid envelope")
    expect(resolved.usedLegacyFallback).toBe(true)
    expect(resolved.reason).toBe("DM_ENVELOPE_PARSE_JSON_INVALID")
  })

  it("fails closed with placeholder in strict mode when parse fails", async () => {
    const resolved = await resolveDmReceiveContent({
      tags: [["pqc", "hybrid"]],
      decryptedContent: "not a valid envelope",
      policyMode: "strict",
      allowLegacyFallback: true,
      recipientSecretKey: dummySecretKey,
      recipientPubkey: "peer",
      senderPubkey: "sender",
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
    async ({envelope, expectedReason}) => {
      const content = JSON.stringify(envelope)
      const parsed = await parseDmPqcEnvelopeContent(content, {
        recipientSecretKey: dummySecretKey,
        recipientPubkey: "peer",
        senderPubkey: "sender",
      })

      expect(parsed.ok).toBe(false)
      if (!parsed.ok) {
        expect(parsed.reason).toBe(expectedReason)
      }
    },
  )

  it("detects tampered KEM ciphertext via confirmation tag mismatch", async () => {
    const recipientPqPublicKeys = new Map<string, Uint8Array>([["peer", peerKeys.publicKey]])

    const built = await buildDmPqcEnvelope({
      plaintext: "confirmation test",
      senderPubkey: "sender",
      recipients: ["peer"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys,
      createdAt: 1739836800,
      messageId: "msg-tamper",
    })

    expect(built.ok).toBe(true)
    if (built.ok) {
      // Tamper with the confirmation tag
      const envelope = JSON.parse(built.content)
      const tamperedTag = base64ToBytes(envelope.recipients[0].confirmation_tag)
      tamperedTag[0] ^= 0xff // flip bits
      envelope.recipients[0].confirmation_tag = bytesToBase64(tamperedTag)

      const parsed = await parseDmPqcEnvelopeContent(JSON.stringify(envelope), {
        recipientSecretKey: peerKeys.secretKey,
        recipientPubkey: "peer",
        senderPubkey: "sender",
        expectedSenderPubkey: "sender",
        expectedRecipientPubkey: "peer",
      })

      // Should fail because tampered tag won't match recomputed HMAC
      expect(parsed.ok).toBe(false)
      if (!parsed.ok) {
        expect(parsed.reason).toBe("DM_ENVELOPE_AD_BINDING_MISMATCH")
      }
    }
  })

  it("accepts old envelopes without confirmation tag (backward compatibility)", async () => {
    const recipientPqPublicKeys = new Map<string, Uint8Array>([["peer", peerKeys.publicKey]])

    const built = await buildDmPqcEnvelope({
      plaintext: "no-tag compat test",
      senderPubkey: "sender",
      recipients: ["peer"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys,
      createdAt: 1739836800,
      messageId: "msg-compat",
    })

    expect(built.ok).toBe(true)
    if (built.ok) {
      // Remove the confirmation tag to simulate an old envelope
      const envelope = JSON.parse(built.content)
      delete envelope.recipients[0].confirmation_tag

      const parsed = await parseDmPqcEnvelopeContent(JSON.stringify(envelope), {
        recipientSecretKey: peerKeys.secretKey,
        recipientPubkey: "peer",
        senderPubkey: "sender",
        expectedSenderPubkey: "sender",
        expectedRecipientPubkey: "peer",
      })

      // Should succeed — old envelopes without tag are accepted
      expect(parsed.ok).toBe(true)
      if (parsed.ok) {
        expect(parsed.plaintext).toBe("no-tag compat test")
      }
    }
  })
})
