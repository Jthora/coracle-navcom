import {describe, expect, it} from "vitest"
import {
  createRelaySizeHintCache,
  evaluateRelayPayloadBudgets,
  readRelayMaxEventBytesFromMetadata,
  selectViableRelaysForPayload,
} from "../../../../src/engine/pqc/relay-payload-budget"

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

describe("engine/pqc/relay-payload-budget", () => {
  it("reads relay max event bytes from relay metadata variants", () => {
    expect(readRelayMaxEventBytesFromMetadata({max_event_bytes: 8192})).toBe(8192)
    expect(
      readRelayMaxEventBytesFromMetadata({
        limitation: {max_event_bytes: 6144},
      }),
    ).toBe(6144)
    expect(
      readRelayMaxEventBytesFromMetadata({
        limitation: {max_message_length: 4096},
      }),
    ).toBe(4096)
    expect(readRelayMaxEventBytesFromMetadata({})).toBeNull()
  })

  it("caches and replaces relay size hints by relay url", () => {
    const cache = createRelaySizeHintCache({storage: createMemoryStorage(), limit: 10})

    cache.set({
      relay: "wss://relay.example",
      maxEventBytes: 4096,
      updatedAt: 100,
      source: "nip11",
    })

    cache.set({
      relay: "wss://relay.example",
      maxEventBytes: 8192,
      updatedAt: 110,
      source: "cache",
    })

    expect(cache.getAll()).toHaveLength(1)
    expect(cache.getByRelay("wss://relay.example")?.maxEventBytes).toBe(8192)
  })

  it("evaluates relay budgets against payload bytes", () => {
    const evaluations = evaluateRelayPayloadBudgets({
      relays: ["wss://a", "wss://b"],
      payloadBytes: 5000,
      hintsByRelay: {"wss://a": 6000, "wss://b": 4096},
      defaultUnknownRelayBudgetBytes: 4096,
    })

    expect(evaluations).toMatchObject([
      {relay: "wss://a", fits: true, reason: "WITHIN_BUDGET"},
      {relay: "wss://b", fits: false, reason: "OVER_BUDGET"},
    ])
  })

  it("selects viable relays and reports blocked relays", () => {
    const result = selectViableRelaysForPayload({
      relays: ["wss://a", "wss://b", "wss://c"],
      payloadBytes: 4500,
      hintsByRelay: {"wss://a": 5000, "wss://b": 4000},
      defaultUnknownRelayBudgetBytes: 6000,
    })

    expect(result.hasViableRelay).toBe(true)
    expect(result.viableRelays).toEqual(["wss://a", "wss://c"])
    expect(result.blockedRelays).toEqual(["wss://b"])
  })
})
