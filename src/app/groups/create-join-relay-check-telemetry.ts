import {trackGroupTelemetry} from "src/app/groups/telemetry"
import {getRelayCheckCounts, getRelayChecksResult} from "src/app/groups/create-join-view-helpers"
import type {RelayCapabilityCheck} from "src/app/groups/relay-capability"

export const emitRelayChecksStartedTelemetry = ({
  flow,
  relayCount,
}: {
  flow: "create" | "join"
  relayCount: number
}) => {
  trackGroupTelemetry("group_setup_relay_checks_started", {
    flow,
    relay_count: relayCount,
  })
}

export const emitRelayChecksCompletedTelemetry = ({
  flow,
  relayCount,
  relayChecks,
  startedAt,
}: {
  flow: "create" | "join"
  relayCount: number
  relayChecks: RelayCapabilityCheck[]
  startedAt: number
}) => {
  const {readyCount, authRequiredCount, unreachableCount, notAdvertisedCount} =
    getRelayCheckCounts(relayChecks)

  trackGroupTelemetry("group_setup_relay_checks_completed", {
    flow,
    relay_count: relayCount,
    ready_count: readyCount,
    auth_required_count: authRequiredCount,
    unreachable_count: unreachableCount,
    not_advertised_count: notAdvertisedCount,
    no_groups_count: notAdvertisedCount,
    elapsed_ms: Math.max(0, Date.now() - startedAt),
    result: getRelayChecksResult(relayChecks),
  })

  return {authRequiredCount}
}

export const emitRelayChecksFailedTelemetry = ({
  flow,
  relayCount,
  startedAt,
}: {
  flow: "create" | "join"
  relayCount: number
  startedAt: number
}) => {
  trackGroupTelemetry("group_setup_relay_check_failed", {
    flow,
    relay_count: relayCount,
    elapsed_ms: Math.max(0, Date.now() - startedAt),
    result: "error",
  })
}
