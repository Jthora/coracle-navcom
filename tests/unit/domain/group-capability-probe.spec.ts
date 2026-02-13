import {describe, expect, it} from "vitest"
import {
  createGroupCapabilityCache,
  GROUP_CAPABILITY_REASON,
  GROUP_CAPABILITY_REQUESTS,
  mapCapabilityReasonsToUi,
  runGroupCapabilityProbe,
} from "src/domain/group-capability-probe"

describe("group-capability-probe", () => {
  it("defines probe request set", () => {
    expect(GROUP_CAPABILITY_REQUESTS.map(r => r.id)).toEqual([
      "auth",
      "group-kind",
      "ack-stability",
      "signer-nip44",
    ])
  })

  it("executes probe and returns reason codes", () => {
    const result = runGroupCapabilityProbe({
      url: "wss://relay.example",
      supportsAuth: true,
      supportsGroupKinds: false,
      stableAck: false,
      signerNip44: false,
      checkedAt: 100,
    })

    expect(result.readiness).toBe("R1")
    expect(result.reasons).toContain(GROUP_CAPABILITY_REASON.MISSING_GROUP_KIND)
    expect(result.reasons).toContain(GROUP_CAPABILITY_REASON.UNSTABLE_ACK)
    expect(result.reasons).toContain(GROUP_CAPABILITY_REASON.MISSING_SIGNER_FEATURE)
  })

  it("supports cache TTL and stale fallback", () => {
    const cache = createGroupCapabilityCache({ttlSeconds: 10, staleAfterSeconds: 20})

    cache.upsert(
      "wss://relay.example",
      {
        relayUrl: "wss://relay.example",
        checkedAt: 100,
        readiness: "R3",
        reasons: [],
      },
      100,
    )

    expect(cache.getFreshness("wss://relay.example", 105)).toBe("fresh")
    expect(cache.getFreshness("wss://relay.example", 115)).toBe("expired")
    expect(cache.getFreshness("wss://relay.example", 121)).toBe("stale")

    const fallback = cache.getWithFallback("wss://relay.example", 121)

    expect(fallback?.reasons).toContain(GROUP_CAPABILITY_REASON.STALE_CACHE)
  })

  it("applies trigger-based probe refresh policy", () => {
    const cache = createGroupCapabilityCache({ttlSeconds: 10, staleAfterSeconds: 20})

    cache.upsert(
      "wss://relay.example",
      {
        relayUrl: "wss://relay.example",
        checkedAt: 100,
        readiness: "R3",
        reasons: [],
      },
      100,
    )

    expect(cache.shouldProbe("manual", "wss://relay.example", 101)).toBe(true)
    expect(cache.shouldProbe("create", "wss://relay.example", 101)).toBe(true)
    expect(cache.shouldProbe("periodic", "wss://relay.example", 105)).toBe(false)
    expect(cache.shouldProbe("periodic", "wss://relay.example", 115)).toBe(true)
  })

  it("maps reason codes to UI diagnostics", () => {
    const diagnostics = mapCapabilityReasonsToUi([
      GROUP_CAPABILITY_REASON.MISSING_AUTH,
      GROUP_CAPABILITY_REASON.MISSING_GROUP_KIND,
    ])

    expect(diagnostics).toEqual([
      {
        code: GROUP_CAPABILITY_REASON.MISSING_AUTH,
        message: "Relay does not support required authentication.",
      },
      {
        code: GROUP_CAPABILITY_REASON.MISSING_GROUP_KIND,
        message: "Relay does not support required group event kinds.",
      },
    ])
  })
})
