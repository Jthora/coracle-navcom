import {describe, expect, it} from "vitest"
import {GROUP_KINDS} from "../../../../src/domain/group-kinds"
import {makeGroup, makeMembership, makeProjection} from "../../../../src/domain/group"
import {buildDmPqcEnvelope} from "../../../../src/engine/pqc/dm-envelope"
import {resolveDmReceiveContent} from "../../../../src/engine/pqc/dm-receive-envelope"
import {runDmPqcSendPreflight} from "../../../../src/engine/pqc/dm-send-preflight"
import {
  PQC_KEY_SCHEMA_VERSION,
  type PqcKeyPublicationRecord,
} from "../../../../src/engine/pqc/key-publication"
import {createGroupKeyRotationService} from "../../../../src/engine/group-key-rotation-service"
import {
  advanceSecureGroupEpochState,
  ensureSecureGroupEpochState,
} from "../../../../src/engine/group-epoch-state"
import {validateRemovedMemberWrapExclusion} from "../../../../src/engine/group-wrap-exclusion"
import type {GroupKeyLifecycleState} from "../../../../src/engine/group-key-lifecycle"
import {mlKemKeygen} from "../../../../src/engine/pqc/crypto-provider"

const now = 1739836800

const createMemoryStorage = () => {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}

const makePeerKey = (
  overrides: Partial<PqcKeyPublicationRecord> = {},
): PqcKeyPublicationRecord => ({
  schema: PQC_KEY_SCHEMA_VERSION,
  user_pubkey: "f".repeat(64),
  pq_alg: "mlkem768",
  pq_pub: "base64:peer-key",
  key_id: "k-001",
  created_at: now - 120,
  expires_at: now + 3600,
  status: "active",
  ...overrides,
})

const makeActiveKeyState = (groupId: string): GroupKeyLifecycleState => ({
  keyId: `secure-session:${groupId}`,
  groupId,
  secretClass: "S3",
  status: "active",
  createdAt: now,
  updatedAt: now,
  useCount: 0,
  usageByAction: {
    send: 0,
    subscribe: 0,
    reconcile: 0,
    control: 0,
  },
})

describe("engine/pqc/secure-path-integration", () => {
  it("runs strict DM preflight and envelope roundtrip in hybrid mode", async () => {
    const peerKemKeys = mlKemKeygen()

    const preflight = runDmPqcSendPreflight({
      policyMode: "strict",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      peerCapabilities: {
        modes: ["hybrid", "classical"],
        algs: ["hybrid-mlkem768+x25519-aead-v1"],
      },
      peerKeyRecord: makePeerKey(),
      now,
      lastValidatedAt: now - 30,
    })

    expect(preflight.blocked).toBe(false)
    expect(preflight.negotiation.mode).toBe("hybrid")
    expect(preflight.telemetryReason).toBe("DM_PREFLIGHT_OK")

    const recipientPqPublicKeys = new Map<string, Uint8Array>([["peer", peerKemKeys.publicKey]])

    const built = await buildDmPqcEnvelope({
      plaintext: "pqc strict path",
      senderPubkey: "sender",
      recipients: ["peer"],
      mode: "hybrid",
      algorithm: preflight.negotiation.alg || "hybrid-mlkem768+x25519-aead-v1",
      recipientPqPublicKeys,
      createdAt: now,
      messageId: "msg-strict-1",
    })

    expect(built.ok).toBe(true)

    if (built.ok) {
      const resolved = await resolveDmReceiveContent({
        tags: [["pqc", "hybrid"]],
        decryptedContent: built.content,
        policyMode: "strict",
        recipientSecretKey: peerKemKeys.secretKey,
        recipientPubkey: "peer",
        senderPubkey: "sender",
        expectedSenderPubkey: "sender",
        expectedRecipientPubkey: "peer",
      })

      expect(resolved.usedLegacyFallback).toBe(false)
      expect(resolved.reason).toBe("DM_ENVELOPE_PARSE_OK")
      expect(resolved.content).toBe("pqc strict path")
    }
  })

  it("differentiates strict block vs compatibility fallback for missing capabilities", () => {
    const strict = runDmPqcSendPreflight({
      policyMode: "strict",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      peerCapabilities: null,
      peerKeyRecord: makePeerKey(),
      now,
      lastValidatedAt: now - 10,
    })

    expect(strict.blocked).toBe(true)
    expect(strict.negotiation.reason).toBe("NEGOTIATION_NO_CAPS")
    expect(strict.telemetryReason).toBe("DM_NEGOTIATION_FAILED")

    const compatibility = runDmPqcSendPreflight({
      policyMode: "compatibility",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      peerCapabilities: null,
      peerKeyRecord: makePeerKey(),
      now,
      lastValidatedAt: now - 10,
    })

    expect(compatibility.blocked).toBe(false)
    expect(compatibility.negotiation.mode).toBe("classical")
    expect(compatibility.negotiation.reason).toBe("NEGOTIATION_FALLBACK_CLASSICAL")
  })

  it("covers group membership-triggered rekey and removed-member wrap exclusion", () => {
    const groupId = "ops"
    const removed = "a".repeat(64)
    const active = "b".repeat(64)
    const storage = createMemoryStorage()
    const rotation = createGroupKeyRotationService()

    const initialEpoch = ensureSecureGroupEpochState(groupId, {at: now, storage})
    const scheduled = rotation.scheduleMembershipTriggeredRotation({
      groupId,
      keyState: makeActiveKeyState(groupId),
      remoteEvents: [{kind: GROUP_KINDS.NIP29.REMOVE_USER}],
      at: now + 1,
    })

    expect(scheduled?.trigger).toBe("membership-change")
    expect(scheduled?.status).toBe("pending")

    const nextEpoch = advanceSecureGroupEpochState(groupId, {at: now + 2, storage})
    expect(nextEpoch.sequence).toBe(initialEpoch.sequence + 1)

    const projection = makeProjection(
      makeGroup({
        id: groupId,
        protocol: "nip-ee",
        transportMode: "secure-nip-ee",
        createdAt: now,
        updatedAt: now,
      }),
    )

    projection.members[removed] = makeMembership({
      groupId,
      pubkey: removed,
      status: "removed",
      updatedAt: now,
    })

    const violation = validateRemovedMemberWrapExclusion({
      groupId,
      projection,
      events: [
        {
          id: "secure-bad-1",
          kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
          created_at: now + 3,
          tags: [
            ["h", groupId],
            ["p", removed],
          ],
        },
      ],
    })

    expect(violation).toEqual({
      ok: false,
      reason: "REMOVED_MEMBER_INCLUDED",
      eventId: "secure-bad-1",
      removedPubkey: removed,
    })

    const pass = validateRemovedMemberWrapExclusion({
      groupId,
      projection,
      events: [
        {
          id: "secure-ok-1",
          kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
          created_at: now + 4,
          tags: [
            ["h", groupId],
            ["p", active],
          ],
        },
      ],
    })

    expect(pass).toEqual({ok: true})
  })
})
