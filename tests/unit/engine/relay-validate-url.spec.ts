import {describe, it, expect, vi, beforeEach} from "vitest"

// Mock import.meta.env before importing module
vi.stubGlobal("import", {meta: {env: {DEV: false}}})

// We test the validation logic by reimporting with different env states
describe("isValidRelayUrl", () => {
  let isValidRelayUrl: (url: string) => boolean

  beforeEach(async () => {
    vi.resetModules()
  })

  describe("production mode", () => {
    beforeEach(async () => {
      vi.stubEnv("DEV", "")
      const mod = await import("src/engine/relay/validate-url")
      isValidRelayUrl = mod.isValidRelayUrl
    })

    it("accepts valid wss:// URLs", () => {
      expect(isValidRelayUrl("wss://relay.damus.io")).toBe(true)
      expect(isValidRelayUrl("wss://relay.nostr.info")).toBe(true)
      expect(isValidRelayUrl("wss://nos.lol")).toBe(true)
    })

    it("rejects ws:// URLs in production", () => {
      expect(isValidRelayUrl("ws://relay.damus.io")).toBe(false)
    })

    it("rejects non-websocket protocols", () => {
      expect(isValidRelayUrl("http://relay.damus.io")).toBe(false)
      expect(isValidRelayUrl("https://relay.damus.io")).toBe(false)
      expect(isValidRelayUrl("ftp://relay.damus.io")).toBe(false)
    })

    it("rejects malformed URLs", () => {
      expect(isValidRelayUrl("not a url")).toBe(false)
      expect(isValidRelayUrl("")).toBe(false)
      expect(isValidRelayUrl("wss://")).toBe(false)
    })

    it("rejects null/undefined/non-string inputs", () => {
      expect(isValidRelayUrl(null as any)).toBe(false)
      expect(isValidRelayUrl(undefined as any)).toBe(false)
      expect(isValidRelayUrl(123 as any)).toBe(false)
    })

    it("rejects localhost", () => {
      expect(isValidRelayUrl("wss://localhost")).toBe(false)
      expect(isValidRelayUrl("wss://localhost:8080")).toBe(false)
    })

    it("rejects 127.0.0.1", () => {
      expect(isValidRelayUrl("wss://127.0.0.1")).toBe(false)
      expect(isValidRelayUrl("wss://127.0.0.1:8080")).toBe(false)
    })

    it("rejects private network ranges", () => {
      expect(isValidRelayUrl("wss://192.168.1.1")).toBe(false)
      expect(isValidRelayUrl("wss://10.0.0.1")).toBe(false)
      expect(isValidRelayUrl("wss://172.16.0.1")).toBe(false)
      expect(isValidRelayUrl("wss://172.31.255.255")).toBe(false)
    })

    it("rejects .local and .internal domains", () => {
      expect(isValidRelayUrl("wss://relay.local")).toBe(false)
      expect(isValidRelayUrl("wss://relay.internal")).toBe(false)
    })

    it("rejects short hostnames", () => {
      expect(isValidRelayUrl("wss://ab")).toBe(false)
    })

    it("accepts hostnames with 3+ characters", () => {
      expect(isValidRelayUrl("wss://abc")).toBe(true)
    })
  })
})
