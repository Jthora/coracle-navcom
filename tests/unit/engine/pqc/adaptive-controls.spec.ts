import {describe, expect, it} from "vitest"
import {
  DEFAULT_ADAPTIVE_FALLBACK_THRESHOLDS,
  evaluateAdaptiveFallbackPrompt,
  resolveAdaptiveBehaviorDecision,
} from "../../../../src/engine/pqc/adaptive-controls"

describe("engine/pqc/adaptive-controls", () => {
  it("returns no prompt when performance signals are below thresholds", () => {
    const decision = evaluateAdaptiveFallbackPrompt({
      dmEncryptP95Ms: DEFAULT_ADAPTIVE_FALLBACK_THRESHOLDS.dmEncryptP95Ms - 1,
      dmDecryptP95Ms: DEFAULT_ADAPTIVE_FALLBACK_THRESHOLDS.dmDecryptP95Ms - 1,
      groupChurnRekeyP95Ms: DEFAULT_ADAPTIVE_FALLBACK_THRESHOLDS.groupChurnRekeyP95Ms - 1,
      breachStreakCount: 1,
    })

    expect(decision).toEqual({
      shouldPrompt: false,
      severity: "none",
      reasonCodes: [],
    })
  })

  it("emits high-severity prompt when latency exceeds thresholds significantly", () => {
    const decision = evaluateAdaptiveFallbackPrompt({
      dmEncryptP95Ms: DEFAULT_ADAPTIVE_FALLBACK_THRESHOLDS.dmEncryptP95Ms * 2,
      dmDecryptP95Ms: DEFAULT_ADAPTIVE_FALLBACK_THRESHOLDS.dmDecryptP95Ms,
      groupChurnRekeyP95Ms: DEFAULT_ADAPTIVE_FALLBACK_THRESHOLDS.groupChurnRekeyP95Ms,
      breachStreakCount: DEFAULT_ADAPTIVE_FALLBACK_THRESHOLDS.breachStreakCount,
    })

    expect(decision.shouldPrompt).toBe(true)
    expect(decision.severity).toBe("high")
    expect(decision.reasonCodes).toContain("DM_ENCRYPT_LATENCY_HIGH")
    expect(decision.reasonCodes).toContain("PERFORMANCE_DEGRADATION_STREAK")
  })

  it("prevents auto fallback in strict policy mode", () => {
    const decision = resolveAdaptiveBehaviorDecision({
      policyMode: "strict",
      allowClassicalFallback: true,
      userConfirmedDowngrade: true,
      autoFallbacksUsed: 0,
    })

    expect(decision).toMatchObject({
      canAutoFallback: false,
      remainingAutoFallbacks: 0,
      requiresUserConfirmation: true,
      policyMode: "strict",
    })
  })

  it("allows bounded compatibility fallback only after confirmation", () => {
    const pending = resolveAdaptiveBehaviorDecision({
      policyMode: "compatibility",
      allowClassicalFallback: true,
      userConfirmedDowngrade: false,
      autoFallbacksUsed: 0,
    })

    expect(pending.canAutoFallback).toBe(false)
    expect(pending.requiresUserConfirmation).toBe(true)

    const approved = resolveAdaptiveBehaviorDecision({
      policyMode: "compatibility",
      allowClassicalFallback: true,
      userConfirmedDowngrade: true,
      autoFallbacksUsed: 1,
    })

    expect(approved.canAutoFallback).toBe(true)
    expect(approved.remainingAutoFallbacks).toBe(2)
    expect(approved.requiresUserConfirmation).toBe(false)
  })
})
