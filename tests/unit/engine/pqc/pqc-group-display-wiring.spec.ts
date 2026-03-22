/**
 * PQC Group Display Wiring Integration Test
 *
 * Verifies the FULL pipeline that was previously a dead-code gap:
 * encrypt message → store as event → decrypt for display
 *
 * This specifically tests that encodeSecureGroupEpochContent produces
 * ciphertext that validateAndDecryptSecureGroupEventContent can decrypt,
 * matching the actual display path in GroupConversation.svelte.
 */

import {describe, it, expect} from "vitest"
import {
  encodeSecureGroupEpochContent,
  decodeSecureGroupEpochContent,
} from "src/engine/group-epoch-content"
import {validateAndDecryptSecureGroupEventContent} from "src/engine/group-epoch-decrypt"
import {generateEpochKey, deriveEpochContentKey} from "src/engine/pqc/epoch-key-manager"
import {GROUP_KINDS} from "src/domain/group-kinds"
import {classifyGroupEventKind} from "src/domain/group-kinds"

const GROUP_ID = "test-group-wiring"
const EPOCH_ID = "epoch-display-test-1"
const SENDER = "sender-pubkey-abc123"
const RECIPIENTS = ["sender-pubkey-abc123", "recipient-1", "recipient-2"]

describe("PQC Group Display Wiring — encrypt→event→decrypt pipeline", () => {
  it("encrypts a message and decrypts it using the display-path function", async () => {
    const masterKey = generateEpochKey()
    const epochKey = await deriveEpochContentKey(masterKey, GROUP_ID, EPOCH_ID)

    const plaintext = "Grid ref 51.5074,-0.1278 — rally point alpha"

    // SEND PATH: encrypt content
    const encoded = await encodeSecureGroupEpochContent({
      groupId: GROUP_ID,
      epochId: EPOCH_ID,
      plaintext,
      senderPubkey: SENDER,
      recipients: RECIPIENTS,
      epochKeyBytes: epochKey,
    })

    expect(encoded.ok).toBe(true)
    if (!encoded.ok) throw new Error("encode failed")

    // RELAY: event arrives with encrypted content and NIP-EE kind
    const event = {
      id: "event-display-wiring-001",
      kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
      content: encoded.content,
    }

    // classifyGroupEventKind returns "message" — same filter as GroupConversation.svelte
    expect(classifyGroupEventKind(event.kind)).toBe("message")

    // DISPLAY PATH: decrypt using validateAndDecryptSecureGroupEventContent
    // This is the exact function called by GroupConversation.svelte's decryptSecureMessages
    const decrypted = await validateAndDecryptSecureGroupEventContent({
      event,
      expectedEpochId: EPOCH_ID,
      epochKeyBytes: epochKey,
    })

    expect(decrypted.ok).toBe(true)
    if (!decrypted.ok) throw new Error("decrypt failed")
    expect(decrypted.plaintext).toBe(plaintext)
  })

  it("returns raw content for non-NIP-EE events (baseline-nip29 messages pass through)", async () => {
    const event = {
      id: "event-baseline-001",
      kind: 9, // NIP-29 chat kind, NOT NIP_EE.GROUP_EVENT
      content: "Hello from a plain NIP-29 group",
    }

    const masterKey = generateEpochKey()
    const epochKey = await deriveEpochContentKey(masterKey, GROUP_ID, EPOCH_ID)

    const result = await validateAndDecryptSecureGroupEventContent({
      event,
      expectedEpochId: EPOCH_ID,
      epochKeyBytes: epochKey,
    })

    // Non-NIP-EE events should pass through without attempting decryption
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("unexpected failure")
    expect(result.plaintext).toBeUndefined()
  })

  it("fails decryption with wrong epoch key (cross-epoch isolation)", async () => {
    const masterKey = generateEpochKey()
    const correctKey = await deriveEpochContentKey(masterKey, GROUP_ID, EPOCH_ID)
    const wrongKey = await deriveEpochContentKey(masterKey, GROUP_ID, "epoch-wrong-999")

    const encoded = await encodeSecureGroupEpochContent({
      groupId: GROUP_ID,
      epochId: EPOCH_ID,
      plaintext: "Sensitive intel",
      senderPubkey: SENDER,
      recipients: RECIPIENTS,
      epochKeyBytes: correctKey,
    })

    expect(encoded.ok).toBe(true)
    if (!encoded.ok) throw new Error("encode failed")

    const event = {
      id: "event-wrong-key-001",
      kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
      content: encoded.content,
    }

    // Attempt to decrypt with wrong epoch key — must fail
    const result = await validateAndDecryptSecureGroupEventContent({
      event,
      expectedEpochId: EPOCH_ID,
      epochKeyBytes: wrongKey,
    })

    expect(result.ok).toBe(false)
  })

  it("fails decryption with mismatched epoch ID", async () => {
    const masterKey = generateEpochKey()
    const epochKey = await deriveEpochContentKey(masterKey, GROUP_ID, EPOCH_ID)

    const encoded = await encodeSecureGroupEpochContent({
      groupId: GROUP_ID,
      epochId: EPOCH_ID,
      plaintext: "Classified briefing",
      senderPubkey: SENDER,
      recipients: RECIPIENTS,
      epochKeyBytes: epochKey,
    })

    expect(encoded.ok).toBe(true)
    if (!encoded.ok) throw new Error("encode failed")

    const event = {
      id: "event-epoch-mismatch-001",
      kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
      content: encoded.content,
    }

    // Decrypt with correct key but different expected epoch ID
    const result = await validateAndDecryptSecureGroupEventContent({
      event,
      expectedEpochId: "epoch-different-999",
      epochKeyBytes: epochKey,
    })

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error("should have failed")
    expect(result.reason).toBe("GROUP_EPOCH_CONTENT_EPOCH_MISMATCH")
  })

  it("round-trips multiple messages with same epoch key", async () => {
    const masterKey = generateEpochKey()
    const epochKey = await deriveEpochContentKey(masterKey, GROUP_ID, EPOCH_ID)

    const messages = [
      "Message 1: Establishing comms",
      "Message 2: Rally at waypoint bravo",
      "Message 3: All clear, proceed",
    ]

    for (let i = 0; i < messages.length; i++) {
      const encoded = await encodeSecureGroupEpochContent({
        groupId: GROUP_ID,
        epochId: EPOCH_ID,
        plaintext: messages[i],
        senderPubkey: SENDER,
        recipients: RECIPIENTS,
        epochKeyBytes: epochKey,
      })

      expect(encoded.ok).toBe(true)
      if (!encoded.ok) throw new Error(`encode failed for message ${i}`)

      const event = {
        id: `event-batch-${i}`,
        kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
        content: encoded.content,
      }

      const decrypted = await validateAndDecryptSecureGroupEventContent({
        event,
        expectedEpochId: EPOCH_ID,
        epochKeyBytes: epochKey,
      })

      expect(decrypted.ok).toBe(true)
      if (!decrypted.ok) throw new Error(`decrypt failed for message ${i}`)
      expect(decrypted.plaintext).toBe(messages[i])
    }
  })

  it("PQ-derived (v2) envelope also round-trips through display decrypt", async () => {
    const masterKey = generateEpochKey()
    const epochKey = await deriveEpochContentKey(masterKey, GROUP_ID, EPOCH_ID)

    const plaintext = "PQ-derived secure message"

    const encoded = await encodeSecureGroupEpochContent({
      groupId: GROUP_ID,
      epochId: EPOCH_ID,
      plaintext,
      senderPubkey: SENDER,
      recipients: RECIPIENTS,
      epochKeyBytes: epochKey,
      pqDerived: true,
    })

    expect(encoded.ok).toBe(true)
    if (!encoded.ok) throw new Error("encode failed")

    const event = {
      id: "event-pq-v2-001",
      kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
      content: encoded.content,
    }

    const decrypted = await validateAndDecryptSecureGroupEventContent({
      event,
      expectedEpochId: EPOCH_ID,
      epochKeyBytes: epochKey,
    })

    expect(decrypted.ok).toBe(true)
    if (!decrypted.ok) throw new Error("decrypt failed")
    expect(decrypted.plaintext).toBe(plaintext)
  })
})
