import {describe, expect, it} from "vitest"
import {
  simulateMixedCapabilityLane,
  summarizeMixedCapabilityTelemetry,
} from "../../../../src/app/groups/mixed-capability-lanes"

type MatrixCase = {
  id: string
  missionTier: 0 | 1 | 2
  allowCapabilityFallback?: boolean
  downgradeConfirmed?: boolean
  allowTier2Override?: boolean
  expectedStatus: "success" | "fallback" | "blocked"
  expectedTelemetryType?: "fallback" | "capability_blocked" | "tier_policy_blocked"
}

const BASE_CAPS = {
  url: "wss://relay.example",
  supportsAuth: true,
  supportsGroupKinds: true,
  stableAck: true,
  checkedAt: 100,
}

const MATRIX_CASES: MatrixCase[] = [
  {
    id: "MC-001-r4-tier2-success",
    missionTier: 2,
    expectedStatus: "success",
  },
  {
    id: "MC-002-r3-tier0-fallback",
    missionTier: 0,
    expectedStatus: "fallback",
    expectedTelemetryType: "fallback",
  },
  {
    id: "MC-003-r3-tier0-capability-block",
    missionTier: 0,
    allowCapabilityFallback: false,
    expectedStatus: "blocked",
    expectedTelemetryType: "capability_blocked",
  },
  {
    id: "MC-004-r3-tier1-policy-block",
    missionTier: 1,
    expectedStatus: "blocked",
    expectedTelemetryType: "tier_policy_blocked",
  },
  {
    id: "MC-005-r3-tier1-confirmed-fallback",
    missionTier: 1,
    downgradeConfirmed: true,
    expectedStatus: "fallback",
    expectedTelemetryType: "fallback",
  },
  {
    id: "MC-006-r3-tier2-policy-block",
    missionTier: 2,
    expectedStatus: "blocked",
    expectedTelemetryType: "tier_policy_blocked",
  },
  {
    id: "MC-007-r3-tier2-override-fallback",
    missionTier: 2,
    allowTier2Override: true,
    downgradeConfirmed: true,
    expectedStatus: "fallback",
    expectedTelemetryType: "fallback",
  },
]

describe("app/groups mixed-capability matrix", () => {
  it("validates matrix-grade fallback and policy behavior", async () => {
    const aggregateTelemetry = {
      fallback: 0,
      capability_blocked: 0,
      tier_policy_blocked: 0,
    }

    for (const testCase of MATRIX_CASES) {
      const signerNip44 = testCase.id.includes("r4")
      const result = await simulateMixedCapabilityLane({
        missionTier: testCase.missionTier,
        allowCapabilityFallback: testCase.allowCapabilityFallback,
        downgradeConfirmed: testCase.downgradeConfirmed,
        allowTier2Override: testCase.allowTier2Override,
        capabilities: {
          ...BASE_CAPS,
          signerNip44,
        },
      })

      expect(result.status, testCase.id).toBe(testCase.expectedStatus)

      if (testCase.expectedTelemetryType) {
        expect(
          result.telemetry.some(event => event.type === testCase.expectedTelemetryType),
          testCase.id,
        ).toBe(true)
      }

      const summary = summarizeMixedCapabilityTelemetry(result.telemetry)
      aggregateTelemetry.fallback += summary.fallbackEvents
      aggregateTelemetry.capability_blocked += summary.capabilityBlockedEvents
      aggregateTelemetry.tier_policy_blocked += summary.tierPolicyBlockedEvents
    }

    expect(aggregateTelemetry.fallback).toBeGreaterThanOrEqual(3)
    expect(aggregateTelemetry.capability_blocked).toBeGreaterThanOrEqual(1)
    expect(aggregateTelemetry.tier_policy_blocked).toBeGreaterThanOrEqual(2)
  })
})
