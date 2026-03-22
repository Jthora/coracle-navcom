import {describe, expect, it} from "vitest"
import {
  isValidRelayUrl,
  isPrivateRelayUrl,
  validateRelayPolicy,
  createRelayEntry,
} from "src/app/groups/relay-policy"

describe("relay-policy security", () => {
  describe("isValidRelayUrl", () => {
    it("accepts valid wss:// URLs", () => {
      expect(isValidRelayUrl("wss://relay.damus.io")).toBe(true)
      expect(isValidRelayUrl("wss://relay.example:8080")).toBe(true)
      expect(isValidRelayUrl("wss://nos.lol/path")).toBe(true)
    })

    it("rejects ws:// unencrypted URLs", () => {
      expect(isValidRelayUrl("ws://relay.damus.io")).toBe(false)
      expect(isValidRelayUrl("ws://relay.example:8080")).toBe(false)
    })

    it("rejects non-websocket protocols", () => {
      expect(isValidRelayUrl("http://relay.damus.io")).toBe(false)
      expect(isValidRelayUrl("https://relay.damus.io")).toBe(false)
      expect(isValidRelayUrl("ftp://relay.damus.io")).toBe(false)
    })

    it("handles mixed-case and whitespace", () => {
      expect(isValidRelayUrl("WSS://relay.example")).toBe(true)
      expect(isValidRelayUrl("WS://relay.example")).toBe(false)
      expect(isValidRelayUrl("  wss://relay.example  ")).toBe(false) // not trimmed by isValidRelayUrl (caller's job)
      expect(isValidRelayUrl("Wss://relay.example")).toBe(true)
    })

    it("rejects double-slash and malformed protocol variations", () => {
      expect(isValidRelayUrl("wss:///relay.example")).toBe(false)
      expect(isValidRelayUrl("wss:////relay.example")).toBe(false)
      expect(isValidRelayUrl("wss://")).toBe(false)
      expect(isValidRelayUrl("")).toBe(false)
    })
  })

  describe("createRelayEntry normalization", () => {
    it("normalizes mixed-case and trailing slashes", () => {
      const entry = createRelayEntry({url: "WSS://RELAY.EXAMPLE/"})
      expect(entry.url).toBe("wss://relay.example")
    })

    it("handles trailing whitespace", () => {
      const entry = createRelayEntry({url: "  wss://relay.example  "})
      expect(entry.url).toBe("wss://relay.example")
    })

    it("collapses double-slash variations", () => {
      const entry = createRelayEntry({url: "wss:///relay.example"})
      expect(entry.url).toBe("wss://relay.example")
    })
  })

  describe("isPrivateRelayUrl", () => {
    it("blocks localhost", () => {
      expect(isPrivateRelayUrl("wss://localhost")).toBe(true)
      expect(isPrivateRelayUrl("wss://localhost:8080")).toBe(true)
    })

    it("blocks 127.x loopback", () => {
      expect(isPrivateRelayUrl("wss://127.0.0.1")).toBe(true)
      expect(isPrivateRelayUrl("wss://127.0.0.1:3000")).toBe(true)
    })

    it("blocks 10.x private range", () => {
      expect(isPrivateRelayUrl("wss://10.0.0.1")).toBe(true)
      expect(isPrivateRelayUrl("wss://10.255.255.255")).toBe(true)
    })

    it("blocks 172.16-31.x private range", () => {
      expect(isPrivateRelayUrl("wss://172.16.0.1")).toBe(true)
      expect(isPrivateRelayUrl("wss://172.31.255.255")).toBe(true)
    })

    it("blocks 192.168.x private range", () => {
      expect(isPrivateRelayUrl("wss://192.168.1.1")).toBe(true)
      expect(isPrivateRelayUrl("wss://192.168.0.1:8080")).toBe(true)
    })

    it("blocks IPv6 loopback", () => {
      expect(isPrivateRelayUrl("wss://[::1]")).toBe(true)
      expect(isPrivateRelayUrl("wss://::1")).toBe(true)
    })

    it("allows public relay URLs", () => {
      expect(isPrivateRelayUrl("wss://relay.damus.io")).toBe(false)
      expect(isPrivateRelayUrl("wss://nos.lol")).toBe(false)
      expect(isPrivateRelayUrl("wss://relay.example.com")).toBe(false)
    })

    it("allows 172.x outside private range", () => {
      expect(isPrivateRelayUrl("wss://172.15.0.1")).toBe(false)
      expect(isPrivateRelayUrl("wss://172.32.0.1")).toBe(false)
    })
  })

  describe("validateRelayPolicy", () => {
    it("rejects private IP relay in policy", () => {
      const policy = {
        groupId: "test-group",
        relays: [createRelayEntry({url: "wss://192.168.1.1", role: "read-write"})],
      }
      const result = validateRelayPolicy(policy)
      expect(result.ok).toBe(false)
      expect(result.errors.some(e => e.includes("Private/internal"))).toBe(true)
    })

    it("accepts public relay URL in policy", () => {
      const policy = {
        groupId: "test-group",
        relays: [createRelayEntry({url: "wss://relay.damus.io", role: "read-write"})],
      }
      const result = validateRelayPolicy(policy)
      expect(result.ok).toBe(true)
    })
  })
})
