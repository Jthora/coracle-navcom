import {
  mapCapabilityReasonsToUi,
  runGroupCapabilityProbe,
  type GroupRelayCapabilities,
} from "src/domain/group-capability-probe"
import {dispatchGroupTransportAction} from "src/engine/group-transport"
import {okTransportResult, type GroupTransport} from "src/engine/group-transport-contracts"

type GroupTransportMode = "baseline-nip29" | "secure-nip-ee"

export type MixedCapabilityTelemetryEvent =
  | {
      type: "fallback"
      requestedMode: GroupTransportMode
      resolvedMode: GroupTransportMode
      reason?: string
    }
  | {
      type: "capability_blocked"
      requestedMode: GroupTransportMode
      reason?: string
    }
  | {
      type: "tier_policy_blocked"
      reason: string
      missionTier: 0 | 1 | 2
    }

export type MixedCapabilitySimulationResult = {
  status: "success" | "fallback" | "blocked"
  error?: string
  capabilityReadiness: "R0" | "R1" | "R2" | "R3" | "R4"
  capabilityReasons: ReturnType<typeof mapCapabilityReasonsToUi>
  telemetry: MixedCapabilityTelemetryEvent[]
}

export type MixedCapabilitySimulationInput = {
  capabilities: GroupRelayCapabilities
  missionTier: 0 | 1 | 2
  allowCapabilityFallback?: boolean
  downgradeConfirmed?: boolean
  allowTier2Override?: boolean
}

export const createMixedCapabilitySimulationAdapters = (): GroupTransport[] => {
  const secureAdapter: GroupTransport = {
    getModeId: () => "secure-nip-ee",
    canOperate: ({requestedMode, capabilitySnapshot}) => {
      if (requestedMode !== "secure-nip-ee") {
        return {ok: false, reason: "Secure adapter only handles secure mode."}
      }

      if ((capabilitySnapshot?.readiness || "R0") !== "R4") {
        return {ok: false, reason: "Secure mode requires R4 capability readiness."}
      }

      return {ok: true}
    },
    publishControlAction: async () => okTransportResult({ok: true}),
  }

  const baselineAdapter: GroupTransport = {
    getModeId: () => "baseline-nip29",
    canOperate: () => ({ok: true}),
    publishControlAction: async () => okTransportResult({ok: true}),
  }

  return [secureAdapter, baselineAdapter]
}

export const summarizeMixedCapabilityTelemetry = (events: MixedCapabilityTelemetryEvent[]) => ({
  fallbackEvents: events.filter(event => event.type === "fallback").length,
  capabilityBlockedEvents: events.filter(event => event.type === "capability_blocked").length,
  tierPolicyBlockedEvents: events.filter(event => event.type === "tier_policy_blocked").length,
})

export const simulateMixedCapabilityLane = async ({
  capabilities,
  missionTier,
  allowCapabilityFallback = true,
  downgradeConfirmed = false,
  allowTier2Override = false,
}: MixedCapabilitySimulationInput): Promise<MixedCapabilitySimulationResult> => {
  const probe = runGroupCapabilityProbe(capabilities)
  const telemetry: MixedCapabilityTelemetryEvent[] = []

  try {
    await dispatchGroupTransportAction(
      "join",
      {
        groupId: "relay.example'ops",
        memberPubkey: "a".repeat(64),
      },
      {
        actorRole: "member",
        requestedMode: "secure-nip-ee",
        missionTier,
        downgradeConfirmed,
        allowTier2Override,
        allowCapabilityFallback,
        capabilitySnapshot: {
          readiness: probe.readiness,
          reasons: probe.reasons,
        },
        adapters: createMixedCapabilitySimulationAdapters(),
        diagnostics: {
          onFallback: input => {
            telemetry.push({
              type: "fallback",
              requestedMode: input.requestedMode as GroupTransportMode,
              resolvedMode: input.adapterId as GroupTransportMode,
              reason: input.reason,
            })
          },
          onCapabilityBlocked: input => {
            telemetry.push({
              type: "capability_blocked",
              requestedMode: input.requestedMode as GroupTransportMode,
              reason: input.reason,
            })
          },
          onTierPolicyBlocked: input => {
            telemetry.push({
              type: "tier_policy_blocked",
              reason: input.reason,
              missionTier: input.missionTier,
            })
          },
        },
      },
    )

    return {
      status: telemetry.some(event => event.type === "fallback") ? "fallback" : "success",
      capabilityReadiness: probe.readiness,
      capabilityReasons: mapCapabilityReasonsToUi(probe.reasons),
      telemetry,
    }
  } catch (error) {
    return {
      status: "blocked",
      error: error instanceof Error ? error.message : "unknown",
      capabilityReadiness: probe.readiness,
      capabilityReasons: mapCapabilityReasonsToUi(probe.reasons),
      telemetry,
    }
  }
}
