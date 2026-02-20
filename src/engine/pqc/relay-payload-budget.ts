export type RelaySizeHint = {
  relay: string
  maxEventBytes: number
  updatedAt: number
  source: "cache" | "nip11"
}

export type RelayPayloadBudgetEvaluation = {
  relay: string
  budgetBytes: number
  payloadBytes: number
  fits: boolean
  reason: "WITHIN_BUDGET" | "OVER_BUDGET"
}

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const asPositiveInteger = (value: unknown) => {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

const parseRelayHints = (raw: string | null): RelaySizeHint[] => {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((entry): entry is RelaySizeHint => {
      const candidate = asRecord(entry)

      return (
        !!candidate &&
        typeof candidate.relay === "string" &&
        asPositiveInteger(candidate.maxEventBytes) !== null &&
        asPositiveInteger(candidate.updatedAt) !== null &&
        (candidate.source === "cache" || candidate.source === "nip11")
      )
    })
  } catch {
    return []
  }
}

export const readRelayMaxEventBytesFromMetadata = (metadata: unknown) => {
  const candidate = asRecord(metadata)

  if (!candidate) {
    return null
  }

  const direct = asPositiveInteger(candidate.max_event_bytes)

  if (direct) {
    return direct
  }

  const limitation = asRecord(candidate.limitation)

  if (!limitation) {
    return null
  }

  return (
    asPositiveInteger(limitation.max_event_bytes) ||
    asPositiveInteger(limitation.max_message_length) ||
    null
  )
}

export const createRelaySizeHintCache = ({
  storage,
  key = "pqc_relay_size_hints",
  limit = 200,
}: {
  storage?: StorageLike | null
  key?: string
  limit?: number
} = {}) => {
  const getAll = () => {
    if (!storage) {
      return []
    }

    return parseRelayHints(storage.getItem(key))
  }

  const set = (hint: RelaySizeHint) => {
    if (!storage || !hint.relay || hint.maxEventBytes <= 0 || hint.updatedAt <= 0) {
      return
    }

    const next = [hint, ...getAll().filter(entry => entry.relay !== hint.relay)].slice(
      0,
      Math.max(1, limit),
    )

    storage.setItem(key, JSON.stringify(next))
  }

  const getByRelay = (relay: string) => getAll().find(entry => entry.relay === relay) || null

  const clear = () => {
    storage?.removeItem(key)
  }

  return {
    getAll,
    getByRelay,
    set,
    clear,
  }
}

const defaultStorage =
  typeof globalThis !== "undefined" && "localStorage" in globalThis
    ? (globalThis.localStorage as StorageLike)
    : null

const defaultCache = createRelaySizeHintCache({storage: defaultStorage})

export const cacheRelaySizeHint = (hint: RelaySizeHint) => {
  defaultCache.set(hint)
}

export const getCachedRelaySizeHint = (relay: string) => defaultCache.getByRelay(relay)

export const evaluateRelayPayloadBudgets = ({
  relays,
  payloadBytes,
  hintsByRelay,
  defaultUnknownRelayBudgetBytes,
}: {
  relays: string[]
  payloadBytes: number
  hintsByRelay: Record<string, number>
  defaultUnknownRelayBudgetBytes: number
}): RelayPayloadBudgetEvaluation[] =>
  relays.map(relay => {
    const budgetBytes =
      asPositiveInteger(hintsByRelay[relay]) ||
      asPositiveInteger(defaultUnknownRelayBudgetBytes) ||
      4096

    const fits = payloadBytes <= budgetBytes

    return {
      relay,
      budgetBytes,
      payloadBytes,
      fits,
      reason: fits ? "WITHIN_BUDGET" : "OVER_BUDGET",
    }
  })

export const selectViableRelaysForPayload = ({
  relays,
  payloadBytes,
  hintsByRelay,
  defaultUnknownRelayBudgetBytes = 4096,
}: {
  relays: string[]
  payloadBytes: number
  hintsByRelay: Record<string, number>
  defaultUnknownRelayBudgetBytes?: number
}) => {
  const evaluations = evaluateRelayPayloadBudgets({
    relays,
    payloadBytes,
    hintsByRelay,
    defaultUnknownRelayBudgetBytes,
  })

  const viableRelays = evaluations.filter(entry => entry.fits).map(entry => entry.relay)

  return {
    viableRelays,
    blockedRelays: evaluations.filter(entry => !entry.fits).map(entry => entry.relay),
    evaluations,
    hasViableRelay: viableRelays.length > 0,
  }
}
