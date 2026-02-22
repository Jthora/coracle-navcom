export type RelayRole = "read" | "write" | "read-write"
export type RelayHealth = "healthy" | "limited" | "unreachable" | "unknown"

export type RoomRelayPolicyEntry = {
  id: string
  url: string
  role: RelayRole
  isPrivate: boolean
  claim?: string
  health: RelayHealth
  updatedAt: number
}

export type RoomRelayPolicy = {
  groupId: string
  relays: RoomRelayPolicyEntry[]
}

export type RelayPolicyValidation = {
  ok: boolean
  errors: string[]
  warnings: string[]
}

const makePolicyKey = (groupId: string) => `group_relay_policy:${groupId}`

const makeRelayId = () => `relay_${Math.random().toString(36).slice(2, 10)}`

const normalizeRelayUrl = (url: string) => {
  const trimmed = (url || "").trim()
  const lower = trimmed.toLowerCase()

  return lower.replace(/\/+$/, "")
}

export const isValidRelayUrl = (url: string) => /^wss?:\/\/[a-z0-9.-]+(:\d+)?(\/.*)?$/i.test(url)

export const createRelayEntry = (
  input: Partial<Pick<RoomRelayPolicyEntry, "url" | "role" | "isPrivate" | "claim" | "health">>,
): RoomRelayPolicyEntry => ({
  id: makeRelayId(),
  url: normalizeRelayUrl(input.url || ""),
  role: input.role || "read-write",
  isPrivate: Boolean(input.isPrivate),
  claim: (input.claim || "").trim() || undefined,
  health: input.health || "unknown",
  updatedAt: Date.now(),
})

export const createDefaultRoomRelayPolicy = (groupId: string): RoomRelayPolicy => ({
  groupId,
  relays: [
    createRelayEntry({
      url: "wss://relay.example",
      role: "read-write",
      isPrivate: false,
      health: "unknown",
    }),
  ],
})

export const validateRelayPolicy = (policy: RoomRelayPolicy): RelayPolicyValidation => {
  const errors: string[] = []
  const warnings: string[] = []

  const writable = policy.relays.filter(
    relay => relay.role === "write" || relay.role === "read-write",
  )
  const readable = policy.relays.filter(
    relay => relay.role === "read" || relay.role === "read-write",
  )

  if (policy.relays.length === 0) {
    errors.push("Add at least one relay.")
  }

  if (writable.length === 0) {
    errors.push("At least one writable relay is required for posting.")
  }

  if (readable.length === 0) {
    errors.push("At least one readable relay is required for history retrieval.")
  }

  const seen = new Set<string>()

  for (const relay of policy.relays) {
    if (!relay.url) {
      errors.push("Relay URL cannot be empty.")
      continue
    }

    if (!isValidRelayUrl(relay.url)) {
      errors.push(`Invalid relay URL format: ${relay.url}`)
    }

    if (seen.has(relay.url)) {
      warnings.push(`Duplicate relay URL: ${relay.url}`)
    }

    seen.add(relay.url)

    if (relay.isPrivate && !relay.claim) {
      warnings.push(`Private relay ${relay.url} has no claim token configured.`)
    }

    if (relay.health === "unreachable") {
      warnings.push(`Relay ${relay.url} is marked unreachable.`)
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  }
}

export const loadRoomRelayPolicy = (groupId: string): RoomRelayPolicy => {
  if (typeof window === "undefined") {
    return createDefaultRoomRelayPolicy(groupId)
  }

  try {
    const raw = window.localStorage.getItem(makePolicyKey(groupId))

    if (!raw) return createDefaultRoomRelayPolicy(groupId)

    const parsed = JSON.parse(raw) as RoomRelayPolicy

    if (!parsed || parsed.groupId !== groupId || !Array.isArray(parsed.relays)) {
      return createDefaultRoomRelayPolicy(groupId)
    }

    return {
      groupId,
      relays: parsed.relays.map(relay =>
        createRelayEntry({
          url: relay.url,
          role: relay.role,
          isPrivate: relay.isPrivate,
          claim: relay.claim,
          health: relay.health,
        }),
      ),
    }
  } catch (error) {
    return createDefaultRoomRelayPolicy(groupId)
  }
}

export const saveRoomRelayPolicy = (policy: RoomRelayPolicy) => {
  if (typeof window === "undefined") return

  window.localStorage.setItem(makePolicyKey(policy.groupId), JSON.stringify(policy))
}

export const updateRelayEntry = (
  relays: RoomRelayPolicyEntry[],
  relayId: string,
  updates: Partial<Omit<RoomRelayPolicyEntry, "id">>,
) =>
  relays.map(relay =>
    relay.id === relayId
      ? {
          ...relay,
          ...updates,
          url: updates.url ? normalizeRelayUrl(updates.url) : relay.url,
          updatedAt: Date.now(),
        }
      : relay,
  )

export const removeRelayEntry = (relays: RoomRelayPolicyEntry[], relayId: string) =>
  relays.filter(relay => relay.id !== relayId)

export const getRelayFallbackPlan = (policy: RoomRelayPolicy) => {
  const writable = policy.relays.filter(
    relay => relay.role === "write" || relay.role === "read-write",
  )

  if (writable.length === 0) {
    return {
      primary: null,
      fallbacks: [] as string[],
      guidance: "No writable relays are configured. Posting will be blocked.",
    }
  }

  return {
    primary: writable[0].url,
    fallbacks: writable.slice(1).map(relay => relay.url),
    guidance:
      writable.length > 1
        ? "If the primary write relay fails, writes will attempt remaining writable relays in listed order."
        : "No backup writable relay is configured; add one for deterministic fallback.",
  }
}
