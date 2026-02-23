import {describe, expect, it, vi} from "vitest"
import {
  dispatchGroupTransportAction,
  dispatchGroupTransportMessage,
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

  it("captures mission-tier confirmation diagnostics when action downgrade is blocked", async () => {
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

    const onTierPolicyBlocked = vi.fn()

    await expect(
      dispatchGroupTransportAction(
        "join",
        {groupId: "ops", memberPubkey: "a".repeat(64)},
        {
          actorRole: "member",
          requestedMode: "secure-nip-ee",
          missionTier: 1,
          downgradeConfirmed: false,
          diagnostics: {onTierPolicyBlocked},
          adapters: [secureAdapter, baselineAdapter],
        },
      ),
    ).rejects.toThrow("requires explicit confirmation")

    expect(onTierPolicyBlocked).toHaveBeenCalledTimes(1)
    expect(onTierPolicyBlocked.mock.calls[0][0].missionTier).toBe(1)
    expect(onTierPolicyBlocked.mock.calls[0][0].reason).toContain("requires explicit confirmation")
    expect(onTierPolicyBlocked.mock.calls[0][0].intent.requestedMode).toBe("secure-nip-ee")
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
    expect(onTierOverride.mock.calls[0][0].auditEvent.missionTier).toBe(2)
    expect(onTierOverride.mock.calls[0][0].auditEvent.reason).toContain("override")
  })

  it("dispatches group messages through adapter sendMessage with diagnostics", async () => {
    const sendMessage = vi.fn(async () => okTransportResult({id: "m1"}))

    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({ok: true}),
      sendMessage,
    }

    const onResolved = vi.fn()
    const onFallback = vi.fn()

    const result = await dispatchGroupTransportMessage(
      {
        groupId: "ops",
        content: "hello",
        requestedMode: "baseline-nip29",
        actorRole: "member",
        createdAt: 100,
      },
      {onResolved, onFallback},
      [baselineAdapter],
    )

    expect(result).toEqual({id: "m1"})
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(onResolved).toHaveBeenCalledTimes(1)
    expect(onFallback).toHaveBeenCalledTimes(0)
  })

  it("falls back message dispatch when secure adapter cannot operate", async () => {
    const secureAdapter: GroupTransport = {
      getModeId: () => "secure-nip-ee",
      canOperate: () => ({ok: false, reason: "Secure capability unavailable"}),
      publishControlAction: async () => okTransportResult({ok: true}),
      sendMessage: async () => okTransportResult({id: "secure"}),
    }

    const baselineSend = vi.fn(async () => okTransportResult({id: "baseline"}))

    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({ok: true}),
      sendMessage: baselineSend,
    }

    const onFallback = vi.fn()

    const result = await dispatchGroupTransportMessage(
      {
        groupId: "ops",
        content: "hello",
        requestedMode: "secure-nip-ee",
        actorRole: "member",
        createdAt: 100,
      },
      {onFallback},
      [secureAdapter, baselineAdapter],
    )

    expect(result).toEqual({id: "baseline"})
    expect(baselineSend).toHaveBeenCalledTimes(1)
    expect(onFallback).toHaveBeenCalledTimes(1)
    expect(baselineSend.mock.calls[0][0].requestedMode).toBe("secure-nip-ee")
    expect(baselineSend.mock.calls[0][0].resolvedMode).toBe("baseline-nip29")
  })

  it("propagates requested/resolved mode pair when secure adapter handles message", async () => {
    const secureSend = vi.fn(async () => okTransportResult({id: "secure"}))

    const secureAdapter: GroupTransport = {
      getModeId: () => "secure-nip-ee",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({ok: true}),
      sendMessage: secureSend,
    }

    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({ok: true}),
      sendMessage: async () => okTransportResult({id: "baseline"}),
    }

    const result = await dispatchGroupTransportMessage(
      {
        groupId: "ops",
        content: "hello",
        requestedMode: "secure-nip-ee",
        actorRole: "member",
        createdAt: 100,
      },
      {},
      [secureAdapter, baselineAdapter],
    )

    expect(result).toEqual({id: "secure"})
    expect(secureSend).toHaveBeenCalledTimes(1)
    expect(secureSend.mock.calls[0][0].requestedMode).toBe("secure-nip-ee")
    expect(secureSend.mock.calls[0][0].resolvedMode).toBe("secure-nip-ee")
  })

  it("blocks message dispatch when capability fallback is disabled", async () => {
    const secureAdapter: GroupTransport = {
      getModeId: () => "secure-nip-ee",
      canOperate: () => ({ok: false, reason: "Secure capability unavailable"}),
      publishControlAction: async () => okTransportResult({ok: true}),
      sendMessage: async () => okTransportResult({id: "secure"}),
    }

    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({ok: true}),
      sendMessage: async () => okTransportResult({id: "baseline"}),
    }

    await expect(
      dispatchGroupTransportMessage(
        {
          groupId: "ops",
          content: "hello",
          requestedMode: "secure-nip-ee",
          actorRole: "member",
          createdAt: 100,
        },
        {},
        [secureAdapter, baselineAdapter],
        {allowCapabilityFallback: false},
      ),
    ).rejects.toThrow("Capability gate blocked requested mode")
  })

  it("captures mission-tier confirmation diagnostics when message downgrade is blocked", async () => {
    const secureAdapter: GroupTransport = {
      getModeId: () => "secure-nip-ee",
      canOperate: () => ({ok: false, reason: "Secure capability unavailable"}),
      publishControlAction: async () => okTransportResult({ok: true}),
      sendMessage: async () => okTransportResult({id: "secure"}),
    }

    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({ok: true}),
      sendMessage: async () => okTransportResult({id: "baseline"}),
    }

    const onTierPolicyBlocked = vi.fn()

    await expect(
      dispatchGroupTransportMessage(
        {
          groupId: "ops",
          content: "hello",
          requestedMode: "secure-nip-ee",
          actorRole: "member",
          createdAt: 100,
        },
        {onTierPolicyBlocked},
        [secureAdapter, baselineAdapter],
        {missionTier: 1, downgradeConfirmed: false},
      ),
    ).rejects.toThrow("requires explicit confirmation")

    expect(onTierPolicyBlocked).toHaveBeenCalledTimes(1)
    expect(onTierPolicyBlocked.mock.calls[0][0].missionTier).toBe(1)
    expect(onTierPolicyBlocked.mock.calls[0][0].reason).toContain("requires explicit confirmation")
    expect(onTierPolicyBlocked.mock.calls[0][0].request.requestedMode).toBe("secure-nip-ee")
  })

  it("emits message override audit callback when tier 2 override is confirmed", async () => {
    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({ok: true}),
      sendMessage: async () => okTransportResult({id: "msg-baseline-2"}),
    }

    const onTierOverride = vi.fn()

    await dispatchGroupTransportMessage(
      {
        groupId: "ops",
        content: "ack override",
        requestedMode: "baseline-nip29",
        actorRole: "member",
        createdAt: 101,
      },
      {onTierOverride},
      [baselineAdapter],
      {missionTier: 2, allowTier2Override: true, downgradeConfirmed: true},
    )

    expect(onTierOverride).toHaveBeenCalledTimes(1)
    const event = onTierOverride.mock.calls[0][0].auditEvent

    expect(event.action).toBe("tier-policy-override")
    expect(event.missionTier).toBe(2)
    expect(event.requestedMode).toBe("baseline-nip29")
    expect(event.resolvedMode).toBe("baseline-nip29")
    expect(event.reason).toContain("override")
  })

  it("passes max create→join→chat flow on secure transport without fallback", async () => {
    const securePublish = vi.fn(async ({action}) =>
      okTransportResult({action, mode: "secure-nip-ee"}),
    )
    const secureSend = vi.fn(async () =>
      okTransportResult({id: "msg-secure-1", mode: "secure-nip-ee"}),
    )

    const secureAdapter: GroupTransport = {
      getModeId: () => "secure-nip-ee",
      canOperate: ({requestedMode}) => ({ok: requestedMode === "secure-nip-ee"}),
      publishControlAction: securePublish,
      sendMessage: secureSend,
    }

    const baselineAdapter: GroupTransport = {
      getModeId: () => "baseline-nip29",
      canOperate: () => ({ok: true}),
      publishControlAction: async () => okTransportResult({mode: "baseline-nip29"}),
      sendMessage: async () => okTransportResult({id: "msg-baseline-1", mode: "baseline-nip29"}),
    }

    const onActionFallback = vi.fn()
    const onMessageFallback = vi.fn()
    const onActionResolved = vi.fn()
    const onMessageResolved = vi.fn()

    const createResult = await dispatchGroupTransportAction(
      "create",
      {groupId: "ops.max", title: "Ops Max"},
      {
        actorRole: "admin",
        requestedMode: "secure-nip-ee",
        missionTier: 2,
        diagnostics: {onResolved: onActionResolved, onFallback: onActionFallback},
        adapters: [secureAdapter, baselineAdapter],
        allowCapabilityFallback: false,
      },
    )

    const joinResult = await dispatchGroupTransportAction(
      "join",
      {groupId: "ops.max", memberPubkey: "a".repeat(64)},
      {
        actorRole: "member",
        requestedMode: "secure-nip-ee",
        missionTier: 2,
        diagnostics: {onResolved: onActionResolved, onFallback: onActionFallback},
        adapters: [secureAdapter, baselineAdapter],
        allowCapabilityFallback: false,
      },
    )

    const messageResult = await dispatchGroupTransportMessage(
      {
        groupId: "ops.max",
        content: "all green",
        requestedMode: "secure-nip-ee",
        actorRole: "member",
        createdAt: 102,
      },
      {onResolved: onMessageResolved, onFallback: onMessageFallback},
      [secureAdapter, baselineAdapter],
      {missionTier: 2, allowCapabilityFallback: false},
    )

    expect(createResult).toEqual({action: "create", mode: "secure-nip-ee"})
    expect(joinResult).toEqual({action: "join", mode: "secure-nip-ee"})
    expect(messageResult).toEqual({id: "msg-secure-1", mode: "secure-nip-ee"})
    expect(securePublish).toHaveBeenCalledTimes(2)
    expect(secureSend).toHaveBeenCalledTimes(1)
    expect(onActionResolved).toHaveBeenCalledTimes(2)
    expect(onMessageResolved).toHaveBeenCalledTimes(1)
    expect(onActionFallback).toHaveBeenCalledTimes(0)
    expect(onMessageFallback).toHaveBeenCalledTimes(0)
  })
})
