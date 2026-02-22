import {describe, expect, it, vi} from "vitest"
import {
  emitRelayFallbackUsageTelemetry,
  emitRelayPolicyOutcomeTelemetry,
  emitSecurityStateTransitionTelemetry,
} from "src/app/groups/telemetry-stage3"

describe("app/groups telemetry stage3 helpers", () => {
  it("emits fallback entered and resolved events on security transitions", () => {
    const emit = vi.fn()

    emitSecurityStateTransitionTelemetry({
      emit,
      route: "group-chat",
      previousState: "compatibility-active",
      nextState: "fallback-active",
    })

    emitSecurityStateTransitionTelemetry({
      emit,
      route: "group-chat",
      previousState: "fallback-active",
      nextState: "secure-active",
    })

    const names = emit.mock.calls.map(call => call[0])

    expect(names).toContain("group_security_fallback_entered")
    expect(names).toContain("group_security_fallback_resolved")
  })

  it("emits relay policy save outcome events with relay count", () => {
    const emit = vi.fn()

    emitRelayPolicyOutcomeTelemetry({emit, relayCount: 2, ok: true})
    emitRelayPolicyOutcomeTelemetry({emit, relayCount: 1, ok: false})

    expect(emit).toHaveBeenNthCalledWith(1, "relay_policy_saved", {relayCount: 2})
    expect(emit).toHaveBeenNthCalledWith(2, "relay_policy_save_failed", {relayCount: 1})
  })

  it("emits relay fallback usage telemetry with group id shape", () => {
    const emit = vi.fn()

    emitRelayFallbackUsageTelemetry({
      emit,
      groupId: "relay.example'ops",
      fallbackCount: 3,
    })

    expect(emit).toHaveBeenCalledWith("relay_fallback_used", {
      groupIdShape: "relay-address",
      fallbackCount: 3,
    })
  })
})
