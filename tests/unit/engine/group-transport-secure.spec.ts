import {describe, expect, it, beforeEach} from "vitest"
import {
  isSecurePilotEnabled,
  securePilotGroupTransport,
  setSecurePilotEnabled,
} from "../../../src/engine/group-transport-secure"
import {dispatchGroupTransportAction} from "../../../src/engine/group-transport"

describe("engine/group-transport-secure", () => {
  beforeEach(() => {
    setSecurePilotEnabled(false)
  })

  it("is disabled by default", () => {
    expect(isSecurePilotEnabled()).toBe(false)
    expect(securePilotGroupTransport.canOperate({requestedMode: "secure-nip-ee"}).ok).toBe(false)
  })

  it("can operate when enabled with secure mode and adequate readiness", () => {
    setSecurePilotEnabled(true)

    expect(
      securePilotGroupTransport.canOperate({
        requestedMode: "secure-nip-ee",
        capabilitySnapshot: {readiness: "R4"},
      }),
    ).toEqual({ok: true})

    expect(
      securePilotGroupTransport.canOperate({
        requestedMode: "secure-nip-ee",
        capabilitySnapshot: {readiness: "R3"},
      }).ok,
    ).toBe(false)
  })

  it("falls back to baseline when secure pilot is disabled", async () => {
    const result = await dispatchGroupTransportAction(
      "create",
      {groupId: "ops", title: "Ops"},
      {
        actorRole: "admin",
        requestedMode: "secure-nip-ee",
        now: 100,
        adapters: [
          securePilotGroupTransport,
          {
            getModeId: () => "baseline-nip29",
            canOperate: () => ({ok: true}),
            publishControlAction: async () => ({ok: true, value: {source: "baseline"}}),
          },
        ] as any,
      },
    )

    expect(result).toEqual({source: "baseline"})
  })

  it("returns validation failure for malformed secure send payload", async () => {
    setSecurePilotEnabled(true)

    const result = await securePilotGroupTransport.sendMessage?.({
      groupId: "ops",
      content: "",
      recipients: [],
    })

    expect(result).toMatchObject({
      ok: false,
      code: "GROUP_TRANSPORT_VALIDATION_FAILED",
    })
  })

  it("returns capability blocked when secure subscription is attempted while disabled", async () => {
    setSecurePilotEnabled(false)

    const result = await securePilotGroupTransport.subscribe?.(
      {groupId: "ops"},
      {onEvent: () => {}},
    )

    expect(result).toMatchObject({
      ok: false,
      code: "GROUP_TRANSPORT_CAPABILITY_BLOCKED",
    })
  })
})
