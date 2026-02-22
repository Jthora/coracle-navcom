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

  it("emits canonical transport and guarantee telemetry fields", () => {
    trackGroupTelemetry(
      "group_security_state_shown",
      {
        requestedMode: "secure-nip-ee",
        security_state: "fallback-active",
      },
      {enabled: true},
    )

    const call = (window as any).plausible.mock.calls[0]

    expect(call[1].props.requested_transport_mode).toBe("secure-pilot")
    expect(call[1].props.resolved_transport_mode).toBe("compatibility")
    expect(call[1].props.guarantee_label).toBe("compatibility-delivery")
    expect(call[1].props.fallback_reason).toBe("runtime-error")
  })

  it("preserves runtime UI status fields for support diagnostics", () => {
    trackGroupTelemetry(
      "group_security_state_shown",
      {
        security_state: "secure-active",
        security_state_label: "Secure transport active",
        resolved_transport_mode: "secure-nip-ee",
      },
      {enabled: true},
    )

    const call = (window as any).plausible.mock.calls[0]

    expect(call[1].props.security_state).toBe("secure-active")
    expect(call[1].props.security_state_label).toBe("Secure transport active")
    expect(call[1].props.resolved_transport_mode).toBe("secure-pilot")
  })
})
