import {describe, it, expect, beforeEach, vi, afterEach} from "vitest"
import {EventDedup} from "src/engine/event-dedup"

describe("EventDedup", () => {
  let dedup: EventDedup

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-21T12:00:00Z"))
    dedup = new EventDedup(5, 600)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("accepts a new event and rejects duplicates", () => {
    const now = Math.floor(Date.now() / 1000)

    expect(dedup.add("event-1", now)).toBe(true)
    expect(dedup.add("event-1", now)).toBe(false)
    expect(dedup.size).toBe(1)
  })

  it("rejects events with created_at too far in the past", () => {
    const now = Math.floor(Date.now() / 1000)
    const stale = now - 700 // 700s ago, exceeds 600s window

    expect(dedup.add("stale-event", stale)).toBe(false)
    expect(dedup.size).toBe(0)
  })

  it("rejects events with created_at too far in the future", () => {
    const now = Math.floor(Date.now() / 1000)
    const future = now + 700

    expect(dedup.add("future-event", future)).toBe(false)
    expect(dedup.size).toBe(0)
  })

  it("accepts events within the time window", () => {
    const now = Math.floor(Date.now() / 1000)

    expect(dedup.add("recent-1", now - 300)).toBe(true)
    expect(dedup.add("recent-2", now + 300)).toBe(true)
    expect(dedup.size).toBe(2)
  })

  it("evicts oldest entry when at capacity", () => {
    const now = Math.floor(Date.now() / 1000)

    dedup.add("e1", now - 100)
    dedup.add("e2", now - 80)
    dedup.add("e3", now - 60)
    dedup.add("e4", now - 40)
    dedup.add("e5", now - 20)

    expect(dedup.size).toBe(5)

    // Adding a 6th should evict e1 (oldest)
    dedup.add("e6", now)
    expect(dedup.size).toBe(5)
    expect(dedup.has("e1")).toBe(false)
    expect(dedup.has("e6")).toBe(true)
  })

  it("clear removes all entries", () => {
    const now = Math.floor(Date.now() / 1000)
    dedup.add("x1", now)
    dedup.add("x2", now)
    dedup.clear()
    expect(dedup.size).toBe(0)
  })

  it("logs replay attempts with relay context", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const now = Math.floor(Date.now() / 1000)

    dedup.add("replay-1", now, "wss://relay.example")
    dedup.add("replay-1", now, "wss://relay.example") // duplicate

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("[SecurityAudit] Replay detected"))
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("relay.example"))

    warnSpy.mockRestore()
  })

  it("logs stale event rejection with drift info", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const now = Math.floor(Date.now() / 1000)

    dedup.add("old-event", now - 700) // exceeds 600s window

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[SecurityAudit] Stale/future event rejected"),
    )

    warnSpy.mockRestore()
  })

  it("save and load are no-ops when persistence is disabled", async () => {
    const now = Math.floor(Date.now() / 1000)
    dedup.add("persist-test", now)

    // Should not throw — just silently no-op
    await dedup.save()
    dedup.clear()
    await dedup.load()
    expect(dedup.size).toBe(0) // Not restored because persist=false
  })
})
