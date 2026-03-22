import {describe, expect, it, vi} from "vitest"
import {mlKemKeygen, randomBytes} from "src/engine/pqc/crypto-provider"
import {buildEpochKeyShareEvent, receiveEpochKeyShare} from "src/engine/group-epoch-key-share"
import {buildSecureGroupWelcomeEvent, parseSecureGroupWelcome} from "src/engine/group-epoch-welcome"
import {encodeSecureGroupEpochContent} from "src/engine/group-epoch-content"
import {validateAndDecryptSecureGroupEventContent} from "src/engine/group-epoch-decrypt"
import {deriveEpochContentKey} from "src/engine/pqc/epoch-key-manager"
import {GROUP_KINDS} from "src/domain/group-kinds"
import {
  parseSecureControlRequestResult,
  buildSecureControlTemplate,
} from "src/engine/group-transport-secure-control"

// Mock resolvePeerPqPublicKey to return pre-generated keys
const testKeys = new Map<string, ReturnType<typeof mlKemKeygen>>()

vi.mock("src/engine/pqc/pq-key-lifecycle", () => ({
  resolvePeerPqPublicKey: async (pubkey: string) => {
    const kp = testKeys.get(pubkey)
    return kp?.publicKey ?? null
  },
  ensureOwnPqcKey: async () => ({record: {key_id: "test-key-id"}}),
}))

function setupRecipient(pubkey: string) {
  const kp = mlKemKeygen()
  testKeys.set(pubkey, kp)
  return kp
}

describe("PQC group chat integration", () => {
  const groupId = "secure-ops-1"
  const epochId = "epoch:secure-ops-1:1:1700000000"
  const epochSequence = 1
  const creatorPubkey = "c".repeat(64)
  const memberPubkey = "m".repeat(64)

  // F.1 — Full pipeline: create → key share → encrypt → decrypt
  it("full pipeline: WELCOME → key share → encrypt → decrypt round-trip", async () => {
    const creatorKp = setupRecipient(creatorPubkey)
    const memberKp = setupRecipient(memberPubkey)

    // Step 1: Build WELCOME event
    const welcome = buildSecureGroupWelcomeEvent({
      groupId,
      epochId,
      epochSequence,
      creatorPubkey,
      creatorPqKeyId: "creator-pq-key",
    })

    expect(welcome.kind).toBe(GROUP_KINDS.NIP_EE.WELCOME)

    // Step 2: Parse WELCOME to extract epoch info
    const parsed = parseSecureGroupWelcome({
      kind: welcome.kind,
      content: welcome.content,
      tags: welcome.tags,
    } as any)

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) throw new Error("WELCOME parse failed")
    expect(parsed.payload.epoch_id).toBe(epochId)
    expect(parsed.payload.transport_mode).toBe("secure-nip-ee")

    // Step 3: Generate epoch master key, distribute to both members
    const masterKey = randomBytes(32)

    const keyShareResult = await buildEpochKeyShareEvent({
      groupId,
      epochId,
      epochSequence,
      epochMasterKey: masterKey,
      recipients: [creatorPubkey, memberPubkey],
    })

    expect(keyShareResult.ok).toBe(true)
    expect(keyShareResult.sharedTo).toContain(creatorPubkey)
    expect(keyShareResult.sharedTo).toContain(memberPubkey)

    // Step 4: Member receives key share and unwraps master key
    const received = await receiveEpochKeyShare(
      keyShareResult.template.content,
      memberPubkey,
      memberKp.secretKey,
    )

    expect(received.ok).toBe(true)
    if (!received.ok) throw new Error("Key share receive failed")
    expect(received.groupId).toBe(groupId)
    expect(received.epochId).toBe(epochId)

    // Step 5: Derive epoch content key from recovered master key
    const contentKey = await deriveEpochContentKey(received.masterKey, groupId, epochId)
    expect(contentKey).toBeInstanceOf(Uint8Array)
    expect(contentKey.length).toBe(32)

    // Step 6: Encrypt a message using the content key
    const plaintext = "Secure field report: all clear at CP Alpha"
    const encoded = await encodeSecureGroupEpochContent({
      groupId,
      epochId,
      plaintext,
      senderPubkey: creatorPubkey,
      recipients: [creatorPubkey, memberPubkey],
      epochKeyBytes: contentKey,
    })

    expect(encoded.ok).toBe(true)
    if (!encoded.ok) throw new Error("Encode failed")

    // Step 7: Decrypt using the same content key derived from local master key
    const memberContentKey = await deriveEpochContentKey(received.masterKey, groupId, epochId)
    const decrypted = await validateAndDecryptSecureGroupEventContent({
      event: {
        id: "event-001",
        kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
        content: encoded.content,
      },
      expectedEpochId: epochId,
      epochKeyBytes: memberContentKey,
    })

    expect(decrypted.ok).toBe(true)
    if (!decrypted.ok) throw new Error("Decrypt failed")
    expect(decrypted.plaintext).toBe(plaintext)
  })

  // F.2 — Member removal: old member's key cannot decrypt post-rotation messages
  it("member removal: old epoch key cannot decrypt new epoch messages", async () => {
    const oldMemberKp = setupRecipient("d".repeat(64))
    const remainingKp = setupRecipient("e".repeat(64))

    // Epoch 1: key share to both
    const epoch1MasterKey = randomBytes(32)
    const epoch1Id = "epoch:grp:1:1700000001"

    const ks1 = await buildEpochKeyShareEvent({
      groupId: "grp",
      epochId: epoch1Id,
      epochSequence: 1,
      epochMasterKey: epoch1MasterKey,
      recipients: ["d".repeat(64), "e".repeat(64)],
    })

    // Old member recovers epoch 1 key
    const oldReceived = await receiveEpochKeyShare(
      ks1.template.content,
      "d".repeat(64),
      oldMemberKp.secretKey,
    )
    expect(oldReceived.ok).toBe(true)

    // Epoch 2: rotate after removal, only share with remaining member
    const epoch2MasterKey = randomBytes(32)
    const epoch2Id = "epoch:grp:2:1700000002"

    const ks2 = await buildEpochKeyShareEvent({
      groupId: "grp",
      epochId: epoch2Id,
      epochSequence: 2,
      epochMasterKey: epoch2MasterKey,
      recipients: ["e".repeat(64)], // Old member excluded
    })

    expect(ks2.sharedTo).not.toContain("d".repeat(64))

    // Old member tries to receive epoch 2 key share — should fail
    const oldReceived2 = await receiveEpochKeyShare(
      ks2.template.content,
      "d".repeat(64),
      oldMemberKp.secretKey,
    )

    expect(oldReceived2.ok).toBe(false)
    if (!oldReceived2.ok) {
      expect(oldReceived2.reason).toContain("Not a recipient")
    }

    // Encrypt a message with epoch 2 key
    const epoch2ContentKey = await deriveEpochContentKey(epoch2MasterKey, "grp", epoch2Id)
    const encoded = await encodeSecureGroupEpochContent({
      groupId: "grp",
      epochId: epoch2Id,
      plaintext: "Post-rotation secret",
      senderPubkey: "e".repeat(64),
      recipients: ["e".repeat(64)],
      epochKeyBytes: epoch2ContentKey,
    })

    expect(encoded.ok).toBe(true)
    if (!encoded.ok) throw new Error("Encode failed")

    // Old member tries to decrypt with epoch 1 key — should fail
    if (oldReceived.ok) {
      const oldContentKey = await deriveEpochContentKey(oldReceived.masterKey, "grp", epoch2Id)
      const decrypted = await validateAndDecryptSecureGroupEventContent({
        event: {
          id: "event-post-rotation",
          kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
          content: encoded.content,
        },
        expectedEpochId: epoch2Id,
        epochKeyBytes: oldContentKey,
      })

      // The wrong key should cause decryption failure
      expect(decrypted.ok).toBe(false)
    }
  })

  // F.3 — New member joins, receives key share, can decrypt
  it("new member joins and receives key share → can decrypt", async () => {
    const newMemberKp = setupRecipient("n".repeat(64))
    const newMemberPub = "n".repeat(64)

    const masterKey = randomBytes(32)
    const eid = "epoch:join-test:1:170000"

    const keyShare = await buildEpochKeyShareEvent({
      groupId: "join-test",
      epochId: eid,
      epochSequence: 1,
      epochMasterKey: masterKey,
      recipients: [newMemberPub],
    })

    const received = await receiveEpochKeyShare(
      keyShare.template.content,
      newMemberPub,
      newMemberKp.secretKey,
    )

    expect(received.ok).toBe(true)
    if (!received.ok) throw new Error("Key share receive failed")

    const contentKey = await deriveEpochContentKey(received.masterKey, "join-test", eid)
    const encoded = await encodeSecureGroupEpochContent({
      groupId: "join-test",
      epochId: eid,
      plaintext: "Welcome to the group!",
      senderPubkey: creatorPubkey,
      recipients: [creatorPubkey, newMemberPub],
      epochKeyBytes: contentKey,
    })

    expect(encoded.ok).toBe(true)
    if (!encoded.ok) throw new Error("Encode failed")

    const decrypted = await validateAndDecryptSecureGroupEventContent({
      event: {
        id: "event-join-test",
        kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
        content: encoded.content,
      },
      expectedEpochId: eid,
      epochKeyBytes: contentKey,
    })

    expect(decrypted.ok).toBe(true)
    if (!decrypted.ok) throw new Error("Decrypt failed")
    expect(decrypted.plaintext).toBe("Welcome to the group!")
  })

  // F.4 — Event ordering: kind 446 arrives before kind 444 → system converges
  it("key share (446) arriving before WELCOME (444) still has parseable data", async () => {
    const recipientKp = setupRecipient("f".repeat(64))
    const masterKey = randomBytes(32)
    const eid = "epoch:order-test:1:170000"

    // Key share arrives first — can still be parsed
    const keyShare = await buildEpochKeyShareEvent({
      groupId: "order-test",
      epochId: eid,
      epochSequence: 1,
      epochMasterKey: masterKey,
      recipients: ["f".repeat(64)],
    })

    const received = await receiveEpochKeyShare(
      keyShare.template.content,
      "f".repeat(64),
      recipientKp.secretKey,
    )

    // Key share is valid and processable even without WELCOME
    expect(received.ok).toBe(true)
    if (!received.ok) throw new Error("Key share should be processable without WELCOME")
    expect(received.epochId).toBe(eid)

    // WELCOME arrives later — also parseable
    const welcome = buildSecureGroupWelcomeEvent({
      groupId: "order-test",
      epochId: eid,
      epochSequence: 1,
      creatorPubkey: creatorPubkey,
      creatorPqKeyId: "key-1",
    })

    const parsedWelcome = parseSecureGroupWelcome({
      kind: welcome.kind,
      content: welcome.content,
      tags: welcome.tags,
    } as any)

    expect(parsedWelcome.ok).toBe(true)
  })

  // F.5 — WELCOME arrives before key share → system converges
  it("WELCOME (444) arriving before key share (446) provides epoch context", () => {
    const welcome = buildSecureGroupWelcomeEvent({
      groupId: "order-test-2",
      epochId: "epoch:order-2:1:170000",
      epochSequence: 1,
      creatorPubkey: creatorPubkey,
      creatorPqKeyId: "key-2",
    })

    const parsed = parseSecureGroupWelcome({
      kind: welcome.kind,
      content: welcome.content,
      tags: welcome.tags,
    } as any)

    // WELCOME provides epoch context; decryption will wait for key share
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) throw new Error("WELCOME parse failed")
    expect(parsed.payload.epoch_id).toBe("epoch:order-2:1:170000")
    expect(parsed.payload.transport_mode).toBe("secure-nip-ee")
  })
})
