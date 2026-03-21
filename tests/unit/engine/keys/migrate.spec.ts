import {describe, it, expect, beforeEach} from "vitest"
import {hasLegacyKeys} from "src/engine/keys/migrate"

describe("migrate", () => {
  let store: Map<string, string>

  beforeEach(() => {
    store = new Map<string, string>()
    // Minimal localStorage mock
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
        get length() {
          return store.size
        },
        key: (i: number) => [...store.keys()][i] ?? null,
      },
      writable: true,
      configurable: true,
    })
  })

  describe("hasLegacyKeys", () => {
    it("returns false when no legacy keys exist", () => {
      expect(hasLegacyKeys()).toBe(false)
    })

    it("detects Nostr session secrets", () => {
      store.set("sessions", JSON.stringify([{pubkey: "abc", secret: "deadbeef"}]))
      expect(hasLegacyKeys()).toBe(true)
    })

    it("detects PQC secret keys", () => {
      store.set("pqc-key-secret:abc:key1", "base64data")
      expect(hasLegacyKeys()).toBe(true)
    })

    it("ignores sessions without secrets", () => {
      store.set("sessions", JSON.stringify([{pubkey: "abc", method: "nip07"}]))
      expect(hasLegacyKeys()).toBe(false)
    })

    it("handles malformed session data", () => {
      store.set("sessions", "not-json!")
      expect(hasLegacyKeys()).toBe(false)
    })
  })
})
