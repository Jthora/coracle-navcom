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

  it("persists rotation jobs and restores idempotency keys across bootstrap", () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) || null,
      setItem: (key: string, value: string) => {
        data.set(key, value)
      },
      removeItem: (key: string) => {
        data.delete(key)
      },
    }

    const first = createGroupKeyRotationService({}, () => 100, {storage})
    const created = first.scheduleRotation({
      groupId: "ops",
      keyId: "secure-session:ops",
      trigger: "membership-change",
      at: 100,
    })

    expect(created.idempotencyKey).toBe("group-rotation:ops:secure-session:ops:membership-change")

    const second = createGroupKeyRotationService({}, () => 200, {storage})
    const restored = second.getJob("ops")

    expect(restored?.idempotencyKey).toBe(created.idempotencyKey)
    expect(restored?.status).toBe("pending")
  })

  it("replays failed jobs whose retry window has elapsed and reports summary", () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) || null,
      setItem: (key: string, value: string) => {
        data.set(key, value)
      },
      removeItem: (key: string) => {
        data.delete(key)
      },
    }

    const service = createGroupKeyRotationService({maxRetries: 4}, () => 100, {storage})

    service.scheduleRotation({
      groupId: "ops",
      keyId: "secure-session:ops",
      trigger: "manual",
      at: 100,
    })
    service.recordFailure("ops", "network down", 101)

    const rehydrated = createGroupKeyRotationService({maxRetries: 4}, () => 200, {storage})
    const summary = rehydrated.replayPendingJobs(200)

    expect(summary.loadedJobs).toBe(1)
    expect(summary.resumedFromFailed).toBe(1)
    expect(rehydrated.getJob("ops")?.status).toBe("pending")
    expect(rehydrated.getJob("ops")?.nextRetryAt).toBeUndefined()
  })
})
