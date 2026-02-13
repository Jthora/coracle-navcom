import {getSetting} from "src/engine"

export type GroupTelemetryEvent =
  | "group_nav_opened"
  | "group_chat_opened"
  | "group_unread_badge_seen"
  | "group_mark_read"
  | "group_send_success"
  | "group_send_error"

const dedupe = new Map<string, number>()

const sanitizeProps = (props: Record<string, unknown>) => {
  const safe: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(props)) {
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
