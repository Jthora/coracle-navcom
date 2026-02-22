import {beforeEach, describe, expect, it} from "vitest"
import {GROUP_KINDS} from "../../../src/domain/group-kinds"
import {encodeSecureGroupEpochContent} from "../../../src/engine/group-epoch-content"
import {
  GROUP_SECURE_SEND_INPUT_REASON,
  buildSecureSubscribeFilters,
  parseSecureGroupSendInput,
  parseSecureGroupSendInputResult,
  parseSecureGroupSubscribeInput,
  reconcileSecureGroupEvents,
} from "../../../src/engine/group-transport-secure-ops"
import {
  getSecureGroupKeyState,
  resetSecureGroupKeyLifecycle,
} from "../../../src/engine/group-key-lifecycle"
import {
  clearSecureGroupEpochState,
  ensureSecureGroupEpochState,
} from "../../../src/engine/group-epoch-state"
import {makeMembership} from "../../../src/domain/group"

describe("engine/group-transport-secure-ops", () => {
  beforeEach(() => {
    resetSecureGroupKeyLifecycle()
    clearSecureGroupEpochState("ops")
  })

  it("parses secure send input deterministically", () => {
    expect(
      parseSecureGroupSendInput({
        groupId: "ops",
        content: "hello",
        recipients: ["a".repeat(64)],
        delay: 3,
        localState: {group: {id: "ops"}},
        missionTier: 2,
        actorRole: "admin",
        requestedMode: "secure-nip-ee",
        resolvedMode: "secure-nip-ee",
        downgradeConfirmed: true,
        allowTier2Override: false,
      }),
    ).toEqual({
      groupId: "ops",
      content: "hello",
      recipients: ["a".repeat(64)],
      delay: 3,
      localState: {group: {id: "ops"}},
      missionTier: 2,
      actorRole: "admin",
      requestedMode: "secure-nip-ee",
      resolvedMode: "secure-nip-ee",
      downgradeConfirmed: true,
      allowTier2Override: false,
    })

    expect(parseSecureGroupSendInput({groupId: "", content: "", recipients: []})).toBeNull()

    const invalidRecipient = parseSecureGroupSendInputResult({
      groupId: "ops",
      content: "hello",
      recipients: ["not-a-pubkey"],
    })

    expect(invalidRecipient).toMatchObject({
      ok: false,
      reason: GROUP_SECURE_SEND_INPUT_REASON.RECIPIENT_PUBKEY_INVALID,
    })
  })

  it("parses subscribe input and builds filters", () => {
    expect(
      parseSecureGroupSubscribeInput({groupId: "ops", cursor: 100, relays: ["wss://r"]}),
    ).toEqual({
      groupId: "ops",
      cursor: 100,
      relays: ["wss://r"],
    })

    expect(buildSecureSubscribeFilters({groupId: "ops", cursor: 100})[0]).toMatchObject({
      "#h": ["ops"],
      since: 100,
    })
  })

  it("reconciles secure events into projection and validates mismatches", async () => {
    const projection = {
      group: {id: "ops"},
      members: {},
      audit: [],
      sourceEvents: [],
    }

    const invalid = await reconcileSecureGroupEvents({
      groupId: "intel",
      remoteEvents: [],
      localState: projection,
    })

    expect(invalid).toMatchObject({
      ok: false,
      code: "GROUP_TRANSPORT_VALIDATION_FAILED",
    })

    const valid = await reconcileSecureGroupEvents({
      groupId: "ops",
      remoteEvents: [],
      localState: projection,
    })

    expect(valid.ok).toBe(true)
    expect(getSecureGroupKeyState("ops")?.useCount).toBe(1)
    expect(getSecureGroupKeyState("ops")?.usageByAction.reconcile).toBe(1)
    expect(ensureSecureGroupEpochState("ops").sequence).toBe(1)
  })

  it("advances secure group epoch when membership removal events are reconciled", async () => {
    const projection = {
      group: {id: "ops"},
      members: {},
      audit: [],
      sourceEvents: [],
    }

    const initial = ensureSecureGroupEpochState("ops")

    const result = await reconcileSecureGroupEvents({
      groupId: "ops",
      localState: projection,
      remoteEvents: [
        {
          id: "remove-1",
          pubkey: "f".repeat(64),
          kind: GROUP_KINDS.NIP29.REMOVE_USER,
          created_at: 1739836800,
          tags: [
            ["h", "ops"],
            ["p", "a".repeat(64)],
          ],
          content: "",
          sig: "s".repeat(128),
        },
      ],
    })

    expect(result.ok).toBe(true)
    expect(ensureSecureGroupEpochState("ops").sequence).toBe(initial.sequence + 1)
  })

  it("rejects reconcile when secure wraps include removed members", async () => {
    const projection = {
      group: {id: "ops"},
      members: {
        ["a".repeat(64)]: makeMembership({
          groupId: "ops",
          pubkey: "a".repeat(64),
          status: "removed",
          updatedAt: 1739836800,
        }),
      },
      audit: [],
      sourceEvents: [],
    }

    const result = await reconcileSecureGroupEvents({
      groupId: "ops",
      localState: projection,
      remoteEvents: [
        {
          id: "bad-wrap-1",
          pubkey: "f".repeat(64),
          kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
          created_at: 1739836801,
          tags: [
            ["h", "ops"],
            ["epoch", ensureSecureGroupEpochState("ops").epochId],
            ["p", "a".repeat(64)],
          ],
          content: "{}",
          sig: "s".repeat(128),
        },
      ],
    })

    expect(result).toMatchObject({
      ok: false,
      code: "GROUP_TRANSPORT_VALIDATION_FAILED",
    })
  })

  it("rejects reconcile when secure group message content envelope is invalid", async () => {
    const projection = {
      group: {id: "ops"},
      members: {},
      audit: [],
      sourceEvents: [],
    }

    const result = await reconcileSecureGroupEvents({
      groupId: "ops",
      localState: projection,
      remoteEvents: [
        {
          id: "bad-content-1",
          pubkey: "f".repeat(64),
          kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
          created_at: 1739836801,
          tags: [
            ["h", "ops"],
            ["epoch", ensureSecureGroupEpochState("ops").epochId],
            ["p", "a".repeat(64)],
          ],
          content: "not-a-secure-envelope",
          sig: "s".repeat(128),
        },
      ],
    })

    expect(result).toMatchObject({
      ok: false,
      code: "GROUP_TRANSPORT_VALIDATION_FAILED",
    })
  })

  it("repairs local epoch state and retries validation when incoming epoch is newer", async () => {
    const projection = {
      group: {id: "ops"},
      members: {},
      audit: [],
      sourceEvents: [],
    }

    const epochOne = ensureSecureGroupEpochState("ops", {at: 1739836800})

    const encoded = encodeSecureGroupEpochContent({
      groupId: "ops",
      epochId: "epoch:ops:2:1739836801",
      plaintext: "hello secure group",
      senderPubkey: "f".repeat(64),
      recipients: ["a".repeat(64)],
      createdAt: 1739836801,
    })

    expect(encoded.ok).toBe(true)

    if (encoded.ok) {
      const result = await reconcileSecureGroupEvents({
        groupId: "ops",
        localState: projection,
        remoteEvents: [
          {
            id: "epoch-forward-1",
            pubkey: "f".repeat(64),
            kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
            created_at: 1739836801,
            tags: [
              ["h", "ops"],
              ["epoch", "epoch:ops:2:1739836801"],
              ["p", "a".repeat(64)],
            ],
            content: encoded.content,
            sig: "s".repeat(128),
          },
        ],
      })

      expect(epochOne.sequence).toBe(1)
      expect(result.ok).toBe(true)
      expect(ensureSecureGroupEpochState("ops").sequence).toBe(2)
    }
  })
})
