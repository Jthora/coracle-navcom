import {makeFeedController} from "@welshman/app"
import type {Feed as FeedDefinition, FeedController} from "@welshman/feeds"
import type {TrustedEvent} from "@welshman/util"
import {getCachePolicy, queryKeyToString} from "src/engine/cache"
import type {CachePolicy, QueryKey} from "src/engine/cache"

export type QueryResult<TEvent> = {
  source: "cache" | "network" | "mixed"
  stale: boolean
  lastSyncAt?: number
  events: TEvent[]
}

export type FeedDataStream = {
  load: (size: number) => Promise<void>
  abort: () => void
}

export type CreateFeedDataStreamInput = {
  key: QueryKey
  sharedKey?: string
  feed: FeedDefinition
  useWindowing: boolean
  signal?: AbortSignal
  policy?: CachePolicy
  onEvent?: (event: TrustedEvent) => void
  onExhausted?: () => void
  onResult?: (result: QueryResult<TrustedEvent>) => void
}

type QueryCacheEntry = {
  events: TrustedEvent[]
  lastSyncAt?: number
}

const queryCache = new Map<string, QueryCacheEntry>()

const dedupeAndSortEvents = (events: TrustedEvent[], maxItems: number) => {
  const byId = new Map<string, TrustedEvent>()

  for (const event of events) {
    byId.set(event.id, event)
  }

  return Array.from(byId.values())
    .sort((a, b) => b.created_at - a.created_at || b.id.localeCompare(a.id))
    .slice(0, maxItems)
}

const toStale = (entry: QueryCacheEntry, policy: CachePolicy) => {
  if (!entry.lastSyncAt) {
    return true
  }

  return Date.now() - entry.lastSyncAt > policy.ttlSeconds * 1000
}

export const createFeedDataStream = ({
  key,
  sharedKey,
  feed,
  useWindowing,
  signal,
  onEvent,
  onExhausted,
  onResult,
  policy = getCachePolicy(key.surface),
}: CreateFeedDataStreamInput): FeedDataStream => {
  const keyString = queryKeyToString(key)
  const cacheKey = sharedKey || keyString
  const cachedEntry = queryCache.get(cacheKey)

  if (cachedEntry && cachedEntry.events.length > 0) {
    onResult?.({
      source: "cache",
      stale: toStale(cachedEntry, policy),
      lastSyncAt: cachedEntry.lastSyncAt,
      events: cachedEntry.events,
    })
  }

  const hadSnapshot = Boolean(cachedEntry && cachedEntry.events.length > 0)

  const ctrl: FeedController = makeFeedController({
    feed,
    useWindowing,
    signal,
    onEvent: event => {
      onEvent?.(event)

      const entry = queryCache.get(cacheKey) || {events: []}
      const events = dedupeAndSortEvents(entry.events.concat(event), policy.maxItems)
      const lastSyncAt = Date.now()

      queryCache.set(cacheKey, {events, lastSyncAt})

      onResult?.({
        source: hadSnapshot ? "mixed" : "network",
        stale: false,
        lastSyncAt,
        events,
      })
    },
    onExhausted: () => {
      onExhausted?.()
    },
  })

  return {
    load: size => ctrl.load(size),
    abort: () => {},
  }
}

export const clearFeedDataServiceCache = () => {
  queryCache.clear()
}

export const __testFeedDataService = {
  dedupeAndSortEvents,
  toStale,
}
