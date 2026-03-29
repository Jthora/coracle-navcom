import {describe, expect, it} from "vitest"
import {
  decodeSecureGroupEpochContent,
  encodeSecureGroupEpochContent,
  extractSealedMeta,
  buildSealedContent,
  parseSealedContent,
  sealedMetaToTags,
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

  describe("sealed metadata", () => {
    it("extractSealedMeta separates sensitive tags from non-sensitive", () => {
      const extraTags = [
        ["msg-type", "alert"],
        ["priority", "high"],
        ["location", "34.05,-118.24"],
        ["g", "9q5ctr"],
        ["pqc", "hybrid"],
        ["pqc_alg", "mlkem768"],
      ]

      const {meta, remainingTags} = extractSealedMeta(extraTags)

      expect(meta).toEqual({
        type: "alert",
        priority: "high",
        location: "34.05,-118.24",
        geohash: "9q5ctr",
      })
      expect(remainingTags).toEqual([
        ["pqc", "hybrid"],
        ["pqc_alg", "mlkem768"],
      ])
    })

    it("extractSealedMeta returns empty meta when no sensitive tags", () => {
      const {meta, remainingTags} = extractSealedMeta([["pqc", "hybrid"]])
      expect(meta).toEqual({})
      expect(remainingTags).toEqual([["pqc", "hybrid"]])
    })

    it("buildSealedContent wraps plaintext with metadata", () => {
      const sealed = buildSealedContent("Hello team", {type: "sitrep", location: "34.05,-118.24"})
      const parsed = JSON.parse(sealed)
      expect(parsed.text).toBe("Hello team")
      expect(parsed.meta.type).toBe("sitrep")
      expect(parsed.meta.location).toBe("34.05,-118.24")
    })

    it("buildSealedContent returns plain text when no metadata", () => {
      const result = buildSealedContent("Hello team", {})
      expect(result).toBe("Hello team")
    })

    it("parseSealedContent parses sealed envelope", () => {
      const envelope = JSON.stringify({text: "Check-in", meta: {type: "check-in", geohash: "9q5c"}})
      const {text, meta} = parseSealedContent(envelope)
      expect(text).toBe("Check-in")
      expect(meta.type).toBe("check-in")
      expect(meta.geohash).toBe("9q5c")
    })

    it("parseSealedContent handles old-format plain text", () => {
      const {text, meta} = parseSealedContent("Just a plain message")
      expect(text).toBe("Just a plain message")
      expect(meta).toEqual({})
    })

    it("parseSealedContent rejects malformed JSON gracefully", () => {
      const {text, meta} = parseSealedContent("{bad json")
      expect(text).toBe("{bad json")
      expect(meta).toEqual({})
    })

    it("parseSealedContent validates meta field types", () => {
      const envelope = JSON.stringify({text: "msg", meta: {type: 123, location: true}})
      const {text, meta} = parseSealedContent(envelope)
      expect(text).toBe("msg")
      // Non-string fields are rejected
      expect(meta.type).toBeUndefined()
      expect(meta.location).toBeUndefined()
    })

    it("parseSealedContent ignores non-envelope JSON objects", () => {
      // A valid JSON object that is NOT a SealedMetaEnvelope
      const {text, meta} = parseSealedContent('{"mode":"group-epoch-v1","ct":"abc"}')
      expect(text).toBe('{"mode":"group-epoch-v1","ct":"abc"}')
      expect(meta).toEqual({})
    })

    it("sealedMetaToTags converts metadata back to event tags", () => {
      const tags = sealedMetaToTags({
        type: "alert",
        priority: "high",
        location: "34.05,-118.24",
        geohash: "9q5c",
      })
      expect(tags).toEqual([
        ["msg-type", "alert"],
        ["location", "34.05,-118.24"],
        ["g", "9q5c"],
        ["priority", "high"],
      ])
    })

    it("sealedMetaToTags returns empty array for empty metadata", () => {
      expect(sealedMetaToTags({})).toEqual([])
    })

    it("round-trips sealed content through encryption/decryption", async () => {
      const meta = {type: "sitrep", location: "34.05,-118.24", geohash: "9q5ctr"}
      const sealed = buildSealedContent("Status update from field", meta)

      const encoded = await encodeSecureGroupEpochContent({
        groupId: "ops",
        epochId: "epoch:ops:3:300",
        plaintext: sealed,
        senderPubkey: "f".repeat(64),
        recipients: ["a".repeat(64)],
        epochKeyBytes: epochKey,
        createdAt: 1739836800,
      })

      expect(encoded.ok).toBe(true)
      if (!encoded.ok) return

      const decoded = await decodeSecureGroupEpochContent(encoded.content, epochKey)
      expect(decoded.ok).toBe(true)
      if (!decoded.ok) return

      const result = parseSealedContent(decoded.plaintext)
      expect(result.text).toBe("Status update from field")
      expect(result.meta.type).toBe("sitrep")
      expect(result.meta.location).toBe("34.05,-118.24")
      expect(result.meta.geohash).toBe("9q5ctr")
    })
  })
})
