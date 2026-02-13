import {beforeEach, describe, expect, it} from "vitest"
import {GROUP_KINDS} from "../../../src/domain/group-kinds"
import {
  DEFAULT_GROUP_KEY_ROTATION_POLICY,
  getGroupKeyRotationRetryDelaySeconds,
  shouldRotateGroupKey,
} from "../../../src/engine/group-key-rotation-policy"
import {
  createGroupKeyRotationService,
  getSecureGroupKeyRotationJob,
  resetSecureGroupKeyRotationService,
  scheduleSecureGroupMembershipTriggeredRotation,
} from "../../../src/engine/group-key-rotation-service"

describe("engine/group-key-rotation", () => {
  beforeEach(() => {
    resetSecureGroupKeyRotationService()
  })

  it("defines schedule policy and rotates when key age exceeds threshold", () => {
    expect(DEFAULT_GROUP_KEY_ROTATION_POLICY.maxKeyAgeSeconds).toBeGreaterThan(0)

    const due = shouldRotateGroupKey({
      keyState: {
        keyId: "secure-session:ops",
        groupId: "ops",
        secretClass: "S2",
        status: "active",
        createdAt: 100,
        updatedAt: 100,
        useCount: 0,
        usageByAction: {send: 0, subscribe: 0, reconcile: 0, control: 0},
      },
      trigger: "schedule",
      now: 100 + DEFAULT_GROUP_KEY_ROTATION_POLICY.maxKeyAgeSeconds + 1,
    })

    expect(due).toBe(true)
  })

  it("schedules event-triggered rotation on membership-related secure events", () => {
    const scheduled = scheduleSecureGroupMembershipTriggeredRotation({
      groupId: "ops",
      keyState: {
        keyId: "secure-session:ops",
        groupId: "ops",
        secretClass: "S2",
        status: "active",
        createdAt: 100,
        updatedAt: 100,
        useCount: 3,
        usageByAction: {send: 2, subscribe: 0, reconcile: 1, control: 0},
      },
      remoteEvents: [{kind: GROUP_KINDS.NIP_EE.WELCOME}],
      at: 200,
    })

    expect(scheduled?.trigger).toBe("membership-change")
    expect(getSecureGroupKeyRotationJob("ops")?.status).toBe("pending")
  })

  it("applies exponential retry backoff and max-retry cap", () => {
    const service = createGroupKeyRotationService({maxRetries: 3}, () => 100)

    service.scheduleRotation({
      groupId: "ops",
      keyId: "secure-session:ops",
      trigger: "manual",
      at: 100,
    })

    const firstFailure = service.recordFailure("ops", new Error("failed once"), 110)

    expect(firstFailure?.status).toBe("failed")
    expect(firstFailure?.nextRetryAt).toBe(110 + getGroupKeyRotationRetryDelaySeconds(1))
    expect(service.canRetry("ops", (firstFailure?.nextRetryAt || 0) - 1)).toBe(false)
    expect(service.canRetry("ops", firstFailure?.nextRetryAt)).toBe(true)

    const secondFailure = service.recordFailure("ops", new Error("failed twice"), 140)
    const thirdFailure = service.recordFailure("ops", new Error("failed thrice"), 170)

    expect(secondFailure?.attempts).toBe(2)
    expect(thirdFailure?.attempts).toBe(3)
    expect(thirdFailure?.nextRetryAt).toBeUndefined()
    expect(service.canRetry("ops", 999)).toBe(false)
  })
})
