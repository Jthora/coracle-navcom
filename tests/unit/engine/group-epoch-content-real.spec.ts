import {describe, it, expect} from "vitest"
import {
  encodeSecureGroupEpochContent,
  decodeSecureGroupEpochContent,
} from "src/engine/group-epoch-content"
import {randomBytes} from "src/engine/pqc/crypto-provider"

describe("Group Epoch Content — Real AEAD", () => {
  const makeInput = (epochKey: Uint8Array) => ({
    groupId: "group-earth-alliance",
    epochId: "epoch-7",
    plaintext: "This is a classified Earth Alliance message",
    senderPubkey: "a".repeat(64),
    recipients: ["b".repeat(64)],
    epochKeyBytes: epochKey,
    createdAt: 1739836800,
  })

  it("ciphertext is NOT base64 of plaintext (anti-placeholder test)", async () => {
    const epochKey = randomBytes(32)
    const input = makeInput(epochKey)

    const result = await encodeSecureGroupEpochContent(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // THE CRITICAL TEST: ct must NOT be base64(plaintext)
    const decoded = atob(result.envelope.ct)
    expect(decoded).not.toBe(input.plaintext)
    expect(decoded).not.toContain(input.plaintext)

    // Also verify the entire JSON content doesn't contain the plaintext
    expect(result.content).not.toContain(input.plaintext)
  })

  it("roundtrips through encrypt and decrypt", async () => {
    const epochKey = randomBytes(32)
    const input = makeInput(epochKey)

    const encoded = await encodeSecureGroupEpochContent(input)
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) return

    const decoded = await decodeSecureGroupEpochContent(encoded.content, epochKey)
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) return
    expect(decoded.plaintext).toBe(input.plaintext)
  })

  it("fails to decrypt with wrong epoch key", async () => {
    const key1 = randomBytes(32)
    const key2 = randomBytes(32)

    const encoded = await encodeSecureGroupEpochContent(makeInput(key1))
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) return

    const decoded = await decodeSecureGroupEpochContent(encoded.content, key2)
    expect(decoded.ok).toBe(false)
  })

  it("produces different nonces for same input (random, not deterministic)", async () => {
    const epochKey = randomBytes(32)
    const input = makeInput(epochKey)

    const r1 = await encodeSecureGroupEpochContent(input)
    const r2 = await encodeSecureGroupEpochContent(input)

    expect(r1.ok).toBe(true)
    expect(r2.ok).toBe(true)
    if (!r1.ok || !r2.ok) return

    expect(r1.envelope.nonce).not.toBe(r2.envelope.nonce)
    expect(r1.envelope.ct).not.toBe(r2.envelope.ct)
  })

  it("uses aes-256-gcm algorithm identifier", async () => {
    const epochKey = randomBytes(32)
    const result = await encodeSecureGroupEpochContent(makeInput(epochKey))
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.envelope.alg).toBe("aes-256-gcm")
  })

  it("rejects missing groupId or epochId", async () => {
    const epochKey = randomBytes(32)

    const r1 = await encodeSecureGroupEpochContent({
      ...makeInput(epochKey),
      groupId: "",
    })
    expect(r1.ok).toBe(false)

    const r2 = await encodeSecureGroupEpochContent({
      ...makeInput(epochKey),
      epochId: "",
    })
    expect(r2.ok).toBe(false)
  })

  it("rejects missing sender/recipients/plaintext", async () => {
    const epochKey = randomBytes(32)

    const r1 = await encodeSecureGroupEpochContent({
      ...makeInput(epochKey),
      senderPubkey: "",
    })
    expect(r1.ok).toBe(false)

    const r2 = await encodeSecureGroupEpochContent({
      ...makeInput(epochKey),
      recipients: [],
    })
    expect(r2.ok).toBe(false)

    const r3 = await encodeSecureGroupEpochContent({
      ...makeInput(epochKey),
      plaintext: "",
    })
    expect(r3.ok).toBe(false)
  })

  it("detects tampered ciphertext", async () => {
    const epochKey = randomBytes(32)
    const encoded = await encodeSecureGroupEpochContent(makeInput(epochKey))
    expect(encoded.ok).toBe(true)
    if (!encoded.ok) return

    // Tamper with the ciphertext in the JSON
    const envelope = JSON.parse(encoded.content)
    const ctBytes = Uint8Array.from(atob(envelope.ct), c => c.charCodeAt(0))
    ctBytes[0] ^= 0xff
    let tampered = ""
    ctBytes.forEach(b => {
      tampered += String.fromCharCode(b)
    })
    envelope.ct = btoa(tampered)

    const decoded = await decodeSecureGroupEpochContent(JSON.stringify(envelope), epochKey)
    expect(decoded.ok).toBe(false)
  })
})
