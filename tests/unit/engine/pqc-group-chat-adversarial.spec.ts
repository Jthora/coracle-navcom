import {describe, expect, it, vi} from "vitest"
import {mlKemKeygen, randomBytes} from "src/engine/pqc/crypto-provider"
import {buildEpochKeyShareEvent, receiveEpochKeyShare} from "src/engine/group-epoch-key-share"
import {parseSecureGroupWelcome} from "src/engine/group-epoch-welcome"
import {GROUP_KINDS} from "src/domain/group-kinds"
import {baselineGroupTransport} from "src/engine/group-transport-baseline"

// Mock resolvePeerPqPublicKey
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

describe("PQC group chat adversarial tests", () => {
  const groupId = "adversarial-group"
  const epochId = "epoch:adversarial:1:170000"

  // F.6 — Wrong recipient private key → decapsulation fails
  it("wrong recipient private key → decapsulation fails, no silent fallback", async () => {
    const legitimateKp = setupRecipient("a".repeat(64))
    const attackerKp = mlKemKeygen() // Different key, not registered

    const masterKey = randomBytes(32)
    const keyShare = await buildEpochKeyShareEvent({
      groupId,
      epochId,
      epochSequence: 1,
      epochMasterKey: masterKey,
      recipients: ["a".repeat(64)],
    })

    // Attacker tries to use their own secret key to decrypt legitimate bundle
    const result = await receiveEpochKeyShare(
      keyShare.template.content,
      "a".repeat(64),
      attackerKp.secretKey,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain("unwrap failed")
    }
  })

  // F.7 — Tampered key share ciphertext → AES-GCM authentication fails
  it("tampered key share ciphertext → unwrap fails", async () => {
    const recipientKp = setupRecipient("b".repeat(64))
    const masterKey = randomBytes(32)

    const keyShare = await buildEpochKeyShareEvent({
      groupId,
      epochId,
      epochSequence: 1,
      epochMasterKey: masterKey,
      recipients: ["b".repeat(64)],
    })

    // Tamper with the wrapped_key in the envelope
    const envelope = JSON.parse(keyShare.template.content)
    const originalWrapped = envelope.shares[0].wrapped_key
    // Flip some bytes in the base64 string
    envelope.shares[0].wrapped_key = originalWrapped.slice(0, -4) + "XXXX"
    const tamperedContent = JSON.stringify(envelope)

    const result = await receiveEpochKeyShare(
      tamperedContent,
      "b".repeat(64),
      recipientKp.secretKey,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain("unwrap failed")
    }
  })

  // F.8 — Replayed old key share event → epoch sequence mismatch detectable
  it("replayed key share from different epoch is detectable by epoch metadata", async () => {
    const recipientKp = setupRecipient("r".repeat(64))
    const oldMasterKey = randomBytes(32)
    const newMasterKey = randomBytes(32)

    // Old epoch key share
    const oldKeyShare = await buildEpochKeyShareEvent({
      groupId,
      epochId: "epoch:adversarial:1:170000",
      epochSequence: 1,
      epochMasterKey: oldMasterKey,
      recipients: ["r".repeat(64)],
    })

    // New epoch key share
    const newKeyShare = await buildEpochKeyShareEvent({
      groupId,
      epochId: "epoch:adversarial:2:170001",
      epochSequence: 2,
      epochMasterKey: newMasterKey,
      recipients: ["r".repeat(64)],
    })

    // Both parse successfully — but metadata reveals epoch mismatch
    const oldReceived = await receiveEpochKeyShare(
      oldKeyShare.template.content,
      "r".repeat(64),
      recipientKp.secretKey,
    )

    const newReceived = await receiveEpochKeyShare(
      newKeyShare.template.content,
      "r".repeat(64),
      recipientKp.secretKey,
    )

    expect(oldReceived.ok).toBe(true)
    expect(newReceived.ok).toBe(true)
    if (oldReceived.ok && newReceived.ok) {
      // Callers can detect replay by comparing epoch sequence
      expect(oldReceived.epochSequence).toBe(1)
      expect(newReceived.epochSequence).toBe(2)
      expect(oldReceived.epochId).not.toBe(newReceived.epochId)
    }
  })

  // F.9 — Malformed kind 444/446 JSON → parse returns error, no crash
  it("malformed kind 444 JSON → parseSecureGroupWelcome returns error", () => {
    const result = parseSecureGroupWelcome({
      kind: GROUP_KINDS.NIP_EE.WELCOME,
      content: "not valid json {{{",
      tags: [["h", "test"]],
    } as any)

    expect(result.ok).toBe(false)
  })

  it("malformed kind 446 JSON → receiveEpochKeyShare returns error", async () => {
    const kp = mlKemKeygen()
    const result = await receiveEpochKeyShare("not valid json {{{", "z".repeat(64), kp.secretKey)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain("Invalid JSON")
    }
  })

  it("non-object kind 444 content → parseSecureGroupWelcome returns error", () => {
    const result = parseSecureGroupWelcome({
      kind: GROUP_KINDS.NIP_EE.WELCOME,
      content: JSON.stringify("just a string"),
      tags: [["h", "test"]],
    } as any)

    expect(result.ok).toBe(false)
  })

  it("kind 446 with unsupported version → receiveEpochKeyShare returns error", async () => {
    const kp = mlKemKeygen()
    const result = await receiveEpochKeyShare(
      JSON.stringify({v: 999, shares: []}),
      "z".repeat(64),
      kp.secretKey,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain("Unsupported")
    }
  })

  // F.10 — Baseline adapter rejects "secure-nip-ee" request
  it("baseline adapter rejects secure-nip-ee mode", () => {
    const result = baselineGroupTransport.canOperate({requestedMode: "secure-nip-ee"})
    expect(result.ok).toBe(false)
  })

  it("baseline adapter accepts baseline-nip29 mode", () => {
    const result = baselineGroupTransport.canOperate({requestedMode: "baseline-nip29"})
    expect(result.ok).toBe(true)
  })
})
