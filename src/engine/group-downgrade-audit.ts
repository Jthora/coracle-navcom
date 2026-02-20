import type {GroupTransportModeId} from "src/engine/group-transport-contracts"

export type GroupDowngradeAuditEntry = {
  groupId: string
  action: "transport-downgrade"
  actor: string
  createdAt: number
  requestedMode: GroupTransportModeId
  resolvedMode: GroupTransportModeId
  reason?: string
}

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const parseHistory = (raw: string | null): GroupDowngradeAuditEntry[] => {
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

export const createGroupDowngradeAuditStore = ({
  storage,
  key = "pqc_group_downgrade_audit",
  limit = 100,
}: {
  storage?: StorageLike | null
  key?: string
  limit?: number
} = {}) => {
  const record = (entry: GroupDowngradeAuditEntry) => {
    if (!storage) {
      return
    }

    const history = parseHistory(storage.getItem(key))
    const next = [entry, ...history].slice(0, Math.max(1, limit))

    storage.setItem(key, JSON.stringify(next))
  }

  const getAll = () => {
    if (!storage) {
      return []
    }

    return parseHistory(storage.getItem(key))
  }

  const getByGroup = (groupId: string) => getAll().filter(entry => entry.groupId === groupId)

  const getLatestByGroup = (groupId: string) => getByGroup(groupId)[0] || null

  const clear = () => {
    storage?.removeItem(key)
  }

  return {
    record,
    getAll,
    getByGroup,
    getLatestByGroup,
    clear,
  }
}

const defaultStorage =
  typeof globalThis !== "undefined" && "localStorage" in globalThis
    ? (globalThis.localStorage as StorageLike)
    : null

const defaultStore = createGroupDowngradeAuditStore({storage: defaultStorage})

export const recordGroupDowngradeAudit = (entry: GroupDowngradeAuditEntry) => {
  defaultStore.record(entry)
}

export const getGroupDowngradeAuditHistory = () => defaultStore.getAll()

export const getLatestGroupDowngradeAudit = (groupId: string) =>
  defaultStore.getLatestByGroup(groupId)

export const clearGroupDowngradeAuditHistory = () => {
  defaultStore.clear()
}
