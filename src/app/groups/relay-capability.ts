import {AuthStatus, Pool} from "@welshman/net"
import type {SignedEvent, StampedEvent} from "@welshman/util"

export type RelayCapabilityStatus =
  | "ready"
  | "auth-required"
  | "not-advertised"
  | "unknown"
  | "unreachable"

export type RelayCapabilityCheck = {
  relay: string
  status: RelayCapabilityStatus
  supportsGroups: boolean | null
  supportsNip29?: boolean | null
  supportsNip42?: boolean | null
  supportsNip104?: boolean | null
  supportsNipEeSignal?: boolean | null
  supportsNavcomBaseline?: boolean | null
  isNavcomDefaultRelay?: boolean
  advertisedNips?: number[]
  authRequired: boolean | null
  challengeResponseAuth: boolean | null
  details: string
  retries?: number
  timeoutMs?: number
}

export type RelayAuthAttemptResult = {
  relay: string
  ok: boolean
  authStatus: string
  reason: string
}

export type RelayAuthLifecycleStatus =
  | "idle"
  | "authenticating"
  | "authenticated"
  | "expired"
  | "failed"

export type RelayAuthLifecycleSession = {
  status: RelayAuthLifecycleStatus
  lastAttemptAt?: number
  authenticatedAt?: number
  expiresAt?: number
  lastReason?: string
}

export const RELAY_AUTH_SESSION_TTL_MS_DEFAULT = 15 * 60 * 1000

type RelayAuthStateLike = {
  status: string
  details?: string
  attemptAuth: (sign: (event: StampedEvent) => Promise<SignedEvent>) => Promise<void>
}

type RelaySocketLike = {
  attemptToOpen: () => void
  send: (message: unknown) => void
  auth: RelayAuthStateLike
}

type RelayInfoLike = {
  supported_nips?: unknown
  supported_group_modes?: unknown
  supported_groups?: unknown
  software?: unknown
  name?: unknown
  description?: unknown
  limitation?: {
    auth_required?: unknown
  }
}

export type RelayProbeOptions = {
  timeoutMs?: number
  maxRetries?: number
  retryBackoffMs?: number
  cacheTtlMs?: number
  cacheStaleAfterMs?: number
  nowMs?: number
}

export const RELAY_PROBE_TIMEOUT_MS_DEFAULT = 2500
export const RELAY_PROBE_MAX_RETRIES_DEFAULT = 2
export const RELAY_PROBE_BACKOFF_MS_DEFAULT = 300
export const RELAY_PROBE_CACHE_TTL_MS_DEFAULT = 30 * 1000
export const RELAY_PROBE_CACHE_STALE_AFTER_MS_DEFAULT = 120 * 1000

type RelayCapabilityCacheEntry = {
  value: RelayCapabilityCheck
  checkedAt: number
  expiresAt: number
  staleAt: number
}

const relayCapabilityCache = new Map<string, RelayCapabilityCacheEntry>()

const getRelayCapabilityCacheKey = (relay: string) => (relay || "").trim().toLowerCase()

const resolveFromRelayCapabilityCache = ({
  relay,
  now = Date.now(),
}: {
  relay: string
  now?: number
}) => {
  const entry = relayCapabilityCache.get(getRelayCapabilityCacheKey(relay))

  if (!entry) return null
  if (now > entry.staleAt) return null

  const freshness = now > entry.expiresAt ? "stale" : "fresh"

  return {
    value: entry.value,
    freshness,
    checkedAt: entry.checkedAt,
  }
}

const upsertRelayCapabilityCache = ({
  relay,
  value,
  now = Date.now(),
  ttlMs = RELAY_PROBE_CACHE_TTL_MS_DEFAULT,
  staleAfterMs = RELAY_PROBE_CACHE_STALE_AFTER_MS_DEFAULT,
}: {
  relay: string
  value: RelayCapabilityCheck
  now?: number
  ttlMs?: number
  staleAfterMs?: number
}) => {
  relayCapabilityCache.set(getRelayCapabilityCacheKey(relay), {
    value,
    checkedAt: now,
    expiresAt: now + ttlMs,
    staleAt: now + staleAfterMs,
  })
}

export const clearRelayCapabilityCache = (relay?: string) => {
  if (!relay) {
    relayCapabilityCache.clear()

    return
  }

  relayCapabilityCache.delete(getRelayCapabilityCacheKey(relay))
}

const getRelayInfoUrl = (relay: string) => {
  const value = (relay || "").trim()

  if (!value) return ""

  try {
    const parsed = new URL(value)

    if (parsed.protocol === "wss:") {
      parsed.protocol = "https:"
    } else if (parsed.protocol === "ws:") {
      parsed.protocol = "http:"
    }

    return parsed.toString()
  } catch {
    return ""
  }
}

const NAVCOM_DEFAULT_RELAY_HOST = "relay.navcom.app"

const toRelayHost = (relay: string) => {
  const value = (relay || "").trim()

  if (!value) return ""

  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return value
      .replace(/^wss?:\/\//, "")
      .replace(/\/.*/, "")
      .toLowerCase()
  }
}

const isNavcomDefaultRelay = (relay: string) => toRelayHost(relay) === NAVCOM_DEFAULT_RELAY_HOST

const toSupportedNips = (supportedNips: unknown): number[] => {
  if (!Array.isArray(supportedNips)) return []

  return supportedNips
    .filter(nip => typeof nip === "number" && Number.isFinite(nip))
    .map(nip => Number(nip))
}

const toLowercaseTokens = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value.toLowerCase()]
  }

  if (!Array.isArray(value)) return []

  return value
    .filter(item => typeof item === "string")
    .map(item => item.toLowerCase())
}

const resolveNipEeSignal = (input: RelayInfoLike): boolean | null => {
  const tokens = [
    ...toLowercaseTokens(input.supported_group_modes),
    ...toLowercaseTokens(input.supported_groups),
    ...toLowercaseTokens(input.software),
    ...toLowercaseTokens(input.name),
    ...toLowercaseTokens(input.description),
  ]

  if (tokens.length === 0) return null

  return tokens.some(token => token.includes("nip-ee") || token.includes("secure-nip-ee"))
}

const resolveNavcomBaseline = ({
  supportsNip104,
  supportsNipEeSignal,
}: {
  supportsNip104: boolean
  supportsNipEeSignal: boolean | null
}): boolean | null => {
  if (!supportsNip104) return false
  if (supportsNipEeSignal === true) return true
  if (supportsNipEeSignal === false) return false

  return null
}

const buildCapabilityDetailSuffix = ({
  supportsNip29,
  supportsNip42,
  supportsNip104,
  supportsNipEeSignal,
  isDefaultRelay,
}: {
  supportsNip29: boolean
  supportsNip42: boolean
  supportsNip104: boolean
  supportsNipEeSignal: boolean | null
  isDefaultRelay: boolean
}) => {
  const nipEeLabel =
    supportsNipEeSignal === true ? "yes" : supportsNipEeSignal === false ? "no" : "unknown"

  const baselineHint =
    supportsNip104 && supportsNipEeSignal === true
      ? "Navcom baseline advertised."
      : "Navcom baseline is not fully advertised; fallback/interoperability may still work."

  const defaultRelayHint = isDefaultRelay
    ? " relay.navcom.app is the default Navcom relay."
    : ""

  return `Capability signals: NIP-29 ${supportsNip29 ? "yes" : "no"}, NIP-42 ${supportsNip42 ? "yes" : "no"}, NIP-104 ${supportsNip104 ? "yes" : "no"}, NIP-EE signal ${nipEeLabel}. ${baselineHint} NIP-104-PQC is client-side and may operate without explicit relay advertisement.${defaultRelayHint}`
}

export const evaluateRelayCapabilityFromInfo = (
  input: RelayInfoLike,
  relay?: string,
): Omit<RelayCapabilityCheck, "relay"> => {
  const nips = toSupportedNips(input.supported_nips)
  const supportsNip29 = nips.includes(29)
  const supportsNip42 = nips.includes(42)
  const supportsNip104 = nips.includes(104)
  const supportsNipEeSignal = resolveNipEeSignal(input)
  const supportsNavcomBaseline = resolveNavcomBaseline({supportsNip104, supportsNipEeSignal})
  const defaultRelay = relay ? isNavcomDefaultRelay(relay) : false

  const supportsGroups = supportsNip29
  const challengeResponseAuth = supportsNip42
  const authRequired = input.limitation?.auth_required === true

  const capabilityDetailSuffix = buildCapabilityDetailSuffix({
    supportsNip29,
    supportsNip42,
    supportsNip104,
    supportsNipEeSignal,
    isDefaultRelay: defaultRelay,
  })

  const capabilitySignals = {
    supportsNip29,
    supportsNip42,
    supportsNip104,
    supportsNipEeSignal,
    supportsNavcomBaseline,
    isNavcomDefaultRelay: defaultRelay,
    advertisedNips: nips,
  }

  if (authRequired) {
    return {
      ...capabilitySignals,
      status: "auth-required",
      supportsGroups,
      authRequired,
      challengeResponseAuth,
      details: `Relay requires challenge/response authentication before write access. ${capabilityDetailSuffix}`,
    }
  }

  if (!supportsGroups) {
    return {
      ...capabilitySignals,
      status: "not-advertised",
      supportsGroups,
      authRequired,
      challengeResponseAuth,
      details: `Relay does not advertise NIP-29 group support. This is an advertisement signal, not a hard failure; some relays still interoperate. ${capabilityDetailSuffix}`,
    }
  }

  return {
    ...capabilitySignals,
    status: "ready",
    supportsGroups,
    authRequired,
    challengeResponseAuth,
    details: challengeResponseAuth
      ? `Relay supports groups and optional challenge/response auth. ${capabilityDetailSuffix}`
      : `Relay supports groups. ${capabilityDetailSuffix}`,
  }
}

export const checkRelayCapability = async (
  relay: string,
  fetchImpl: typeof fetch = fetch,
  options: RelayProbeOptions = {},
): Promise<RelayCapabilityCheck> => {
  const nowMs = options.nowMs ?? Date.now()
  const timeoutMs = options.timeoutMs ?? RELAY_PROBE_TIMEOUT_MS_DEFAULT
  const maxRetries = options.maxRetries ?? RELAY_PROBE_MAX_RETRIES_DEFAULT
  const retryBackoffMs = options.retryBackoffMs ?? RELAY_PROBE_BACKOFF_MS_DEFAULT
  const cacheTtlMs = options.cacheTtlMs ?? RELAY_PROBE_CACHE_TTL_MS_DEFAULT
  const cacheStaleAfterMs = options.cacheStaleAfterMs ?? RELAY_PROBE_CACHE_STALE_AFTER_MS_DEFAULT
  const infoUrl = getRelayInfoUrl(relay)

  const cached = resolveFromRelayCapabilityCache({relay, now: nowMs})
  const staleFallback = cached?.freshness === "stale" ? cached.value : null

  if (cached?.freshness === "fresh") {
    return {
      ...cached.value,
      details: cached.value.details,
    }
  }

  if (!infoUrl) {
    return {
      relay,
      status: "unreachable",
      supportsGroups: null,
      supportsNip29: null,
      supportsNip42: null,
      supportsNip104: null,
      supportsNipEeSignal: null,
      supportsNavcomBaseline: null,
      isNavcomDefaultRelay: isNavcomDefaultRelay(relay),
      advertisedNips: [],
      authRequired: null,
      challengeResponseAuth: null,
      details: "Relay URL is invalid.",
      retries: 0,
      timeoutMs,
    }
  }

  let attempts = 0

  while (attempts <= maxRetries) {
    attempts += 1

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const response = await fetchImpl(infoUrl, {
          method: "GET",
          headers: {Accept: "application/nostr+json"},
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Relay info request failed: ${response.status}`)
        }

        const payload = (await response.json()) as RelayInfoLike
        const evaluated = evaluateRelayCapabilityFromInfo(payload, relay)

        const result = {
          relay,
          ...evaluated,
          retries: attempts - 1,
          timeoutMs,
        }

        upsertRelayCapabilityCache({
          relay,
          value: result,
          now: nowMs,
          ttlMs: cacheTtlMs,
          staleAfterMs: cacheStaleAfterMs,
        })

        return result
      } finally {
        clearTimeout(timeout)
      }
    } catch {
      if (attempts <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryBackoffMs * attempts))
      }
    }
  }

  if (staleFallback) {
    return {
      ...staleFallback,
      details: `${staleFallback.details} (cached, refresh failed)`,
      timeoutMs,
    }
  }

  return {
    relay,
    status: "unreachable",
    supportsGroups: null,
    supportsNip29: null,
    supportsNip42: null,
    supportsNip104: null,
    supportsNipEeSignal: null,
    supportsNavcomBaseline: null,
    isNavcomDefaultRelay: isNavcomDefaultRelay(relay),
    advertisedNips: [],
    authRequired: null,
    challengeResponseAuth: null,
    details: "Relay capability probe failed after retries (network/CORS/unreachable).",
    retries: maxRetries,
    timeoutMs,
  }
}

export const checkRelayCapabilities = async (
  relays: string[],
  fetchImpl: typeof fetch = fetch,
  options: RelayProbeOptions = {},
): Promise<RelayCapabilityCheck[]> =>
  Promise.all((relays || []).map(relay => checkRelayCapability(relay, fetchImpl, options)))

const defaultGetSocket = (relay: string) => Pool.get().get(relay) as unknown as RelaySocketLike

const toRelayAuthReason = (authStatus: string, details?: string) => {
  if (authStatus === AuthStatus.Ok) {
    return "Relay authentication succeeded."
  }

  if (authStatus === AuthStatus.DeniedSignature) {
    return "Signature request was denied by signer."
  }

  if (authStatus === AuthStatus.Forbidden) {
    return details || "Relay rejected authentication event."
  }

  if (authStatus === AuthStatus.PendingSignature || authStatus === AuthStatus.PendingResponse) {
    return "Relay authentication is still pending. Retry shortly."
  }

  if (authStatus === AuthStatus.Requested) {
    return "Relay requested auth challenge but authentication was not completed."
  }

  return "Relay did not present an authentication challenge in time."
}

export const attemptRelayChallengeAuth = async ({
  relay,
  sign,
  getSocket = defaultGetSocket,
}: {
  relay: string
  sign?: ((event: StampedEvent) => Promise<SignedEvent>) | null
  getSocket?: (relay: string) => RelaySocketLike
}): Promise<RelayAuthAttemptResult> => {
  if (!sign) {
    return {
      relay,
      ok: false,
      authStatus: "missing-signer",
      reason: "A signer is required for relay challenge/response authentication.",
    }
  }

  const socket = getSocket(relay)

  socket.attemptToOpen()

  const probeSubscriptionId = `relay-auth-probe:${Date.now()}`

  try {
    socket.send(["REQ", probeSubscriptionId, {kinds: [0], limit: 1}])
    socket.send(["CLOSE", probeSubscriptionId])
  } catch {
    // Probe message is best-effort. Some socket adapters may reject while opening.
  }

  try {
    await socket.auth.attemptAuth(sign)
  } catch {
    // Timeout or transport race; final status still indicates current auth state.
  }

  const authStatus = socket.auth.status

  return {
    relay,
    ok: authStatus === AuthStatus.Ok,
    authStatus,
    reason: toRelayAuthReason(authStatus, socket.auth.details),
  }
}

export const hasViableRelayPath = ({
  checks,
  authConfirmed,
  selectedRelays,
}: {
  checks: RelayCapabilityCheck[]
  authConfirmed: Record<string, boolean>
  selectedRelays: string[]
}) => {
  if (checks.length === 0) {
    return selectedRelays.length > 0
  }

  return checks.some(check => {
    if (check.status === "unreachable") return false
    if (check.status === "auth-required") return Boolean(authConfirmed[check.relay])

    return true
  })
}

export const refreshRelayAuthSessions = ({
  sessions,
  now = Date.now(),
}: {
  sessions: Record<string, RelayAuthLifecycleSession>
  now?: number
}) => {
  const next = {...sessions}

  for (const [relay, session] of Object.entries(next)) {
    if (
      session.status === "authenticated" &&
      typeof session.expiresAt === "number" &&
      now > session.expiresAt
    ) {
      next[relay] = {
        ...session,
        status: "expired",
        lastReason: "Relay auth session expired. Re-authenticate to continue.",
      }
    }
  }

  return next
}

export const getRelayAuthConfirmedMap = ({
  sessions,
  now = Date.now(),
}: {
  sessions: Record<string, RelayAuthLifecycleSession>
  now?: number
}) => {
  const confirmed: Record<string, boolean> = {}

  for (const [relay, session] of Object.entries(sessions)) {
    confirmed[relay] =
      session.status === "authenticated" &&
      (typeof session.expiresAt !== "number" || session.expiresAt > now)
  }

  return confirmed
}
