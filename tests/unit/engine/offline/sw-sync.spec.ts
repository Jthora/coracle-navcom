import {describe, it, expect, vi} from "vitest"
import {
  isBackgroundSyncSupported,
  requestBackgroundSync,
  getSyncTag,
} from "src/engine/offline/sw-sync"

describe("sw-sync", () => {
  describe("getSyncTag", () => {
    it("returns the expected tag string", () => {
      expect(getSyncTag()).toBe("navcom-outbox-drain")
    })
  })

  describe("isBackgroundSyncSupported", () => {
    it("returns false in test environment (no SyncManager)", () => {
      expect(isBackgroundSyncSupported()).toBe(false)
    })
  })

  describe("requestBackgroundSync", () => {
    it("returns false when Background Sync is unsupported", async () => {
      const result = await requestBackgroundSync()
      expect(result).toBe(false)
    })
  })
})
