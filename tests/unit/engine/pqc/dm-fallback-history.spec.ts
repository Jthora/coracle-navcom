import {describe, expect, it} from "vitest"
import {createPqcDmFallbackHistory} from "../../../../src/engine/pqc/dm-fallback-history"

const createMemoryStorage = () => {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}

describe("engine/pqc/dm-fallback-history", () => {
  it("records and returns fallback entries in reverse chronological order", () => {
    const storage = createMemoryStorage()
    const history = createPqcDmFallbackHistory({storage, key: "test-history", limit: 5})

    history.record({
      direction: "send",
      mode: "classical-fallback",
      reason: "DM_KEY_UNAVAILABLE",
      timestamp: 10,
      peerPubkey: "peer-1",
    })

    history.record({
      direction: "receive",
      mode: "legacy-fallback",
      reason: "DM_ENVELOPE_PARSE_JSON_INVALID",
      timestamp: 20,
      peerPubkey: "peer-2",
    })

    const entries = history.getAll()

    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({timestamp: 20, direction: "receive"})
    expect(entries[1]).toMatchObject({timestamp: 10, direction: "send"})
  })

  it("enforces history limit and supports clearing", () => {
    const storage = createMemoryStorage()
    const history = createPqcDmFallbackHistory({storage, key: "test-history-limit", limit: 2})

    history.record({direction: "send", mode: "a", reason: "r1", timestamp: 1})
    history.record({direction: "send", mode: "b", reason: "r2", timestamp: 2})
    history.record({direction: "send", mode: "c", reason: "r3", timestamp: 3})

    expect(history.getAll().map(entry => entry.mode)).toEqual(["c", "b"])

    history.clear()
    expect(history.getAll()).toEqual([])
  })
})
