import {describe, expect, it} from "vitest"
import {
  buildSecureGroupWelcomeEvent,
  parseSecureGroupWelcome,
  type SecureGroupWelcomePayload,
} from "src/engine/group-epoch-welcome"
import {GROUP_KINDS} from "src/domain/group-kinds"

const baseTrustedEvent = {
  id: "evt-welcome-1",
  pubkey: "a".repeat(64),
  created_at: 100,
  sig: "b".repeat(128),
}

const validInput = {
  groupId: "test-group",
  epochId: "epoch-001",
  epochSequence: 1,
  creatorPubkey: "a".repeat(64),
  creatorPqKeyId: "pqkey-001",
}

describe("engine/group-epoch-welcome", () => {
  describe("buildSecureGroupWelcomeEvent", () => {
    it("builds a kind 444 event with correct tags and content", () => {
      const result = buildSecureGroupWelcomeEvent(validInput)

      expect(result.kind).toBe(GROUP_KINDS.NIP_EE.WELCOME)
      expect(result.tags).toEqual(
        expect.arrayContaining([
          ["h", "test-group"],
          ["d", "test-group"],
          ["epoch", "epoch-001"],
          ["epoch_seq", "1"],
          ["transport", "secure-nip-ee"],
        ]),
      )

      const payload = JSON.parse(result.content) as SecureGroupWelcomePayload
      expect(payload.v).toBe(1)
      expect(payload.group_id).toBe("test-group")
      expect(payload.epoch_id).toBe("epoch-001")
      expect(payload.epoch_sequence).toBe(1)
      expect(payload.transport_mode).toBe("secure-nip-ee")
      expect(payload.creator_pubkey).toBe("a".repeat(64))
      expect(payload.creator_pq_key_id).toBe("pqkey-001")
      expect(typeof payload.created_at).toBe("number")
    })
  })

  describe("parseSecureGroupWelcome", () => {
    it("round-trips build → parse preserving all fields", () => {
      const built = buildSecureGroupWelcomeEvent(validInput)
      const event = {
        ...baseTrustedEvent,
        kind: built.kind,
        content: built.content,
        tags: built.tags,
      } as any

      const result = parseSecureGroupWelcome(event)
      expect(result.ok).toBe(true)

      if (!result.ok) throw new Error("Expected ok")

      expect(result.payload.group_id).toBe("test-group")
      expect(result.payload.epoch_id).toBe("epoch-001")
      expect(result.payload.epoch_sequence).toBe(1)
      expect(result.payload.transport_mode).toBe("secure-nip-ee")
      expect(result.payload.creator_pubkey).toBe("a".repeat(64))
      expect(result.payload.creator_pq_key_id).toBe("pqkey-001")
    })

    it("rejects wrong kind", () => {
      const result = parseSecureGroupWelcome({
        ...baseTrustedEvent,
        kind: 999,
        content: "{}",
        tags: [],
      } as any)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain("Expected kind")
      }
    })

    it("rejects malformed JSON", () => {
      const result = parseSecureGroupWelcome({
        ...baseTrustedEvent,
        kind: GROUP_KINDS.NIP_EE.WELCOME,
        content: "not-json{",
        tags: [],
      } as any)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain("Invalid JSON")
      }
    })

    it("rejects non-object content", () => {
      const result = parseSecureGroupWelcome({
        ...baseTrustedEvent,
        kind: GROUP_KINDS.NIP_EE.WELCOME,
        content: '"just a string"',
        tags: [],
      } as any)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain("not an object")
      }
    })

    it("rejects unsupported version", () => {
      const result = parseSecureGroupWelcome({
        ...baseTrustedEvent,
        kind: GROUP_KINDS.NIP_EE.WELCOME,
        content: JSON.stringify({v: 2}),
        tags: [],
      } as any)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain("Unsupported WELCOME version")
      }
    })

    it("rejects missing required fields", () => {
      const incomplete = {
        v: 1,
        group_id: "test",
        // missing epoch_id and other fields
      }

      const result = parseSecureGroupWelcome({
        ...baseTrustedEvent,
        kind: GROUP_KINDS.NIP_EE.WELCOME,
        content: JSON.stringify(incomplete),
        tags: [],
      } as any)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.reason).toContain("epoch_id")
      }
    })
  })
})
