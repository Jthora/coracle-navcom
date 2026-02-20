import {describe, expect, it} from "vitest"
import {
  decodeSecureGroupEpochContent,
  encodeSecureGroupEpochContent,
  GROUP_EPOCH_CONTENT_ALGORITHM,
  GROUP_EPOCH_CONTENT_VERSION,
} from "../../../src/engine/group-epoch-content"

describe("engine/group-epoch-content", () => {
  it("encodes secure group content envelope with epoch metadata", () => {
    const encoded = encodeSecureGroupEpochContent({
      groupId: "ops",
      epochId: "epoch:ops:2:200",
      plaintext: "hello secure group",
      senderPubkey: "f".repeat(64),
      recipients: ["a".repeat(64), "b".repeat(64)],
      createdAt: 1739836800,
    })

    expect(encoded.ok).toBe(true)

    if (encoded.ok) {
      expect(encoded.envelope.v).toBe(GROUP_EPOCH_CONTENT_VERSION)
      expect(encoded.envelope.alg).toBe(GROUP_EPOCH_CONTENT_ALGORITHM)
      expect(encoded.envelope.epoch_id).toBe("epoch:ops:2:200")
    }
  })

  it("round-trips encoded secure group content", () => {
    const encoded = encodeSecureGroupEpochContent({
      groupId: "ops",
      epochId: "epoch:ops:2:200",
      plaintext: "hello secure group",
      senderPubkey: "f".repeat(64),
      recipients: ["a".repeat(64), "b".repeat(64)],
      createdAt: 1739836800,
    })

    expect(encoded.ok).toBe(true)

    if (encoded.ok) {
      const decoded = decodeSecureGroupEpochContent(encoded.content)

      expect(decoded.ok).toBe(true)
      if (decoded.ok) {
        expect(decoded.plaintext).toBe("hello secure group")
        expect(decoded.envelope.epoch_id).toBe("epoch:ops:2:200")
      }
    }
  })

  it("fails safe when epoch metadata is unavailable", () => {
    const encoded = encodeSecureGroupEpochContent({
      groupId: "ops",
      epochId: "",
      plaintext: "hello secure group",
      senderPubkey: "f".repeat(64),
      recipients: ["a".repeat(64)],
    })

    expect(encoded).toMatchObject({
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_ENCODE_FAILED",
    })
  })

  it("rejects invalid encoded content envelope", () => {
    const decoded = decodeSecureGroupEpochContent('{"mode":"unknown"}')

    expect(decoded).toMatchObject({
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED",
    })
  })
})
