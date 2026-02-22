export type PqcDmFallbackDirection = "send" | "receive"

export type PqcDmFallbackHistoryEntry = {
  direction: PqcDmFallbackDirection
  mode: string
  reason: string
  timestamp: number
  messageId?: string
  peerPubkey?: string
}

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const parseHistory = (raw: string | null): PqcDmFallbackHistoryEntry[] => {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const createPqcDmFallbackHistory = ({
  storage,
  key = "pqc_dm_fallback_history",
  limit = 100,
}: {
  storage?: StorageLike | null
  key?: string
  limit?: number
} = {}) => {
  const record = (entry: PqcDmFallbackHistoryEntry) => {
    if (!storage) {
      return
    }

    try {
      const history = parseHistory(storage.getItem(key))
      const next = [entry, ...history].slice(0, Math.max(1, limit))

      storage.setItem(key, JSON.stringify(next))
    } catch {
      return
    }
  }

  const getAll = () => {
    if (!storage) {
      return []
    }

    try {
      return parseHistory(storage.getItem(key))
    } catch {
      return []
    }
  }

  const clear = () => {
    try {
      storage?.removeItem(key)
    } catch {
      return
    }
  }

  return {
    record,
    getAll,
    clear,
  }
}

const defaultStorage =
  typeof globalThis !== "undefined" && "localStorage" in globalThis
    ? (globalThis.localStorage as StorageLike)
    : null

const defaultHistory = createPqcDmFallbackHistory({storage: defaultStorage})

export const recordPqcDmFallback = (entry: PqcDmFallbackHistoryEntry) => {
  defaultHistory.record(entry)
}

export const getPqcDmFallbackHistory = () => defaultHistory.getAll()

export const clearPqcDmFallbackHistory = () => {
  defaultHistory.clear()
}
