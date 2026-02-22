import {getSetting} from "src/engine"

export type GroupTelemetryEvent =
  | "group_nav_opened"
  | "group_chat_opened"
  | "group_setup_started"
  | "group_setup_completed"
  | "group_setup_abandoned"
  | "group_join_started"
  | "group_join_submitted"
  | "group_join_active_detected"
  | "group_invite_viewed"
  | "group_invite_destination_opened"
  | "group_invite_conversion"
  | "group_first_message_attempted"
  | "group_first_message_succeeded"
  | "group_first_message_failed"
  | "group_security_state_shown"
  | "group_security_state_changed"
  | "group_security_fallback_entered"
  | "group_security_fallback_resolved"
  | "group_unread_badge_seen"
  | "group_mark_read"
  | "group_send_success"
  | "group_send_error"
  | "group_setup_flow_selected"
  | "group_setup_relay_checks_started"
  | "group_setup_relay_checks_completed"
  | "group_setup_relay_check_failed"
  | "group_setup_relay_auth_started"
  | "group_setup_relay_auth_result"
  | "group_setup_relay_auth_expired"
  | "group_setup_blocked_by_relay_requirements"
  | "group_setup_share_package_created"
  | "group_setup_create_attempt"
  | "group_setup_join_attempt"
  | "group_setup_create_result"
  | "group_setup_join_result"
  | "group_expert_mode_changed"
  | "relay_policy_saved"
  | "relay_policy_save_failed"
  | "relay_fallback_used"
  | "group_invite_create_opened"
  | "group_invite_share_success"
  | "group_invite_share_fallback"

const dedupe = new Map<string, number>()

const normalizeTransportMode = (
  value: unknown,
): "baseline" | "secure-pilot" | "compatibility" | null => {
  if (typeof value !== "string") return null

  const normalized = value.trim().toLowerCase()

  if (
    normalized === "secure-nip-ee" ||
    normalized === "secure-pilot" ||
    normalized === "secure-active"
  ) {
    return "secure-pilot"
  }

  if (normalized === "baseline-nip29" || normalized === "baseline") {
    return "baseline"
  }

  if (
    normalized === "compatibility" ||
    normalized === "compatibility-active" ||
    normalized === "fallback-active"
  ) {
    return "compatibility"
  }

  return null
}

const normalizeGuaranteeLabel = (
  value: unknown,
  resolvedMode: "baseline" | "secure-pilot" | "compatibility" | null,
): "transport-integrity" | "confidentiality" | "compatibility-delivery" | null => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()

    if (
      normalized === "transport-integrity" ||
      normalized === "confidentiality" ||
      normalized === "compatibility-delivery"
    ) {
      return normalized
    }
  }

  if (resolvedMode === "secure-pilot") {
    return "transport-integrity"
  }

  if (resolvedMode === "baseline" || resolvedMode === "compatibility") {
    return "compatibility-delivery"
  }

  return null
}

const withCanonicalTransportTelemetry = (props: Record<string, unknown>) => {
  const requestedMode = normalizeTransportMode(
    props.requested_transport_mode ?? props.requestedMode ?? props.mode,
  )
  const resolvedMode = normalizeTransportMode(
    props.resolved_transport_mode ??
      props.resolvedMode ??
      props.transport_mode ??
      props.security_state,
  )
  const guaranteeLabel = normalizeGuaranteeLabel(props.guarantee_label, resolvedMode)
  const fallbackReason =
    typeof props.fallback_reason === "string"
      ? props.fallback_reason
      : requestedMode && resolvedMode && requestedMode !== resolvedMode
        ? "runtime-error"
        : "none"

  return {
    ...props,
    ...(requestedMode ? {requested_transport_mode: requestedMode} : {}),
    ...(resolvedMode ? {resolved_transport_mode: resolvedMode} : {}),
    ...(guaranteeLabel ? {guarantee_label: guaranteeLabel} : {}),
    fallback_reason: fallbackReason,
  }
}

const sanitizeProps = (props: Record<string, unknown>) => {
  const canonical = withCanonicalTransportTelemetry(props)
  const safe: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(canonical)) {
    if (typeof value === "string") {
      safe[key] = value.slice(0, 80)
    } else if (typeof value === "number" || typeof value === "boolean") {
      safe[key] = value
    }
  }

  return safe
}

export const trackGroupTelemetry = (
  event: GroupTelemetryEvent,
  props: Record<string, unknown> = {},
  {
    dedupeKey,
    minIntervalMs = 30_000,
    enabled,
  }: {
    dedupeKey?: string
    minIntervalMs?: number
    enabled?: boolean
  } = {},
) => {
  if (typeof window === "undefined") return

  const isEnabled = enabled ?? getSetting<boolean>("report_analytics")

  if (!isEnabled) return

  const plausible = (window as any).plausible as undefined | ((event: string, opts?: any) => void)

  if (typeof plausible !== "function") return

  if (dedupeKey) {
    const now = Date.now()
    const last = dedupe.get(dedupeKey) || 0

    if (now - last < minIntervalMs) return

    dedupe.set(dedupeKey, now)
  }

  plausible(event, {props: sanitizeProps(props)})
}

export const clearGroupTelemetryDedupe = () => {
  dedupe.clear()
}
