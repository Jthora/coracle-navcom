import {describe, expect, it} from "vitest"
import {baselineGroupTransport} from "../../../src/engine/group-transport-baseline"

describe("engine/group-transport-baseline", () => {
  it("implements baseline mode id and lifecycle hooks", async () => {
    expect(baselineGroupTransport.getModeId()).toBe("baseline-nip29")

    await baselineGroupTransport.start?.()
    await baselineGroupTransport.stop?.()
  })

  it("accepts baseline requests and rejects secure-nip-ee via canOperate", () => {
    expect(baselineGroupTransport.canOperate({requestedMode: "baseline-nip29"}).ok).toBe(true)
    expect(baselineGroupTransport.canOperate({requestedMode: "secure-nip-ee"}).ok).toBe(false)
    expect(baselineGroupTransport.canOperate({requestedMode: "legacy-bridge"}).ok).toBe(false)
  })

  it("validates baseline group message payload before send", async () => {
    const invalid = await baselineGroupTransport.sendMessage?.({groupId: "", content: ""})

    expect(invalid).toMatchObject({
      ok: false,
      code: "GROUP_TRANSPORT_VALIDATION_FAILED",
      retryable: false,
    })
  })

  it("returns deterministic unsupported failures for unimplemented subscribe/reconcile", async () => {
    const subscribeResult = await baselineGroupTransport.subscribe?.(
      {groupId: "ops"},
      {onEvent: () => {}},
    )
    const reconcileResult = await baselineGroupTransport.reconcile?.({
      groupId: "ops",
      remoteEvents: [],
    })

    expect(subscribeResult).toMatchObject({
      ok: false,
      code: "GROUP_TRANSPORT_UNSUPPORTED",
      retryable: false,
    })
    expect(reconcileResult).toMatchObject({
      ok: false,
      code: "GROUP_TRANSPORT_UNSUPPORTED",
      retryable: false,
    })
  })
})
