import {describe, expect, it, beforeEach, vi} from "vitest"
import {clearGroupTelemetryDedupe, trackGroupTelemetry} from "src/app/groups/telemetry"

describe("app/groups telemetry", () => {
  beforeEach(() => {
    clearGroupTelemetryDedupe()
    ;(window as any).plausible = vi.fn()
  })

  it("respects enabled=false guardrail", () => {
    trackGroupTelemetry("group_nav_opened", {surface: "desktop"}, {enabled: false})

    expect((window as any).plausible).not.toHaveBeenCalled()
  })

  it("dedupes telemetry within configured interval", () => {
    trackGroupTelemetry(
      "group_unread_badge_seen",
      {surface: "desktop"},
      {enabled: true, dedupeKey: "badge-desktop", minIntervalMs: 10_000},
    )
    trackGroupTelemetry(
      "group_unread_badge_seen",
      {surface: "desktop"},
      {enabled: true, dedupeKey: "badge-desktop", minIntervalMs: 10_000},
    )

    expect((window as any).plausible).toHaveBeenCalledTimes(1)
  })

  it("sanitizes properties before emit", () => {
    trackGroupTelemetry(
      "group_send_success",
      {surface: "mobile", unsafe: {x: 1}, label: "a".repeat(200)},
      {enabled: true},
    )

    expect((window as any).plausible).toHaveBeenCalledTimes(1)
    const call = (window as any).plausible.mock.calls[0]

    expect(call[0]).toBe("group_send_success")
    expect(call[1].props.surface).toBe("mobile")
    expect(call[1].props.label.length).toBe(80)
    expect(call[1].props.unsafe).toBeUndefined()
  })
})
