import {describe, expect, it} from "vitest"
import {
  simulateMixedCapabilityLane,
  summarizeMixedCapabilityTelemetry,
} from "src/app/groups/mixed-capability-lanes"

describe("app/groups mixed-capability lanes", () => {
  it("simulates secure capability mismatch and records fallback telemetry", async () => {
    const result = await simulateMixedCapabilityLane({
      missionTier: 0,
      capabilities: {
        url: "wss://relay.example",
        supportsAuth: true,
        supportsGroupKinds: true,
        stableAck: true,
        signerNip44: false,
        checkedAt: 100,
      },
    })

    expect(result.status).toBe("fallback")
    expect(result.capabilityReadiness).toBe("R3")
    expect(result.telemetry.some(event => event.type === "fallback")).toBe(true)

    const summary = summarizeMixedCapabilityTelemetry(result.telemetry)

    expect(summary.fallbackEvents).toBe(1)
    expect(summary.capabilityBlockedEvents).toBe(0)
  })

  it("simulates strict capability gate block when fallback disabled", async () => {
    const result = await simulateMixedCapabilityLane({
      missionTier: 0,
      allowCapabilityFallback: false,
      capabilities: {
        url: "wss://relay.example",
        supportsAuth: true,
        supportsGroupKinds: true,
        stableAck: true,
        signerNip44: false,
        checkedAt: 100,
      },
    })

    expect(result.status).toBe("blocked")
    expect(result.error).toContain("Capability gate blocked")
    expect(result.telemetry.some(event => event.type === "capability_blocked")).toBe(true)
  })

  it("simulates tier policy block for unresolved tier-1 secure downgrade", async () => {
    const result = await simulateMixedCapabilityLane({
      missionTier: 1,
      downgradeConfirmed: false,
      capabilities: {
        url: "wss://relay.example",
        supportsAuth: true,
        supportsGroupKinds: true,
        stableAck: true,
        signerNip44: false,
        checkedAt: 100,
      },
    })

    expect(result.status).toBe("blocked")
    expect(result.error).toContain("Tier policy blocked")
    expect(result.telemetry.some(event => event.type === "tier_policy_blocked")).toBe(true)
  })
})
