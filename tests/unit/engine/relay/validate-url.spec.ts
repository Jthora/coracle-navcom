import {describe, it, expect, vi} from "vitest"

// Mock local-relay to avoid env var dependencies
vi.mock("src/engine/relay/local-relay", () => ({
  isLocalRelay: (url: string) => url === "ws://192.168.1.100:7777",
}))

import {isValidRelayUrl, validateRelayUrl} from "src/engine/relay/validate-url"

describe("validate-url", () => {
  it("accepts valid wss:// URLs", () => {
    expect(isValidRelayUrl("wss://relay.damus.io")).toBe(true)
    expect(isValidRelayUrl("wss://nos.lol")).toBe(true)
    expect(isValidRelayUrl("wss://relay.example.com:8080")).toBe(true)
  })

  it("allows ws:// in dev/test mode (import.meta.env.DEV is true)", () => {
    // In vitest, import.meta.env.DEV is true so ws:// is allowed
    expect(isValidRelayUrl("ws://relay.damus.io")).toBe(true)
  })

  it("rejects private hosts", () => {
    expect(isValidRelayUrl("wss://localhost")).toBe(false)
    expect(isValidRelayUrl("wss://127.0.0.1")).toBe(false)
    expect(isValidRelayUrl("wss://192.168.1.1")).toBe(false)
    expect(isValidRelayUrl("wss://10.0.0.1")).toBe(false)
    expect(isValidRelayUrl("wss://172.16.0.1")).toBe(false)
    expect(isValidRelayUrl("wss://[::1]")).toBe(false)
  })

  it("rejects .local and .internal suffixes", () => {
    expect(isValidRelayUrl("wss://myrelay.local")).toBe(false)
    expect(isValidRelayUrl("wss://corp.internal")).toBe(false)
  })

  it("rejects IPv6-mapped IPv4 private addresses", () => {
    expect(isValidRelayUrl("wss://[::ffff:192.168.1.1]")).toBe(false)
    expect(isValidRelayUrl("wss://[::ffff:10.0.0.1]")).toBe(false)
    expect(isValidRelayUrl("wss://[::ffff:127.0.0.1]")).toBe(false)
  })

  it("allows explicitly configured local relay via isLocalRelay bypass", () => {
    expect(isValidRelayUrl("ws://192.168.1.100:7777")).toBe(true)
  })

  it("rejects empty, null-like, and non-string inputs", () => {
    expect(isValidRelayUrl("")).toBe(false)
    expect(isValidRelayUrl(null as any)).toBe(false)
    expect(isValidRelayUrl(undefined as any)).toBe(false)
  })

  it("rejects non-websocket protocols", () => {
    expect(isValidRelayUrl("http://relay.example.com")).toBe(false)
    expect(isValidRelayUrl("ftp://relay.example.com")).toBe(false)
  })

  it("rejects hostnames too short", () => {
    expect(isValidRelayUrl("wss://ab")).toBe(false)
  })

  it("rejects public IP-literal relay URLs (DNS rebinding prevention)", () => {
    expect(isValidRelayUrl("wss://203.0.113.50")).toBe(false)
    expect(isValidRelayUrl("wss://8.8.8.8")).toBe(false)
    expect(isValidRelayUrl("wss://[2001:db8::1]")).toBe(false)
  })

  describe("validateRelayUrl (descriptive errors)", () => {
    it("returns error for empty input", () => {
      const result = validateRelayUrl("")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("empty")
    })

    it("returns error for non-websocket protocols", () => {
      const result = validateRelayUrl("http://relay.example.com")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("protocol")
    })

    it("returns error for private host", () => {
      const result = validateRelayUrl("wss://localhost")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Private")
    })

    it("returns error for IP-literal relay", () => {
      const result = validateRelayUrl("wss://203.0.113.50")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("IP addresses")
    })

    it("returns valid for proper wss:// URL", () => {
      const result = validateRelayUrl("wss://relay.damus.io")
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })
})
