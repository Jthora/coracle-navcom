import {describe, expect, it, vi} from "vitest"
import {mlKemKeygen, randomBytes} from "src/engine/pqc/crypto-provider"
import {buildEpochKeyShareEvent, receiveEpochKeyShare} from "src/engine/group-epoch-key-share"
import {GROUP_KINDS} from "src/domain/group-kinds"

// Mock resolvePeerPqPublicKey to return pre-generated keys
const testKeys = new Map<string, ReturnType<typeof mlKemKeygen>>()

vi.mock("src/engine/pqc/pq-key-lifecycle", () => ({
  resolvePeerPqPublicKey: async (pubkey: string) => {
    const kp = testKeys.get(pubkey)
    return kp?.publicKey ?? null
  },
}))

function setupRecipient(pubkey: string) {
  const kp = mlKemKeygen()
  testKeys.set(pubkey, kp)
  return kp
}

describe("engine/group-epoch-key-share", () => {
  const groupId = "test-group"
  const epochId = "epoch-001"
  const epochSequence = 1

  it("builds a kind 446 event with bundles for each recipient", async () => {
    const r1 = "a".repeat(64)
    const r2 = "b".repeat(64)
    setupRecipient(r1)
    setupRecipient(r2)

    const masterKey = randomBytes(32)

    const result = await buildEpochKeyShareEvent({
      groupId,
      epochId,
      epochSequence,
      epochMasterKey: masterKey,
      recipients: [r1, r2],
    })

    expect(result.ok).toBe(true)
    expect(result.template.kind).toBe(GROUP_KINDS.NIP_EE.EPOCH_KEY_SHARE)
    expect(result.sharedTo).toEqual([r1, r2])
    expect(result.missingPqKey).toEqual([])

    const envelope = JSON.parse(result.template.content)
    expect(envelope.v).toBe(1)
    expect(envelope.group_id).toBe(groupId)
    expect(envelope.epoch_id).toBe(epochId)
    expect(envelope.shares).toHaveLength(2)

    // Check tags include "p" tags for each recipient
    expect(result.template.tags).toEqual(
      expect.arrayContaining([
        ["h", groupId],
        ["epoch", epochId],
        ["p", r1],
        ["p", r2],
      ]),
    )
  })

  it("tracks missing PQC keys in missingPqKey", async () => {
    const r1 = "c".repeat(64)
    const r2 = "d".repeat(64) // no key setup for r2
    setupRecipient(r1)
    // r2 intentionally has no key

    const masterKey = randomBytes(32)

    const result = await buildEpochKeyShareEvent({
      groupId,
      epochId,
      epochSequence,
      epochMasterKey: masterKey,
      recipients: [r1, r2],
    })

    expect(result.ok).toBe(true)
    expect(result.sharedTo).toEqual([r1])
    expect(result.missingPqKey).toEqual([r2])

    const envelope = JSON.parse(result.template.content)
    expect(envelope.shares).toHaveLength(1)
    expect(envelope.shares[0].pk_ref).toBe(r1)
  })

  it("full round-trip: build → receive recovers master key", async () => {
    const recipient = "e".repeat(64)
    const kp = setupRecipient(recipient)
    const masterKey = randomBytes(32)

    const buildResult = await buildEpochKeyShareEvent({
      groupId,
      epochId,
      epochSequence,
      epochMasterKey: masterKey,
      recipients: [recipient],
    })

    expect(buildResult.ok).toBe(true)

    const receiveResult = await receiveEpochKeyShare(
      buildResult.template.content,
      recipient,
      kp.secretKey,
    )

    expect(receiveResult.ok).toBe(true)
    if (receiveResult.ok) {
      expect(receiveResult.groupId).toBe(groupId)
      expect(receiveResult.epochId).toBe(epochId)
      expect(receiveResult.epochSequence).toBe(epochSequence)
      expect(new Uint8Array(receiveResult.masterKey)).toEqual(masterKey)
    }
  })

  it("receive fails with wrong secret key", async () => {
    const recipient = "f".repeat(64)
    setupRecipient(recipient)
    const masterKey = randomBytes(32)

    const buildResult = await buildEpochKeyShareEvent({
      groupId,
      epochId,
      epochSequence,
      epochMasterKey: masterKey,
      recipients: [recipient],
    })

    expect(buildResult.ok).toBe(true)

    // Use a different keypair's secret key
    const wrongKp = mlKemKeygen()

    const receiveResult = await receiveEpochKeyShare(
      buildResult.template.content,
      recipient,
      wrongKp.secretKey,
    )

    expect(receiveResult.ok).toBe(false)
    if (!receiveResult.ok) {
      expect(receiveResult.reason).toContain("unwrap failed")
    }
  })

  it("receive fails when recipient not in bundle", async () => {
    const r1 = "1".repeat(64)
    const r2 = "2".repeat(64)
    setupRecipient(r1)
    const r2kp = setupRecipient(r2)
    const masterKey = randomBytes(32)

    // Build for r1 only
    const buildResult = await buildEpochKeyShareEvent({
      groupId,
      epochId,
      epochSequence,
      epochMasterKey: masterKey,
      recipients: [r1],
    })

    expect(buildResult.ok).toBe(true)

    // r2 tries to receive
    const receiveResult = await receiveEpochKeyShare(
      buildResult.template.content,
      r2,
      r2kp.secretKey,
    )

    expect(receiveResult.ok).toBe(false)
    if (!receiveResult.ok) {
      expect(receiveResult.reason).toContain("Not a recipient")
    }
  })

  it("receive fails with invalid JSON", async () => {
    const kp = mlKemKeygen()
    const result = await receiveEpochKeyShare("not-json{", "a".repeat(64), kp.secretKey)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain("Invalid JSON")
    }
  })

  it("receive fails with unsupported version", async () => {
    const kp = mlKemKeygen()
    const result = await receiveEpochKeyShare(JSON.stringify({v: 99}), "a".repeat(64), kp.secretKey)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain("Unsupported")
    }
  })
})
