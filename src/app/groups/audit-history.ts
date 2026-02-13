import type {GroupAuditEvent, GroupProjection} from "src/domain/group"

export const DEFAULT_AUDIT_PAGE_SIZE = 10

export type GroupAuditActorFilter = "all" | "self" | "system" | "known" | "unknown"

export type GroupAuditFilter = {
  action: string
  actor: GroupAuditActorFilter
}

export type GroupAuditViewOptions = {
  actorPubkey?: string
  cursor?: number
  pageSize?: number
  filter?: Partial<GroupAuditFilter>
}

export type GroupAuditActionOption = {
  value: string
  label: string
  count: number
}

export type GroupAuditActorOption = {
  value: GroupAuditActorFilter
  label: string
  count: number
}

export type GroupAuditItemView = {
  action: string
  actor: string
  actorLabel: string
  createdAt: number
  reason?: string
  eventId?: string
}

export type GroupAuditHistoryView = {
  items: GroupAuditItemView[]
  total: number
  actions: GroupAuditActionOption[]
  actors: GroupAuditActorOption[]
  hasMore: boolean
  nextCursor: number
  cursor: number
  pageSize: number
  filter: GroupAuditFilter
}

const normalizeActionFilter = (value?: string) => (value && value.trim() ? value.trim() : "all")

const normalizeActorFilter = (value?: GroupAuditActorFilter): GroupAuditActorFilter => {
  if (!value) return "all"

  if (
    value === "all" ||
    value === "self" ||
    value === "system" ||
    value === "known" ||
    value === "unknown"
  ) {
    return value
  }

  return "all"
}

const normalizePageSize = (value?: number) => {
  if (!value || Number.isNaN(value)) return DEFAULT_AUDIT_PAGE_SIZE

  return Math.max(1, Math.min(100, Math.floor(value)))
}

const normalizeCursor = (value?: number) => {
  if (!value || Number.isNaN(value)) return 0

  return Math.max(0, Math.floor(value))
}

const toSortedAuditEvents = (audit: GroupAuditEvent[]) =>
  [...audit].sort((first, second) => {
    if (first.createdAt !== second.createdAt) return second.createdAt - first.createdAt

    return (second.eventId || "").localeCompare(first.eventId || "")
  })

const isKnownActor = (projection: GroupProjection, actor: string) => !!projection.members[actor]

const isActorMatch = (
  projection: GroupProjection,
  entry: GroupAuditEvent,
  actorFilter: GroupAuditActorFilter,
  actorPubkey?: string,
) => {
  if (actorFilter === "all") return true
  if (actorFilter === "self") return !!actorPubkey && entry.actor === actorPubkey
  if (actorFilter === "system") return entry.actor === "system"
  if (actorFilter === "known") return isKnownActor(projection, entry.actor)

  return entry.actor !== "system" && !isKnownActor(projection, entry.actor)
}

const isActionMatch = (entry: GroupAuditEvent, actionFilter: string) =>
  actionFilter === "all" || entry.action === actionFilter

const toActorLabel = (projection: GroupProjection, actor: string, actorPubkey?: string) => {
  if (actor === "system") return "System"
  if (actorPubkey && actor === actorPubkey) {
    const ownRole = projection.members[actorPubkey]?.role

    return ownRole ? `You (${ownRole})` : "You"
  }

  const member = projection.members[actor]

  if (member) {
    return `${member.role} · ${actor.slice(0, 8)}…${actor.slice(-6)}`
  }

  return actor.slice(0, 8) + "…" + actor.slice(-6)
}

const toActionOptions = (entries: GroupAuditEvent[]): GroupAuditActionOption[] => {
  const counts = new Map<string, number>()

  for (const entry of entries) {
    counts.set(entry.action, (counts.get(entry.action) || 0) + 1)
  }

  const options = Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
    .sort((first, second) => second.count - first.count || first.value.localeCompare(second.value))

  return [{value: "all", label: "All actions", count: entries.length}, ...options]
}

const toActorOptions = (
  projection: GroupProjection,
  entries: GroupAuditEvent[],
  actorPubkey?: string,
): GroupAuditActorOption[] => {
  let selfCount = 0
  let systemCount = 0
  let knownCount = 0
  let unknownCount = 0

  for (const entry of entries) {
    if (actorPubkey && entry.actor === actorPubkey) {
      selfCount += 1
      continue
    }

    if (entry.actor === "system") {
      systemCount += 1
      continue
    }

    if (isKnownActor(projection, entry.actor)) {
      knownCount += 1
      continue
    }

    unknownCount += 1
  }

  return [
    {value: "all", label: "All actors", count: entries.length},
    {value: "self", label: "You", count: selfCount},
    {value: "system", label: "System", count: systemCount},
    {value: "known", label: "Known members", count: knownCount},
    {value: "unknown", label: "External/unknown", count: unknownCount},
  ]
}

export const createDefaultGroupAuditFilter = (): GroupAuditFilter => ({
  action: "all",
  actor: "all",
})

export const createGroupAuditHistoryView = (
  projection: GroupProjection,
  {actorPubkey, cursor, pageSize, filter}: GroupAuditViewOptions = {},
): GroupAuditHistoryView => {
  const normalizedFilter = {
    action: normalizeActionFilter(filter?.action),
    actor: normalizeActorFilter(filter?.actor),
  }

  const sortedEntries = toSortedAuditEvents(projection.audit)
  const filteredEntries = sortedEntries.filter(
    entry =>
      isActionMatch(entry, normalizedFilter.action) &&
      isActorMatch(projection, entry, normalizedFilter.actor, actorPubkey),
  )

  const normalizedCursor = normalizeCursor(cursor)
  const normalizedPageSize = normalizePageSize(pageSize)
  const pagedEntries = filteredEntries.slice(
    normalizedCursor,
    normalizedCursor + normalizedPageSize,
  )

  return {
    items: pagedEntries.map(entry => ({
      action: entry.action,
      actor: entry.actor,
      actorLabel: toActorLabel(projection, entry.actor, actorPubkey),
      createdAt: entry.createdAt,
      reason: entry.reason,
      eventId: entry.eventId,
    })),
    total: filteredEntries.length,
    actions: toActionOptions(sortedEntries),
    actors: toActorOptions(projection, sortedEntries, actorPubkey),
    hasMore: normalizedCursor + normalizedPageSize < filteredEntries.length,
    nextCursor: Math.min(filteredEntries.length, normalizedCursor + normalizedPageSize),
    cursor: normalizedCursor,
    pageSize: normalizedPageSize,
    filter: normalizedFilter,
  }
}
