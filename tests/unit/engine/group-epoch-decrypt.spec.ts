import {describe, expect, it} from "vitest"
import {GROUP_KINDS} from "../../../src/domain/group-kinds"
import {encodeSecureGroupEpochContent} from "../../../src/engine/group-epoch-content"
import {validateAndDecryptSecureGroupEventContent} from "../../../src/engine/group-epoch-decrypt"
import {randomBytes} from "../../../src/engine/pqc/crypto-provider"

describe("engine/group-epoch-decrypt", () => {
  const epochKey = randomBytes(32)

  it("accepts non-message events without decrypt checks", async () => {
    const result = await validateAndDecryptSecureGroupEventContent({
      event: {
        id: "control-1",
        kind: GROUP_KINDS.NIP29.REMOVE_USER,
        content: "",
      },
      expectedEpochId: "epoch:ops:2:200",
      epochKeyBytes: epochKey,
    })

    expect(result).toEqual({ok: true})
  })

  it("validates and decrypts secure group message content", async () => {
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
      const result = await validateAndDecryptSecureGroupEventContent({
        event: {
          id: "msg-1",
          kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
          content: encoded.content,
        },
        expectedEpochId: "epoch:ops:2:200",
        epochKeyBytes: epochKey,
      })

      expect(result).toMatchObject({ok: true, plaintext: "hello secure group"})
    }
  })

  it("returns parse failure reason for malformed content", async () => {
    const result = await validateAndDecryptSecureGroupEventContent({
      event: {
        id: "msg-2",
        kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
        content: "not-an-envelope",
      },
      expectedEpochId: "epoch:ops:2:200",
      epochKeyBytes: epochKey,
    })

    expect(result).toEqual({
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED",
      eventId: "msg-2",
    })
  })

  it("returns epoch mismatch reason when envelope epoch differs", async () => {
    const encoded = await encodeSecureGroupEpochContent({
      groupId: "ops",
      epochId: "epoch:ops:2:200",
      plaintext: "hello secure group",
      senderPubkey: "f".repeat(64),
      recipients: ["a".repeat(64)],
      epochKeyBytes: epochKey,
      createdAt: 1739836800,
    })

    expect(encoded.ok).toBe(true)

    if (encoded.ok) {
      const result = await validateAndDecryptSecureGroupEventContent({
        event: {
          id: "msg-3",
          kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
          content: encoded.content,
        },
        expectedEpochId: "epoch:ops:3:300",
        epochKeyBytes: epochKey,
      })

      expect(result).toEqual({
        ok: false,
        reason: "GROUP_EPOCH_CONTENT_EPOCH_MISMATCH",
        eventId: "msg-3",
      })
    }
  })
})
