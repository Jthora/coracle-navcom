import {describe, it, expect, vi, beforeEach, afterEach} from "vitest"
import {get} from "svelte/store"

// We need to re-import the module fresh for each test group.
// The module uses module-level state (navigator.onLine at init time),
// so we mock before importing.

describe("engine/connection-state", () => {
  let mod: typeof import("src/engine/connection-state")
  let originalNavigator: PropertyDescriptor | undefined

  beforeEach(() => {
    vi.useFakeTimers()
    // Default: online
    originalNavigator = Object.getOwnPropertyDescriptor(navigator, "onLine")
    Object.defineProperty(navigator, "onLine", {value: true, writable: true, configurable: true})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    if (originalNavigator) {
      Object.defineProperty(navigator, "onLine", originalNavigator)
    } else {
      Object.defineProperty(navigator, "onLine", {value: true, writable: true, configurable: true})
    }
  })

  // Helper to dispatch online/offline events
  function goOffline() {
    Object.defineProperty(navigator, "onLine", {value: false, writable: true, configurable: true})
    window.dispatchEvent(new Event("offline"))
  }

  function goOnline() {
    Object.defineProperty(navigator, "onLine", {value: true, writable: true, configurable: true})
    window.dispatchEvent(new Event("online"))
  }

  describe("store initialization", () => {
    it("initializes to connected when navigator.onLine is true", async () => {
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      })
      // Dynamic import to get fresh module state
      vi.resetModules()
      mod = await import("src/engine/connection-state")
      const state = get(mod.connectionState)
      expect(state.mode).toBe("connected")
      expect(state.queuedCount).toBe(0)
      expect(state.since).toBeGreaterThan(0)
      expect(state.lastConnectedAt).toBeGreaterThan(0)
    })

    it("initializes to sovereign when navigator.onLine is false", async () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
        configurable: true,
      })
      vi.resetModules()
      mod = await import("src/engine/connection-state")
      const state = get(mod.connectionState)
      expect(state.mode).toBe("sovereign")
    })
  })

  describe("isSovereign derived store", () => {
    it("reflects connection mode", async () => {
      vi.resetModules()
      mod = await import("src/engine/connection-state")
      expect(get(mod.isSovereign)).toBe(false)
      mod.connectionState.update(s => ({...s, mode: "sovereign"}))
      expect(get(mod.isSovereign)).toBe(true)
    })
  })

  describe("transitions with startConnectionMonitor", () => {
    beforeEach(async () => {
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      })
      vi.resetModules()
      mod = await import("src/engine/connection-state")
    })

    it("transitions to sovereign after debounce on offline event", () => {
      const cleanup = mod.startConnectionMonitor()
      expect(get(mod.connectionState).mode).toBe("connected")

      goOffline()
      // Immediately after offline: still connected (debounce)
      expect(get(mod.connectionState).mode).toBe("connected")

      // After debounce period
      vi.advanceTimersByTime(3000)
      expect(get(mod.connectionState).mode).toBe("sovereign")

      cleanup()
    })

    it("transitions to connected immediately on online event", () => {
      const cleanup = mod.startConnectionMonitor()

      // Force sovereign
      goOffline()
      vi.advanceTimersByTime(3000)
      expect(get(mod.connectionState).mode).toBe("sovereign")

      goOnline()
      expect(get(mod.connectionState).mode).toBe("connected")

      cleanup()
    })

    it("does not transition if connection returns within debounce window", () => {
      const cleanup = mod.startConnectionMonitor()

      goOffline()
      vi.advanceTimersByTime(1000)
      goOnline()
      vi.advanceTimersByTime(5000)

      expect(get(mod.connectionState).mode).toBe("connected")

      cleanup()
    })

    it("updates since timestamp on transitions", () => {
      const cleanup = mod.startConnectionMonitor()
      const beforeTransition = Math.floor(Date.now() / 1000)

      goOffline()
      vi.advanceTimersByTime(3000)

      const state = get(mod.connectionState)
      expect(state.since).toBeGreaterThanOrEqual(beforeTransition)

      cleanup()
    })

    it("preserves lastConnectedAt during sovereign mode", () => {
      const cleanup = mod.startConnectionMonitor()
      const lastConnected = get(mod.connectionState).lastConnectedAt

      goOffline()
      vi.advanceTimersByTime(3000)

      expect(get(mod.connectionState).lastConnectedAt).toBe(lastConnected)

      cleanup()
    })

    it("updates lastConnectedAt on connected transition", () => {
      const cleanup = mod.startConnectionMonitor()

      goOffline()
      vi.advanceTimersByTime(3000)
      expect(get(mod.connectionState).mode).toBe("sovereign")

      vi.advanceTimersByTime(10000)
      goOnline()

      const state = get(mod.connectionState)
      expect(state.mode).toBe("connected")
      expect(state.lastConnectedAt).toBeGreaterThanOrEqual(state.since)

      cleanup()
    })
  })

  describe("updateQueuedCount", () => {
    beforeEach(async () => {
      vi.resetModules()
      mod = await import("src/engine/connection-state")
    })

    it("updates store queuedCount", () => {
      mod.updateQueuedCount(5)
      expect(get(mod.connectionState).queuedCount).toBe(5)
    })

    it("clamps negative values to zero", () => {
      mod.updateQueuedCount(-1)
      expect(get(mod.connectionState).queuedCount).toBe(0)
    })
  })
})
