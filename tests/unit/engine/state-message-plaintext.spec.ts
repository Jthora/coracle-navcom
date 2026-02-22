import {describe, expect, it} from "vitest"
import {buildDmPqcEnvelope} from "src/engine/pqc/dm-envelope"
import {
  deriveExpectedRecipientPubkeys,
  resolveMessagePlaintext,
} from "src/engine/state-message-plaintext"

describe("engine/state-message-plaintext", () => {
  it("derives deterministic recipient candidates across order permutations and duplicates", () => {
    const candidatesA = deriveExpectedRecipientPubkeys({
      tags: [
        ["p", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
        ["p", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
        ["p", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
      ],
    })

    const candidatesB = deriveExpectedRecipientPubkeys({
      tags: [
        ["p", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
        ["p", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
      ],
    })

    expect(candidatesA).toEqual(candidatesB)
    expect(candidatesA).toEqual([
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    ])
  })

  it("prefers local pubkey when present in recipient candidates", () => {
    const localPubkey = "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"

    const candidates = deriveExpectedRecipientPubkeys({
      tags: [
        ["p", "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
        ["p", localPubkey],
      ],
      localPubkey,
    })

    expect(candidates[0]).toBe(localPubkey)
    expect(candidates).toEqual([
      "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    ])
  })

  it("resolves self-send plaintext in strict mode for multi-recipient tags regardless of order", () => {
    const localPubkey = "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
    const recipientA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    const recipientB = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

    const built = buildDmPqcEnvelope({
      plaintext: "self-send multi recipient",
      senderPubkey: localPubkey,
      recipients: [recipientB, recipientA],
      mode: "hybrid",
      algorithm: "hybrid-mlkem768+x25519-aead-v1",
      createdAt: 1739836800,
      messageId: "msg-self-send-multi",
      nonceSeed: "seed",
    })

    expect(built.ok).toBe(true)

    if (!built.ok) {
      return
    }

    const event = {
      id: "evt-self-send",
      pubkey: localPubkey,
      created_at: 1739836801,
      tags: [
        ["pqc", "hybrid"],
        ["p", recipientA],
        ["p", recipientB],
      ],
    } as any

    const plaintext = resolveMessagePlaintext({
      event,
      decryptedContent: built.content,
      policyMode: "strict",
      allowLegacyFallback: false,
      localPubkey,
    })

    expect(plaintext).toBe("self-send multi recipient")
  })
})
