import {
  getRelayAuthConfirmedMap,
  hasViableRelayPath,
  refreshRelayAuthSessions,
  type RelayAuthLifecycleSession,
  type RelayCapabilityCheck,
} from "src/app/groups/relay-capability"

export const resolveRelayAuthBlockerState = ({
  checks,
  sessions,
}: {
  checks: RelayCapabilityCheck[]
  sessions: Record<string, RelayAuthLifecycleSession>
}) => {
  const refreshedSessions = refreshRelayAuthSessions({sessions})
  const confirmedMap = getRelayAuthConfirmedMap({sessions: refreshedSessions})
  const hasAuthBlocker = checks.some(
    check => check.status === "auth-required" && !confirmedMap[check.relay],
  )

  return {
    refreshedSessions,
    confirmedMap,
    hasAuthBlocker,
  }
}

export const hasRelayViabilityBlocker = ({
  checks,
  sessions,
  selectedRelays,
}: {
  checks: RelayCapabilityCheck[]
  sessions: Record<string, RelayAuthLifecycleSession>
  selectedRelays: string[]
}) =>
  !hasViableRelayPath({
    checks,
    authConfirmed: getRelayAuthConfirmedMap({sessions}),
    selectedRelays,
  })

export const getRelaySession = ({
  sessions,
  relay,
}: {
  sessions: Record<string, RelayAuthLifecycleSession>
  relay: string
}): RelayAuthLifecycleSession => sessions[relay] || {status: "idle"}

export const isRelayConfirmed = ({
  sessions,
  relay,
}: {
  sessions: Record<string, RelayAuthLifecycleSession>
  relay: string
}) => Boolean(getRelayAuthConfirmedMap({sessions})[relay])
