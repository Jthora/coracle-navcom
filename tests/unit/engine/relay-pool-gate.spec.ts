import {describe, it, expect, vi, beforeEach} from "vitest"

describe("pool-gate", () => {
  let shouldConnect: (url: string) => boolean
  let setActiveCount: (n: number) => void
  let getMaxRelayCount: () => number
  let hasAllowlist: () => boolean

  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv("VITE_RELAY_ALLOWLIST", "")
    vi.stubEnv("VITE_RELAY_DENYLIST", "")
    vi.stubEnv("VITE_RELAY_MAX_COUNT", "8")

    const mod = await import("src/engine/relay/pool-gate")
    shouldConnect = mod.shouldConnect
    setActiveCount = mod.setActiveCount
    getMaxRelayCount = mod.getMaxRelayCount
    hasAllowlist = mod.hasAllowlist
  })

  it("allows valid relay URLs", () => {
    expect(shouldConnect("wss://relay.damus.io")).toBe(true)
  })

  it("rejects invalid relay URLs", () => {
    expect(shouldConnect("not a url")).toBe(false)
  })

  it("rejects when at max connection count", () => {
    setActiveCount(getMaxRelayCount())
    expect(shouldConnect("wss://relay.damus.io")).toBe(false)
  })

  it("allows when below max connection count", () => {
    setActiveCount(getMaxRelayCount() - 1)
    expect(shouldConnect("wss://relay.damus.io")).toBe(true)
  })
})

describe("pool-gate with denylist", () => {
  let shouldConnect: (url: string) => boolean

  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv("VITE_RELAY_DENYLIST", "wss://spam.example.com,wss://bad.relay.io")
    vi.stubEnv("VITE_RELAY_ALLOWLIST", "")
    vi.stubEnv("VITE_RELAY_MAX_COUNT", "8")

    const mod = await import("src/engine/relay/pool-gate")
    shouldConnect = mod.shouldConnect
  })

  it("rejects denylisted URLs", () => {
    expect(shouldConnect("wss://spam.example.com")).toBe(false)
    expect(shouldConnect("wss://bad.relay.io")).toBe(false)
  })

  it("allows non-denylisted URLs", () => {
    expect(shouldConnect("wss://relay.damus.io")).toBe(true)
  })
})

describe("pool-gate with allowlist", () => {
  let shouldConnect: (url: string) => boolean

  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv("VITE_RELAY_ALLOWLIST", "wss://approved.relay.io,wss://relay.navcom.example")
    vi.stubEnv("VITE_RELAY_DENYLIST", "")
    vi.stubEnv("VITE_RELAY_MAX_COUNT", "8")

    const mod = await import("src/engine/relay/pool-gate")
    shouldConnect = mod.shouldConnect
  })

  it("allows allowlisted URLs", () => {
    expect(shouldConnect("wss://approved.relay.io")).toBe(true)
    expect(shouldConnect("wss://relay.navcom.example")).toBe(true)
  })

  it("rejects non-allowlisted URLs", () => {
    expect(shouldConnect("wss://relay.damus.io")).toBe(false)
  })
})
