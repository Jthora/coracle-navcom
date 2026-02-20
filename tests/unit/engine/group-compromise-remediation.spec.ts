import {describe, expect, it} from "vitest"
import {
  prepareSecureGroupKeyUse,
  resetSecureGroupKeyLifecycle,
} from "../../../src/engine/group-key-lifecycle"
import {remediateCompromisedDevice} from "../../../src/engine/group-compromise-remediation"
import {revokeCompromisedDeviceForGroup} from "../../../src/engine/group-key-revocation"
import {
  getSecureGroupKeyRotationJob,
  resetSecureGroupKeyRotationService,
} from "../../../src/engine/group-key-rotation-service"
import {clearSecureGroupEpochState} from "../../../src/engine/group-epoch-state"

describe("engine/group-compromise-remediation", () => {
  it("revokes secure group keys and emits revocation audit event", () => {
    resetSecureGroupKeyLifecycle()

    prepareSecureGroupKeyUse({groupId: "ops", action: "send", now: 100, ttlSeconds: 60})

    const result = revokeCompromisedDeviceForGroup({
      groupId: "ops",
      compromisedPubkey: "a".repeat(64),
      actorRole: "admin",
      reason: "device-compromised",
      now: 110,
    })

    expect(result.ok).toBe(true)
    expect(result.revokedKeyCount).toBe(1)
    expect(result.auditEvent.action).toBe("key-revocation")
    expect(result.auditEvent.reason).toBe("device-compromised")
  })

  it("runs compromised-device remediation with membership path and schedules rotation", async () => {
    resetSecureGroupKeyLifecycle()
    resetSecureGroupKeyRotationService()
    clearSecureGroupEpochState("ops")

    prepareSecureGroupKeyUse({groupId: "ops", action: "send", now: 200, ttlSeconds: 60})

    let membershipCalls = 0

    const result = await remediateCompromisedDevice({
      groupId: "ops",
      compromisedPubkey: "b".repeat(64),
      actorRole: "admin",
      reason: "incident-123",
      now: 210,
      enforceMembershipRemediation: async () => {
        membershipCalls += 1
      },
    })

    expect(result.ok).toBe(true)
    expect(result.membershipRemediated).toBe(true)
    expect(result.revocation.revokedKeyCount).toBe(1)
    expect(result.rotationScheduled).toBe(true)
    expect(membershipCalls).toBe(1)
    expect(getSecureGroupKeyRotationJob("ops")?.trigger).toBe("compromise-suspected")
    expect(result.epochTransition.supersededEpoch.sequence).toBe(1)
    expect(result.epochTransition.activeEpoch.sequence).toBe(2)
    expect(result.epochTransition.activeEpoch.epochId).not.toBe(
      result.epochTransition.supersededEpoch.epochId,
    )
  })
})
