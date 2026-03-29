import {describe, it, expect, vi, beforeEach} from "vitest"

describe("pool-gate integration", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("shouldConnect rejects invalid URLs", async () => {
    vi.stubEnv("VITE_RELAY_ALLOWLIST", "")
    vi.stubEnv("VITE_RELAY_DENYLIST", "")
    vi.stubEnv("VITE_RELAY_MAX_COUNT", "8")

    const mod = await import("src/engine/relay/pool-gate")
    expect(mod.shouldConnect("wss://relay.damus.io")).toBe(true)
    expect(mod.shouldConnect("http://evil.com")).toBe(false)
    expect(mod.shouldConnect("")).toBe(false)
  })

  it("shouldConnect blocks denylisted relays", async () => {
    vi.stubEnv("VITE_RELAY_DENYLIST", "wss://bad.relay.com")
    vi.stubEnv("VITE_RELAY_ALLOWLIST", "")
    vi.stubEnv("VITE_RELAY_MAX_COUNT", "100")

    const mod = await import("src/engine/relay/pool-gate")
    expect(mod.shouldConnect("wss://bad.relay.com")).toBe(false)
    expect(mod.shouldConnect("wss://good.relay.com")).toBe(true)
  })

  it("shouldConnect respects maxCount", async () => {
    vi.stubEnv("VITE_RELAY_ALLOWLIST", "")
    vi.stubEnv("VITE_RELAY_DENYLIST", "")
    vi.stubEnv("VITE_RELAY_MAX_COUNT", "2")

    const mod = await import("src/engine/relay/pool-gate")
    mod.setActiveCount(2)
    expect(mod.shouldConnect("wss://relay.damus.io")).toBe(false)

    mod.setActiveCount(1)
    expect(mod.shouldConnect("wss://relay.damus.io")).toBe(true)
  })

  it("tracks active count correctly", async () => {
    vi.stubEnv("VITE_RELAY_ALLOWLIST", "")
    vi.stubEnv("VITE_RELAY_DENYLIST", "")
    vi.stubEnv("VITE_RELAY_MAX_COUNT", "8")

    const mod = await import("src/engine/relay/pool-gate")
    expect(mod.getActiveCount()).toBe(0)
    mod.setActiveCount(3)
    expect(mod.getActiveCount()).toBe(3)
  })
})
