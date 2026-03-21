import {describe, it, expect, beforeEach, vi} from "vitest"
import {
  isValidLocalRelayUrl,
  getLocalRelayUrl,
  setLocalRelayUrl,
  getAllLocalRelayUrls,
  isLocalRelay,
  ingestDiscoveredRelays,
  getConnectedLocalRelays,
  clearDiscoveredRelays,
  _resetForTest,
} from "src/engine/relay/local-relay"

// Mock Pool so connectLocalRelays doesn't actually open sockets
vi.mock("@welshman/net", () => ({
  Pool: {
    get: () => ({
      get: vi.fn(),
    }),
  },
}))

describe("local-relay", () => {
  beforeEach(() => {
    _resetForTest()
    localStorage.clear()
  })

  describe("isValidLocalRelayUrl", () => {
    it("accepts ws:// URL on private IP", () => {
      expect(isValidLocalRelayUrl("ws://192.168.1.100:7777")).toBe(true)
    })

    it("accepts wss:// URL on .local hostname", () => {
      expect(isValidLocalRelayUrl("wss://relay.local:443")).toBe(true)
    })

    it("accepts ws://localhost", () => {
      expect(isValidLocalRelayUrl("ws://localhost:7777")).toBe(true)
    })

    it("accepts ws://10.x.x.x (RFC 1918)", () => {
      expect(isValidLocalRelayUrl("ws://10.0.0.1:4444")).toBe(true)
    })

    it("accepts ws://172.16-31.x.x (RFC 1918)", () => {
      expect(isValidLocalRelayUrl("ws://172.16.0.1:4444")).toBe(true)
      expect(isValidLocalRelayUrl("ws://172.31.255.255:4444")).toBe(true)
    })

    it("accepts ws://127.0.0.1 (loopback)", () => {
      expect(isValidLocalRelayUrl("ws://127.0.0.1:4444")).toBe(true)
    })

    it("rejects public IP (SSRF prevention)", () => {
      expect(isValidLocalRelayUrl("wss://attacker.com:443")).toBe(false)
    })

    it("rejects public IP address", () => {
      expect(isValidLocalRelayUrl("ws://1.2.3.4:7777")).toBe(false)
    })

    it("rejects http:// URL", () => {
      expect(isValidLocalRelayUrl("http://192.168.1.100:7777")).toBe(false)
    })

    it("rejects empty URL", () => {
      expect(isValidLocalRelayUrl("")).toBe(false)
    })

    it("rejects garbage", () => {
      expect(isValidLocalRelayUrl("not a url")).toBe(false)
    })
  })

  describe("setLocalRelayUrl / getLocalRelayUrl", () => {
    it("returns null when no URL is set", () => {
      expect(getLocalRelayUrl()).toBe(null)
    })

    it("stores and retrieves a URL", () => {
      setLocalRelayUrl("ws://192.168.1.50:7777")
      expect(getLocalRelayUrl()).toBe("ws://192.168.1.50:7777")
    })

    it("rejects invalid URLs", () => {
      setLocalRelayUrl("not valid")
      expect(getLocalRelayUrl()).toBe(null)
    })

    it("clears URL when set to null", () => {
      setLocalRelayUrl("ws://192.168.1.50:7777")
      setLocalRelayUrl(null)
      expect(getLocalRelayUrl()).toBe(null)
    })

    it("persists in localStorage", () => {
      setLocalRelayUrl("ws://10.0.0.1:4444")
      expect(localStorage.getItem("navcom/local-relay-url")).toBe("ws://10.0.0.1:4444")
    })
  })

  describe("getAllLocalRelayUrls", () => {
    it("returns empty when nothing configured", () => {
      expect(getAllLocalRelayUrls()).toEqual([])
    })

    it("returns configured URL", () => {
      setLocalRelayUrl("ws://192.168.1.50:7777")
      expect(getAllLocalRelayUrls()).toContain("ws://192.168.1.50:7777")
    })

    it("includes discovered relays", () => {
      ingestDiscoveredRelays([{url: "ws://10.0.0.5:8080", host: "10.0.0.5", port: 8080}])
      expect(getAllLocalRelayUrls()).toContain("ws://10.0.0.5:8080")
    })

    it("deduplicates configured and discovered", () => {
      setLocalRelayUrl("ws://10.0.0.5:8080")
      ingestDiscoveredRelays([{url: "ws://10.0.0.5:8080", host: "10.0.0.5", port: 8080}])
      expect(getAllLocalRelayUrls().length).toBe(1)
    })
  })

  describe("isLocalRelay", () => {
    it("returns false for unknown URL", () => {
      expect(isLocalRelay("ws://random.com:1234")).toBe(false)
    })

    it("returns true for configured URL", () => {
      setLocalRelayUrl("ws://192.168.1.1:7777")
      expect(isLocalRelay("ws://192.168.1.1:7777")).toBe(true)
    })
  })

  describe("ingestDiscoveredRelays", () => {
    it("returns count of newly added relays", () => {
      const count = ingestDiscoveredRelays([
        {url: "ws://10.0.0.1:7777", host: "10.0.0.1", port: 7777},
        {url: "ws://10.0.0.2:7777", host: "10.0.0.2", port: 7777},
      ])
      expect(count).toBe(2)
    })

    it("deduplicates on repeat ingestion", () => {
      ingestDiscoveredRelays([{url: "ws://10.0.0.1:7777", host: "10.0.0.1", port: 7777}])
      const count = ingestDiscoveredRelays([
        {url: "ws://10.0.0.1:7777", host: "10.0.0.1", port: 7777},
      ])
      expect(count).toBe(0)
    })

    it("constructs URL from host+port when url missing", () => {
      const count = ingestDiscoveredRelays([{url: "", host: "192.168.1.5", port: 4444}])
      expect(count).toBe(1)
      expect(getAllLocalRelayUrls()).toContain("ws://192.168.1.5:4444")
    })

    it("skips invalid URLs", () => {
      const count = ingestDiscoveredRelays([{url: "not valid", host: "", port: 0}])
      expect(count).toBe(0)
    })
  })

  describe("clearDiscoveredRelays", () => {
    it("clears all discovered relays", () => {
      ingestDiscoveredRelays([{url: "ws://10.0.0.1:7777", host: "10.0.0.1", port: 7777}])
      clearDiscoveredRelays()
      // After clearing discoveries, only configured URL remains
      expect(getAllLocalRelayUrls()).toEqual([])
    })
  })

  describe("getConnectedLocalRelays", () => {
    it("returns empty initially", () => {
      expect(getConnectedLocalRelays()).toEqual([])
    })
  })
})
