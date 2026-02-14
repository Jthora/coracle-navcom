import {describe, expect, it} from "vitest"
import {__test, createQueryKey, getCachePolicy, queryKeyToString} from "../../../src/engine/cache"

describe("cache query key", () => {
  it("creates stable feed hashes for object key order differences", () => {
    const first = createQueryKey({
      surface: "feed",
      feedDefinition: ["intersection", {kinds: [1], tags: {b: 2, a: 1}}],
      options: {showControls: true, maxDepth: 2},
    })

    const second = createQueryKey({
      surface: "feed",
      feedDefinition: ["intersection", {tags: {a: 1, b: 2}, kinds: [1]}],
      options: {maxDepth: 2, showControls: true},
    })

    expect(first.feedHash).toBe(second.feedHash)
    expect(first.optionsHash).toBe(second.optionsHash)
    expect(queryKeyToString(first)).toBe(queryKeyToString(second))
  })

  it("changes hash when feed definition changes", () => {
    const first = createQueryKey({surface: "feed", feedDefinition: ["intersection", {kinds: [1]}]})
    const second = createQueryKey({
      surface: "feed",
      feedDefinition: ["intersection", {kinds: [1, 6]}],
    })

    expect(first.feedHash).not.toBe(second.feedHash)
  })

  it("uses surface and account in key string", () => {
    const key = createQueryKey({
      surface: "map",
      accountPubkey: "abc123",
      feedDefinition: ["intersection", {kinds: [1]}],
      options: {intelTag: "starcom_intel"},
    })

    expect(queryKeyToString(key)).toContain("map")
    expect(queryKeyToString(key)).toContain("abc123")
  })
})

describe("cache policy", () => {
  it("returns default feed policy", () => {
    const policy = getCachePolicy("feed")

    expect(policy.mode).toBe("swr")
    expect(policy.ttlSeconds).toBeGreaterThan(0)
    expect(policy.maxItems).toBeGreaterThan(0)
  })

  it("returns cloned policy objects", () => {
    const one = getCachePolicy("feed")
    const two = getCachePolicy("feed")

    one.ttlSeconds = 1

    expect(two.ttlSeconds).not.toBe(1)
  })
})

describe("cache hash helpers", () => {
  it("hashes deterministically", () => {
    const first = __test.hashString("navcom")
    const second = __test.hashString("navcom")

    expect(first).toBe(second)
  })
})
