import {writable} from "svelte/store"

export type QuerySurface = "feed" | "map" | "notifications" | "thread" | "groups"

export type QueryKey = {
  surface: QuerySurface
  accountPubkey?: string
  feedHash: string
  optionsHash?: string
}

export type CacheMode = "swr" | "network-first" | "cache-first"

export type CachePolicy = {
  mode: CacheMode
  ttlSeconds: number
  maxItems: number
  retainKinds?: number[]
  allowStale: boolean
}

export type CacheMetricPhase = "query_start" | "first_event" | "query_exhausted"

export type CacheMetric = {
  phase: CacheMetricPhase
  key: string
  surface: QuerySurface
  timestamp: number
  elapsedMs?: number
  eventCount?: number
  exhausted?: boolean
  details?: Record<string, unknown>
}

export type CreateQueryKeyInput = {
  surface: QuerySurface
  accountPubkey?: string
  feedDefinition?: unknown
  options?: Record<string, unknown>
}

const stableNormalize = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(stableNormalize)
  }

  if (typeof value === "object") {
    const next: Record<string, unknown> = {}

    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      next[key] = stableNormalize((value as Record<string, unknown>)[key])
    }

    return next
  }

  return value
}

const stableStringify = (value: unknown) => JSON.stringify(stableNormalize(value))

const hashString = (value: string) => {
  let hash = 5381

  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) + hash + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash).toString(36)
}

const hashValue = (value: unknown, fallback = "none") => {
  if (value === undefined) {
    return fallback
  }

  return hashString(stableStringify(value))
}

export const createQueryKey = ({
  surface,
  accountPubkey,
  feedDefinition,
  options,
}: CreateQueryKeyInput): QueryKey => ({
  surface,
  accountPubkey,
  feedHash: hashValue(feedDefinition, "empty"),
  optionsHash: options ? hashValue(options, "opts") : undefined,
})

export const queryKeyToString = ({surface, accountPubkey, feedHash, optionsHash}: QueryKey) =>
  [surface, accountPubkey || "anon", feedHash, optionsHash || "noopts"].join(":")

const cachePolicies: Record<QuerySurface, CachePolicy> = {
  feed: {mode: "swr", ttlSeconds: 75, maxItems: 600, allowStale: true},
  map: {mode: "swr", ttlSeconds: 45, maxItems: 500, allowStale: true},
  notifications: {mode: "network-first", ttlSeconds: 20, maxItems: 180, allowStale: true},
  thread: {mode: "swr", ttlSeconds: 120, maxItems: 320, allowStale: true},
  groups: {mode: "swr", ttlSeconds: 90, maxItems: 220, allowStale: true},
}

export const getCachePolicy = (surface: QuerySurface): CachePolicy => ({...cachePolicies[surface]})

export const cacheMetrics = writable<CacheMetric[]>([])

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now())

export const startCacheMetric = (
  key: QueryKey,
  phase: Exclude<CacheMetricPhase, "first_event" | "query_exhausted">,
  details?: Record<string, unknown>,
) => {
  const keyString = queryKeyToString(key)

  cacheMetrics.update(metrics => {
    const next = metrics.concat({
      phase,
      key: keyString,
      surface: key.surface,
      timestamp: Date.now(),
      details,
    })

    return next.slice(-300)
  })

  if (typeof console !== "undefined") {
    console.debug("[cache]", phase, keyString, details || {})
  }

  const startedAt = now()

  return (nextPhase: "first_event" | "query_exhausted", payload: Partial<CacheMetric> = {}) => {
    const elapsedMs = Math.round(now() - startedAt)

    cacheMetrics.update(metrics => {
      const next = metrics.concat({
        phase: nextPhase,
        key: keyString,
        surface: key.surface,
        timestamp: Date.now(),
        elapsedMs,
        ...payload,
      })

      return next.slice(-300)
    })

    if (typeof console !== "undefined") {
      console.debug("[cache]", nextPhase, keyString, {elapsedMs, ...payload})
    }
  }
}

export const __test = {
  stableNormalize,
  stableStringify,
  hashString,
}
