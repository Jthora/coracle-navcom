import {describe, expect, it, vi} from "vitest"
import {
  buildDmEnvelopeAssociatedData,
  buildDmPqcEnvelope,
} from "../../../../src/engine/pqc/dm-envelope"
import {validatePqcEnvelope} from "../../../../src/engine/pqc/envelope-validation"
import {mlKemKeygen} from "../../../../src/engine/pqc/crypto-provider"

describe("engine/pqc/dm-envelope", () => {
  it("builds a valid hybrid envelope payload", async () => {
    const r1Keys = mlKemKeygen()
    const r2Keys = mlKemKeygen()
    const recipientPqPublicKeys = new Map<string, Uint8Array>([
      ["r1", r1Keys.publicKey],
      ["r2", r2Keys.publicKey],
    ])

    const result = await buildDmPqcEnvelope({
      plaintext: "hello",
      senderPubkey: "sender",
      recipients: ["r2", "r1"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys,
      createdAt: 1739836800,
      messageId: "msg-1",
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      const parsed = JSON.parse(result.content)
      const validation = validatePqcEnvelope(parsed)
      expect(validation.ok).toBe(true)
      expect(parsed.mode).toBe("hybrid")
      expect(parsed.alg).toBe("hybrid-mlkem768+x25519-aead-v1")
    }
  })

  it("includes compatibility metadata for classical fallback", async () => {
    const r1Keys = mlKemKeygen()
    const recipientPqPublicKeys = new Map<string, Uint8Array>([["r1", r1Keys.publicKey]])

    const result = await buildDmPqcEnvelope({
      plaintext: "hello",
      senderPubkey: "sender",
      recipients: ["r1"],
      mode: "classical",
      algorithm: "classical-x25519-aead-v1",
      recipientPqPublicKeys,
      fallbackReasonCode: "NEGOTIATION_NO_CAPS",
      createdAt: 1739836800,
      messageId: "msg-2",
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.envelope.compat?.reason_code).toBe("NEGOTIATION_NO_CAPS")
      expect(result.envelope.compat?.fallback_mode).toBe("classical-x25519-aead-v1")
    }
  })

  it("fails when recipients are missing", async () => {
    const result = await buildDmPqcEnvelope({
      plaintext: "hello",
      senderPubkey: "sender",
      recipients: [],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys: new Map(),
    })

    expect(result).toMatchObject({
      ok: false,
      reason: "DM_ENVELOPE_ENCODE_FAILED",
    })
  })

  it("produces associated data bound to sender/recipients/mode", () => {
    const ad = buildDmEnvelopeAssociatedData({
      senderPubkey: "sender",
      recipients: ["z", "a"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      createdAt: 1739836800,
      messageId: "msg-3",
    })

    expect(ad).toContain('"sender":"sender"')
    expect(ad).toContain('"recipients":["a","z"]')
    expect(ad).toContain('"mode":"hybrid"')
  })

  it("zeroes KEM shared secrets after HKDF derivation", async () => {
    const r1Keys = mlKemKeygen()
    const recipientPqPublicKeys = new Map<string, Uint8Array>([["r1", r1Keys.publicKey]])

    // Track fill(0) calls on Uint8Array instances
    const fillCalls: Array<{length: number; value: number}> = []
    const origFill = Uint8Array.prototype.fill
    const spy = vi.spyOn(Uint8Array.prototype, "fill").mockImplementation(function (
      this: Uint8Array,
      ...args: Parameters<Uint8Array["fill"]>
    ) {
      if (args[0] === 0) {
        fillCalls.push({length: this.length, value: 0})
      }
      return origFill.apply(this, args)
    })

    await buildDmPqcEnvelope({
      plaintext: "zeroize test",
      senderPubkey: "sender",
      recipients: ["r1"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys,
      createdAt: 1739836800,
      messageId: "msg-zero",
    })

    spy.mockRestore()

    // KEM shared secret (32 bytes) and salt should both be zeroed
    const zeroedLengths = fillCalls.map(c => c.length)
    expect(zeroedLengths).toContain(32) // kemSs
    expect(fillCalls.length).toBeGreaterThanOrEqual(2) // at least kemSs + salt
  })

  it("includes confirmation_tag in each recipient bundle", async () => {
    const r1Keys = mlKemKeygen()
    const recipientPqPublicKeys = new Map<string, Uint8Array>([["r1", r1Keys.publicKey]])

    const result = await buildDmPqcEnvelope({
      plaintext: "confirmation test",
      senderPubkey: "sender",
      recipients: ["r1"],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys,
      createdAt: 1739836800,
      messageId: "msg-confirm",
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      const parsed = JSON.parse(result.content)
      for (const r of parsed.recipients) {
        expect(r.confirmation_tag).toBeDefined()
        expect(typeof r.confirmation_tag).toBe("string")
        expect(r.confirmation_tag.length).toBeGreaterThan(0)
      }
    }
  })
})
