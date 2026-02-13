import {beforeEach, describe, expect, it} from "vitest"
import {
  createGroupKeyLifecycleRegistry,
  prepareSecureGroupKeyUse,
  resetSecureGroupKeyLifecycle,
  getSecureGroupKeyState,
  revokeSecureGroupKeys,
} from "../../../src/engine/group-key-lifecycle"

describe("engine/group-key-lifecycle", () => {
  beforeEach(() => {
    resetSecureGroupKeyLifecycle()
  })

  it("registers key state and tracks per-action usage", () => {
    const registry = createGroupKeyLifecycleRegistry(() => 100)

    registry.registerKey({
      keyId: "k1",
      groupId: "ops",
      secretClass: "S2",
      expiresAt: 200,
    })

    const used = registry.recordKeyUse({
      keyId: "k1",
      groupId: "ops",
      action: "send",
      at: 120,
    })

    expect(used.ok).toBe(true)

    if (used.ok) {
      expect(used.state.useCount).toBe(1)
      expect(used.state.usageByAction.send).toBe(1)
      expect(used.state.lastUsedAt).toBe(120)
    }
  })

  it("marks keys expired and blocks use after expiry", () => {
    const registry = createGroupKeyLifecycleRegistry(() => 100)

    registry.registerKey({
      keyId: "k1",
      groupId: "ops",
      secretClass: "S2",
      expiresAt: 101,
    })

    const expired = registry.enforceExpiry("ops", 101)
    expect(expired).toHaveLength(1)
    expect(expired[0].status).toBe("expired")

    const used = registry.recordKeyUse({
      keyId: "k1",
      groupId: "ops",
      action: "send",
      at: 102,
    })

    expect(used).toMatchObject({
      ok: false,
      reason: "Key is not usable because it is expired.",
    })
  })

  it("creates secure session key lazily and blocks when ttl is elapsed", () => {
    const firstUse = prepareSecureGroupKeyUse({
      groupId: "intel",
      action: "send",
      now: 10,
      ttlSeconds: 5,
    })

    expect(firstUse.ok).toBe(true)
    expect(getSecureGroupKeyState("intel")?.expiresAt).toBe(15)

    const expiredUse = prepareSecureGroupKeyUse({
      groupId: "intel",
      action: "subscribe",
      now: 16,
      ttlSeconds: 5,
    })

    expect(expiredUse).toMatchObject({
      ok: false,
      reason: "Key is not usable because it is expired.",
    })
  })

  it("revokes secure group keys and blocks further key usage", () => {
    const firstUse = prepareSecureGroupKeyUse({
      groupId: "ops",
      action: "send",
      now: 100,
      ttlSeconds: 60,
    })

    expect(firstUse.ok).toBe(true)

    const revoked = revokeSecureGroupKeys("ops", 101)

    expect(revoked).toHaveLength(1)
    expect(revoked[0].status).toBe("revoked")

    const blocked = prepareSecureGroupKeyUse({
      groupId: "ops",
      action: "reconcile",
      now: 102,
      ttlSeconds: 60,
    })

    expect(blocked).toMatchObject({
      ok: false,
      reason: "Key is not usable because it is revoked.",
    })
  })
})
