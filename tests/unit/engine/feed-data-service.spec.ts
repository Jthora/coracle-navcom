import {describe, expect, it} from "vitest"
import {__testFeedDataService} from "../../../src/engine/feed-data-service"

type TestEvent = {
  id: string
  created_at: number
}

describe("feed data service helpers", () => {
  it("dedupes by event id and sorts by timestamp desc", () => {
    const events = __testFeedDataService.dedupeAndSortEvents(
      [
        {id: "b", created_at: 100} as any,
        {id: "a", created_at: 100} as any,
        {id: "b", created_at: 200} as any,
        {id: "c", created_at: 150} as any,
      ],
      10,
    ) as TestEvent[]

    expect(events.map(event => event.id)).toEqual(["b", "c", "a"])
    expect(events.map(event => event.created_at)).toEqual([200, 150, 100])
  })

  it("respects max items cap", () => {
    const events = __testFeedDataService.dedupeAndSortEvents(
      [
        {id: "a", created_at: 300} as any,
        {id: "b", created_at: 200} as any,
        {id: "c", created_at: 100} as any,
      ],
      2,
    ) as TestEvent[]

    expect(events.map(event => event.id)).toEqual(["a", "b"])
  })

  it("marks entries stale when ttl elapsed", () => {
    const stale = __testFeedDataService.toStale(
      {events: [] as any[], lastSyncAt: Date.now() - 120_000},
      {mode: "swr", ttlSeconds: 60, maxItems: 100, allowStale: true},
    )

    const fresh = __testFeedDataService.toStale(
      {events: [] as any[], lastSyncAt: Date.now() - 5_000},
      {mode: "swr", ttlSeconds: 60, maxItems: 100, allowStale: true},
    )

    expect(stale).toBe(true)
    expect(fresh).toBe(false)
  })
})
