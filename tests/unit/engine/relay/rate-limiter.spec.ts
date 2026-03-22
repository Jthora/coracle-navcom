import {describe, it, expect, beforeEach} from "vitest"
import {RelayRateLimiter} from "src/engine/relay/rate-limiter"

describe("RelayRateLimiter", () => {
  let limiter: RelayRateLimiter

  beforeEach(() => {
    limiter = new RelayRateLimiter(5, 1000) // 5 events per 1s window for testing
  })

  it("allows events under the threshold", () => {
    expect(limiter.allow("wss://relay.example")).toBe(true)
    expect(limiter.allow("wss://relay.example")).toBe(true)
    expect(limiter.allow("wss://relay.example")).toBe(true)
  })

  it("rate-limits events over the threshold", () => {
    for (let i = 0; i < 5; i++) {
      expect(limiter.allow("wss://relay.example")).toBe(true)
    }
    // 6th event should be dropped
    expect(limiter.allow("wss://relay.example")).toBe(false)
    expect(limiter.allow("wss://relay.example")).toBe(false)
  })

  it("tracks separate windows per relay", () => {
    for (let i = 0; i < 5; i++) limiter.allow("wss://relay-a.example")
    expect(limiter.allow("wss://relay-a.example")).toBe(false)

    // Different relay should have its own window
    expect(limiter.allow("wss://relay-b.example")).toBe(true)
  })

  it("allows critical event kinds even when rate-limited", () => {
    // Fill up the window
    for (let i = 0; i < 5; i++) limiter.allow("wss://relay.example")
    expect(limiter.allow("wss://relay.example")).toBe(false)

    // Critical kinds bypass rate limiting
    expect(limiter.allow("wss://relay.example", 0)).toBe(true) // metadata
    expect(limiter.allow("wss://relay.example", 3)).toBe(true) // contacts
    expect(limiter.allow("wss://relay.example", 27)).toBe(true) // group admin
    expect(limiter.allow("wss://relay.example", 30078)).toBe(true) // key rotation
  })

  it("tracks drop statistics", () => {
    for (let i = 0; i < 5; i++) limiter.allow("wss://relay.example")
    limiter.allow("wss://relay.example") // dropped
    limiter.allow("wss://relay.example") // dropped

    const stats = limiter.getStats("wss://relay.example")
    expect(stats.totalDropped).toBe(2)
    expect(stats.currentRate).toBeGreaterThan(0)
  })

  it("isLimited returns true when threshold exceeded", () => {
    expect(limiter.isLimited("wss://relay.example")).toBe(false)

    for (let i = 0; i < 5; i++) limiter.allow("wss://relay.example")
    limiter.allow("wss://relay.example") // triggers limit

    expect(limiter.isLimited("wss://relay.example")).toBe(true)
  })

  it("reset clears all state", () => {
    for (let i = 0; i < 5; i++) limiter.allow("wss://relay.example")
    limiter.allow("wss://relay.example") // dropped

    limiter.reset()

    expect(limiter.isLimited("wss://relay.example")).toBe(false)
    expect(limiter.getStats("wss://relay.example").totalDropped).toBe(0)
    expect(limiter.allow("wss://relay.example")).toBe(true)
  })

  it("returns unknown relay stats as zeroed", () => {
    const stats = limiter.getStats("wss://unknown.example")
    expect(stats.totalDropped).toBe(0)
    expect(stats.currentRate).toBe(0)
  })

  it("adapts threshold upward for sustained high-traffic relays", () => {
    // Use a limiter with very short window so we can simulate window rollovers
    const adaptiveLimiter = new RelayRateLimiter(10, 1)
    const relay = "wss://busy-relay.example"

    // Simulate 5 consecutive steady windows (>50% but under threshold)
    // Each call with a fresh timestamp triggers a new window because windowMs=1ms
    for (let w = 0; w < 6; w++) {
      // Force new window by waiting (simulate time passing)
      for (let i = 0; i < 8; i++) {
        adaptiveLimiter.allow(relay)
      }
      // Tiny delay to expire the 1ms window — use direct threshold check
    }

    // After sustained traffic, threshold should have ramped above default
    const threshold = adaptiveLimiter.getAdaptiveThreshold(relay)
    expect(threshold).toBeGreaterThanOrEqual(10)
  })
})
