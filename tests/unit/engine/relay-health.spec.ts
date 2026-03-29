import {describe, expect, it, beforeEach} from "vitest"
import {RelayHealthTracker} from "../../../src/engine/relay/relay-health"

describe("engine/relay/relay-health", () => {
  let tracker: RelayHealthTracker

  beforeEach(() => {
    tracker = new RelayHealthTracker()
  })

  it("classifies verified relays correctly", () => {
    expect(tracker.getTier("wss://relay.damus.io")).toBe("verified")
    expect(tracker.getTier("wss://relay.nostr.band")).toBe("verified")
  })

  it("classifies unknown relays correctly", () => {
    expect(tracker.getTier("wss://my-custom-relay.example.com")).toBe("unknown")
  })

  it("allows marking a relay as known", () => {
    tracker.markKnown("wss://my-relay.example.com")
    expect(tracker.getTier("wss://my-relay.example.com")).toBe("known")
  })

  it("tracks success and failure counts", () => {
    tracker.recordSuccess("wss://relay.test")
    tracker.recordSuccess("wss://relay.test")
    tracker.recordFailure("wss://relay.test")

    const health = tracker.getHealth("wss://relay.test")
    expect(health?.successes).toBe(2)
    expect(health?.failures).toBe(1)
  })

  it("calculates uptime percentage", () => {
    for (let i = 0; i < 8; i++) tracker.recordSuccess("wss://relay.test")
    for (let i = 0; i < 2; i++) tracker.recordFailure("wss://relay.test")

    expect(tracker.getUptimePercent("wss://relay.test")).toBe(80)
  })

  it("returns 100% uptime for unknown relays", () => {
    expect(tracker.getUptimePercent("wss://never-seen.test")).toBe(100)
  })

  it("auto-demotes relays with high failure rate", () => {
    // 1 success, 5 failures = 83% failure rate (> 80% threshold)
    tracker.recordSuccess("wss://bad-relay.test")
    for (let i = 0; i < 5; i++) tracker.recordFailure("wss://bad-relay.test")

    expect(tracker.isDemoted("wss://bad-relay.test")).toBe(true)
  })

  it("does not demote with insufficient data", () => {
    // Only 3 connections total — below minimum of 5
    tracker.recordFailure("wss://new-relay.test")
    tracker.recordFailure("wss://new-relay.test")
    tracker.recordFailure("wss://new-relay.test")

    expect(tracker.isDemoted("wss://new-relay.test")).toBe(false)
  })

  it("lifts demotion after recovery", () => {
    // Trigger demotion: 1 success, 5 failures
    tracker.recordSuccess("wss://recovering.test")
    for (let i = 0; i < 5; i++) tracker.recordFailure("wss://recovering.test")
    expect(tracker.isDemoted("wss://recovering.test")).toBe(true)

    // Recover: many successes to bring failure rate below 40%
    for (let i = 0; i < 20; i++) tracker.recordSuccess("wss://recovering.test")
    expect(tracker.isDemoted("wss://recovering.test")).toBe(false)
  })

  it("filterHealthy excludes demoted relays", () => {
    tracker.recordSuccess("wss://good.test")
    tracker.recordSuccess("wss://bad.test")
    for (let i = 0; i < 5; i++) tracker.recordFailure("wss://bad.test")

    const result = tracker.filterHealthy(["wss://good.test", "wss://bad.test"])
    expect(result).toEqual(["wss://good.test"])
  })

  it("filterHealthy keeps all relays if all are demoted (circuit breaker)", () => {
    // Both relays demoted
    for (const url of ["wss://a.test", "wss://b.test"]) {
      tracker.recordSuccess(url)
      for (let i = 0; i < 5; i++) tracker.recordFailure(url)
    }

    const result = tracker.filterHealthy(["wss://a.test", "wss://b.test"])
    expect(result).toEqual(["wss://a.test", "wss://b.test"])
  })

  it("getAllMetrics returns data for all tracked relays", () => {
    tracker.recordSuccess("wss://a.test")
    tracker.recordFailure("wss://b.test")

    const metrics = tracker.getAllMetrics()
    expect(metrics.length).toBe(2)
    expect(metrics.map(m => m.url).sort()).toEqual(["wss://a.test", "wss://b.test"])
  })

  it("reset clears all health data", () => {
    tracker.recordSuccess("wss://relay.test")
    tracker.reset()
    expect(tracker.getHealth("wss://relay.test")).toBeUndefined()
    expect(tracker.getAllMetrics()).toEqual([])
  })
})
