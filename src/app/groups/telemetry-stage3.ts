import type {GroupSecurityState} from "src/app/groups/security-state"
import type {GroupTelemetryEvent} from "src/app/groups/telemetry"

type Emit = (event: GroupTelemetryEvent, props?: Record<string, unknown>) => void

export const emitSecurityStateTransitionTelemetry = ({
  emit,
  route,
  previousState,
  nextState,
}: {
  emit: Emit
  route: string
  previousState: GroupSecurityState | "unknown"
  nextState: GroupSecurityState
}) => {
  if (previousState === nextState) return

  emit("group_security_state_changed", {
    route,
    from_state: previousState,
    to_state: nextState,
  })

  if (nextState === "fallback-active") {
    emit("group_security_fallback_entered", {
      route,
      from_state: previousState,
    })
  }

  if (previousState === "fallback-active" && nextState !== "fallback-active") {
    emit("group_security_fallback_resolved", {
      route,
      to_state: nextState,
    })
  }
}

export const emitRelayPolicyOutcomeTelemetry = ({
  emit,
  relayCount,
  ok,
}: {
  emit: Emit
  relayCount: number
  ok: boolean
}) => {
  emit(ok ? "relay_policy_saved" : "relay_policy_save_failed", {relayCount})
}

export const emitRelayFallbackUsageTelemetry = ({
  emit,
  groupId,
  fallbackCount,
}: {
  emit: Emit
  groupId: string
  fallbackCount: number
}) => {
  emit("relay_fallback_used", {
    groupIdShape: groupId.includes("'") ? "relay-address" : "opaque",
    fallbackCount,
  })
}
