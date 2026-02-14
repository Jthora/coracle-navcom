import {describe, expect, it} from "vitest"
import {rankEventByRetentionClass} from "../../../src/engine/storage"

type TestEvent = {
  id: string
  created_at: number
}

const nowSeconds = 1_000_000

describe("storage retention ranking", () => {
  it("drops events marked as drop class", () => {
    const rank = rankEventByRetentionClass(
      {id: "drop", created_at: nowSeconds - 10} as TestEvent as any,
      "drop",
      nowSeconds,
    )

    expect(rank).toBe(0)
  })

  it("prioritizes class weight before freshness", () => {
    const lowRecent = rankEventByRetentionClass(
      {id: "low", created_at: nowSeconds - 5} as TestEvent as any,
      "low",
      nowSeconds,
    )

    const highOlder = rankEventByRetentionClass(
      {id: "high", created_at: nowSeconds - 60} as TestEvent as any,
      "high",
      nowSeconds,
    )

    expect(highOlder).toBeGreaterThan(lowRecent)
  })

  it("ranks newer events higher within same class", () => {
    const older = rankEventByRetentionClass(
      {id: "old", created_at: nowSeconds - 120} as TestEvent as any,
      "medium",
      nowSeconds,
    )

    const newer = rankEventByRetentionClass(
      {id: "new", created_at: nowSeconds - 30} as TestEvent as any,
      "medium",
      nowSeconds,
    )

    expect(newer).toBeGreaterThan(older)
  })
})
