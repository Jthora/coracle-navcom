import {beforeEach, describe, expect, it, vi} from "vitest"
import {trackGroupTelemetry, clearGroupTelemetryDedupe} from "../../../../src/app/groups/telemetry"
import {buildGuidedBlockTelemetryProps} from "../../../../src/app/groups/create-join-block-telemetry"

describe("app/groups telemetry contract schema", () => {
  beforeEach(() => {
    clearGroupTelemetryDedupe()
    ;(window as any).plausible = vi.fn()
  })

  it("preserves required create/join contract fields and canonical transport values", () => {
    trackGroupTelemetry(
      "group_setup_create_attempt",
      {
        flow: "create",
        entry_point: "groups_create",
        result: "error",
        security_mode_requested: "secure",
        security_mode_resolved: "basic",
        requested_transport_mode: "secure-nip-ee",
        resolved_transport_mode: "baseline-nip29",
        policy_block_reason: "STRICT_REQUIRES_NIP_EE_SIGNAL",
        mission_tier: 2,
        override_used: true,
        override_reason: "TIER_OVERRIDE_APPROVED",
      },
      {enabled: true},
    )

    const call = (window as any).plausible.mock.calls[0]
    const props = call[1].props

    expect(call[0]).toBe("group_setup_create_attempt")
    expect(props.flow).toBe("create")
    expect(props.entry_point).toBe("groups_create")
    expect(props.result).toBe("error")
    expect(props.security_mode_requested).toBe("secure")
    expect(props.security_mode_resolved).toBe("basic")
    expect(props.requested_transport_mode).toBe("secure-pilot")
    expect(props.resolved_transport_mode).toBe("baseline")
    expect(props.policy_block_reason).toBe("STRICT_REQUIRES_NIP_EE_SIGNAL")
    expect(props.mission_tier).toBe(2)
    expect(props.override_used).toBe(true)
    expect(props.override_reason).toBe("TIER_OVERRIDE_APPROVED")
    expect(props.fallback_reason).toBe("runtime-error")
  })

  it("defaults fallback_reason to none when requested and resolved transport align", () => {
    trackGroupTelemetry(
      "group_setup_join_attempt",
      {
        flow: "join",
        requested_transport_mode: "baseline-nip29",
        resolved_transport_mode: "baseline-nip29",
      },
      {enabled: true},
    )

    const call = (window as any).plausible.mock.calls[0]

    expect(call[1].props.requested_transport_mode).toBe("baseline")
    expect(call[1].props.resolved_transport_mode).toBe("baseline")
    expect(call[1].props.fallback_reason).toBe("none")
  })
})

describe("app/groups guided block telemetry contract", () => {
  it("builds required blocked-flow fields with deterministic reason payload", () => {
    const props = buildGuidedBlockTelemetryProps({
      flow: "create",
      blockReason: "INVITE_TIER2_REQUIRES_STRICT_MODE",
      securityMode: "basic",
      requestedTransportMode: "baseline-nip29",
      missionTier: 2,
      relayCount: 3,
      relayCounts: {
        readyCount: 1,
        authRequiredCount: 1,
        unreachableCount: 1,
        notAdvertisedCount: 0,
        unknownCount: 0,
      },
      missingCredentials: {
        missingSignerRelays: ["wss://relay-a"],
        unknownMethodRelays: ["wss://relay-b"],
        warnings: ["auth required"],
      },
    })

    expect(props.flow).toBe("create")
    expect(props.block_reason).toBe("INVITE_TIER2_REQUIRES_STRICT_MODE")
    expect(props.security_mode).toBe("basic")
    expect(props.requested_transport_mode).toBe("baseline-nip29")
    expect(props.mission_tier).toBe(2)
    expect(props.relay_count).toBe(3)
    expect(props.ready_count).toBe(1)
    expect(props.auth_required_count).toBe(1)
    expect(props.unreachable_count).toBe(1)
    expect(props.not_advertised_count).toBe(0)
    expect(props.no_groups_count).toBe(0)
    expect(props.missing_signer_count).toBe(1)
    expect(props.unknown_auth_method_count).toBe(1)
    expect(props.result).toBe("error")
  })
})
