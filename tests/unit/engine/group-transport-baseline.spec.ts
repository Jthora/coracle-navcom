import {describe, expect, it} from "vitest"
import {baselineGroupTransport} from "../../../src/engine/group-transport-baseline"

describe("engine/group-transport-baseline", () => {
  it("implements baseline mode id and lifecycle hooks", async () => {
    expect(baselineGroupTransport.getModeId()).toBe("baseline-nip29")

    await baselineGroupTransport.start?.()
    await baselineGroupTransport.stop?.()
  })

  it("accepts baseline and secure requests via canOperate", () => {
    expect(baselineGroupTransport.canOperate({requestedMode: "baseline-nip29"}).ok).toBe(true)
    expect(baselineGroupTransport.canOperate({requestedMode: "secure-nip-ee"}).ok).toBe(true)
    expect(baselineGroupTransport.canOperate({requestedMode: "legacy-bridge"}).ok).toBe(false)
  })

  it("returns deterministic unsupported failures for unimplemented operations", async () => {
    const sendResult = await baselineGroupTransport.sendMessage?.({})
    const subscribeResult = await baselineGroupTransport.subscribe?.(
      {groupId: "ops"},
      {onEvent: () => {}},
    )
    const reconcileResult = await baselineGroupTransport.reconcile?.({
      groupId: "ops",
      remoteEvents: [],
    })

    expect(sendResult).toMatchObject({
      ok: false,
      code: "GROUP_TRANSPORT_UNSUPPORTED",
      retryable: false,
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
