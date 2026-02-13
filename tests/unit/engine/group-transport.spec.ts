import {describe, expect, it, vi} from "vitest"
import {
  dispatchGroupTransportAction,
  resolveGroupTransportAdapter,
} from "src/engine/group-transport"
import {okTransportResult, type GroupTransport} from "src/engine/group-transport-contracts"

describe("engine/group-transport", () => {
  it("resolves adapter using support predicate", () => {
    const secureAdapter: GroupTransport = {
      getModeId: () => "secure-nip-ee",
      canOperate: ({requestedMode}) => ({ok: requestedMode === "secure-nip-ee"}),
      publishControlAction: async () => okTransportResult({ok: true}),
    }

    const resolved = resolveGroupTransportAdapter(
      {
        action: "join",
        payload: {groupId: "ops", memberPubkey: "a".repeat(64)},
        actorRole: "member",
        requestedMode: "secure-nip-ee",
        createdAt: 100,
      },
      [secureAdapter],
    )

    expect(resolved.getModeId()).toBe("secure-nip-ee")
  })

  it("dispatches through matching adapter and emits diagnostics", async () => {
    const publishControlAction = vi.fn(async () => okTransportResult({ok: true}))

    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction,
    }

    const onResolved = vi.fn()
    const onFallback = vi.fn()

    const result = await dispatchGroupTransportAction(
      "create",
      {groupId: "ops", title: "Ops"},
      {
        actorRole: "admin",
        now: 100,
        diagnostics: {onResolved, onFallback},
        adapters: [baselineAdapter],
      },
    )

    expect(result).toEqual({ok: true})
    expect(publishControlAction).toHaveBeenCalledTimes(1)
    expect(onResolved).toHaveBeenCalledTimes(1)
    expect(onFallback).toHaveBeenCalledTimes(0)
  })

  it("emits fallback diagnostics when requested secure mode resolves to baseline", async () => {
    const secureAdapter: GroupTransport = {
      getModeId: () => "secure-nip-ee",
      canOperate: () => ({ok: false, reason: "Secure capability unavailable"}),
      publishControlAction: async () => okTransportResult({ok: true}),
    }

    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({ok: true}),
    }

    const onFallback = vi.fn()

    await dispatchGroupTransportAction(
      "join",
      {groupId: "ops", memberPubkey: "a".repeat(64)},
      {
        actorRole: "member",
        requestedMode: "secure-nip-ee",
        now: 100,
        diagnostics: {onFallback},
        adapters: [secureAdapter, baselineAdapter],
      },
    )

    expect(onFallback).toHaveBeenCalledTimes(1)
    expect(onFallback.mock.calls[0][0].reason).toBe("Secure capability unavailable")
  })

  it("blocks dispatch when capability fallback is disabled", async () => {
    const secureAdapter: GroupTransport = {
      getModeId: () => "secure-nip-ee",
      canOperate: () => ({ok: false, reason: "Secure capability unavailable"}),
      publishControlAction: async () => okTransportResult({ok: true}),
    }

    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({ok: true}),
    }

    await expect(
      dispatchGroupTransportAction(
        "join",
        {groupId: "ops", memberPubkey: "a".repeat(64)},
        {
          actorRole: "member",
          requestedMode: "secure-nip-ee",
          now: 100,
          allowCapabilityFallback: false,
          adapters: [secureAdapter, baselineAdapter],
        },
      ),
    ).rejects.toThrow("Capability gate blocked requested mode")
  })

  it("blocks dispatch when tier policy rejects unresolved secure downgrade", async () => {
    const secureAdapter: GroupTransport = {
      getModeId: () => "secure-nip-ee",
      canOperate: () => ({ok: false, reason: "Secure capability unavailable"}),
      publishControlAction: async () => okTransportResult({ok: true}),
    }

    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({ok: true}),
    }

    await expect(
      dispatchGroupTransportAction(
        "join",
        {groupId: "ops", memberPubkey: "a".repeat(64)},
        {
          actorRole: "member",
          requestedMode: "secure-nip-ee",
          missionTier: 1,
          downgradeConfirmed: false,
          adapters: [secureAdapter, baselineAdapter],
        },
      ),
    ).rejects.toThrow("Tier policy blocked")
  })

  it("emits override audit callback when tier 2 override is confirmed", async () => {
    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({ok: true}),
    }

    const onTierOverride = vi.fn()

    await dispatchGroupTransportAction(
      "create",
      {groupId: "ops", title: "Ops"},
      {
        actorRole: "admin",
        requestedMode: "baseline-nip29",
        missionTier: 2,
        allowTier2Override: true,
        downgradeConfirmed: true,
        now: 100,
        diagnostics: {onTierOverride},
        adapters: [baselineAdapter],
      },
    )

    expect(onTierOverride).toHaveBeenCalledTimes(1)
    expect(onTierOverride.mock.calls[0][0].auditEvent.action).toBe("tier-policy-override")
  })
})
