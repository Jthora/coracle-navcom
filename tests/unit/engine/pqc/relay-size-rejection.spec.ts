import {describe, expect, it} from "vitest"
import {
  detectRelaySizeRejectionReason,
  getRelaySizeRejectionNotice,
  resolveRelaySizeFallbackAction,
  selectAlternateRelaysForRetry,
} from "../../../../src/engine/pqc/relay-size-rejection"

describe("engine/pqc/relay-size-rejection", () => {
  it("detects known size-rejection relay messages", () => {
    expect(detectRelaySizeRejectionReason("event too large for relay policy")).toBe(
      "RELAY_EVENT_TOO_LARGE",
    )
    expect(detectRelaySizeRejectionReason("max_event_bytes exceeded")).toBe(
      "RELAY_MAX_EVENT_BYTES_EXCEEDED",
    )
    expect(detectRelaySizeRejectionReason("permission denied")).toBeNull()
  })

  it("produces diagnostic notice for size rejections", () => {
    const notice = getRelaySizeRejectionNotice("event oversize")

    expect(notice?.reason).toBe("RELAY_EVENT_TOO_LARGE")
    expect(notice?.summary).toContain("payload size constraints")
  })

  it("selects alternate relays that fit budget and were not attempted", () => {
    const alternates = selectAlternateRelaysForRetry({
      attemptedRelays: ["wss://a"],
      evaluations: [
        {
          relay: "wss://a",
          fits: true,
          budgetBytes: 6000,
          payloadBytes: 5000,
          reason: "WITHIN_BUDGET",
        },
        {
          relay: "wss://b",
          fits: true,
          budgetBytes: 6000,
          payloadBytes: 5000,
          reason: "WITHIN_BUDGET",
        },
        {
          relay: "wss://c",
          fits: false,
          budgetBytes: 4000,
          payloadBytes: 5000,
          reason: "OVER_BUDGET",
        },
      ],
    })

    expect(alternates).toEqual(["wss://b"])
  })

  it("resolves retry/fallback/block actions deterministically", () => {
    expect(
      resolveRelaySizeFallbackAction({
        policyMode: "strict",
        allowClassicalFallback: false,
        alternateRelays: ["wss://b"],
      }).action,
    ).toBe("retry-alt-relays")

    expect(
      resolveRelaySizeFallbackAction({
        policyMode: "compatibility",
        allowClassicalFallback: true,
        alternateRelays: [],
      }).action,
    ).toBe("fallback-mode")

    expect(
      resolveRelaySizeFallbackAction({
        policyMode: "strict",
        allowClassicalFallback: false,
        alternateRelays: [],
      }).action,
    ).toBe("block")
  })
})
