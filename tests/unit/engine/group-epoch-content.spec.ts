import {describe, expect, it} from "vitest"
import {
  decodeSecureGroupEpochContent,
  encodeSecureGroupEpochContent,
  GROUP_EPOCH_CONTENT_ALGORITHM,
  GROUP_EPOCH_CONTENT_VERSION,
} from "../../../src/engine/group-epoch-content"
import {randomBytes} from "../../../src/engine/pqc/crypto-provider"

describe("engine/group-epoch-content", () => {
  const epochKey = randomBytes(32)

  it("encodes secure group content envelope with epoch metadata", async () => {
    const encoded = await encodeSecureGroupEpochContent({
      groupId: "ops",
      epochId: "epoch:ops:2:200",
      plaintext: "hello secure group",
      senderPubkey: "f".repeat(64),
      recipients: ["a".repeat(64), "b".repeat(64)],
      epochKeyBytes: epochKey,
      createdAt: 1739836800,
    })

    expect(encoded.ok).toBe(true)

    if (encoded.ok) {
      expect(encoded.envelope.v).toBe(GROUP_EPOCH_CONTENT_VERSION)
      expect(encoded.envelope.alg).toBe(GROUP_EPOCH_CONTENT_ALGORITHM)
      expect(encoded.envelope.epoch_id).toBe("epoch:ops:2:200")
    }
  })

  it("round-trips encoded secure group content", async () => {
    const encoded = await encodeSecureGroupEpochContent({
      groupId: "ops",
      epochId: "epoch:ops:2:200",
      plaintext: "hello secure group",
      senderPubkey: "f".repeat(64),
      recipients: ["a".repeat(64), "b".repeat(64)],
      epochKeyBytes: epochKey,
      createdAt: 1739836800,
    })

    expect(encoded.ok).toBe(true)

    if (encoded.ok) {
      const decoded = await decodeSecureGroupEpochContent(encoded.content, epochKey)

      expect(decoded.ok).toBe(true)
      if (decoded.ok) {
        expect(decoded.plaintext).toBe("hello secure group")
        expect(decoded.envelope.epoch_id).toBe("epoch:ops:2:200")
      }
    }
  })

  it("fails safe when epoch metadata is unavailable", async () => {
    const encoded = await encodeSecureGroupEpochContent({
      groupId: "ops",
      epochId: "",
      plaintext: "hello secure group",
      senderPubkey: "f".repeat(64),
      recipients: ["a".repeat(64)],
      epochKeyBytes: epochKey,
    })

    expect(encoded).toMatchObject({
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_ENCODE_FAILED",
    })
  })

  it("rejects invalid encoded content envelope", async () => {
    const decoded = await decodeSecureGroupEpochContent('{"mode":"unknown"}', epochKey)

    expect(decoded).toMatchObject({
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED",
    })
  })
})
