import type {PqcPolicyMode} from "src/engine/pqc/negotiation"

export type AdaptiveFallbackThresholds = {
  dmEncryptP95Ms: number
  dmDecryptP95Ms: number
  groupChurnRekeyP95Ms: number
  breachStreakCount: number
}

export const DEFAULT_ADAPTIVE_FALLBACK_THRESHOLDS: AdaptiveFallbackThresholds = {
  dmEncryptP95Ms: 20,
  dmDecryptP95Ms: 25,
  groupChurnRekeyP95Ms: 75,
  breachStreakCount: 3,
}

export type AdaptivePromptReasonCode =
  | "DM_ENCRYPT_LATENCY_HIGH"
  | "DM_DECRYPT_LATENCY_HIGH"
  | "GROUP_REKEY_CHURN_LATENCY_HIGH"
  | "PERFORMANCE_DEGRADATION_STREAK"

export type AdaptiveControlSignals = {
  dmEncryptP95Ms: number
  dmDecryptP95Ms: number
  groupChurnRekeyP95Ms: number
  breachStreakCount?: number
}

export type AdaptiveFallbackPromptDecision = {
  shouldPrompt: boolean
  severity: "none" | "moderate" | "high"
  reasonCodes: AdaptivePromptReasonCode[]
}

const normalizeSignal = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0)

export const evaluateAdaptiveFallbackPrompt = (
  signals: AdaptiveControlSignals,
  thresholds: AdaptiveFallbackThresholds = DEFAULT_ADAPTIVE_FALLBACK_THRESHOLDS,
): AdaptiveFallbackPromptDecision => {
  const reasonCodes: AdaptivePromptReasonCode[] = []

  const dmEncryptP95Ms = normalizeSignal(signals.dmEncryptP95Ms)
  const dmDecryptP95Ms = normalizeSignal(signals.dmDecryptP95Ms)
  const groupChurnRekeyP95Ms = normalizeSignal(signals.groupChurnRekeyP95Ms)
  const breachStreakCount = Math.max(0, Math.floor(signals.breachStreakCount || 0))

  if (dmEncryptP95Ms >= thresholds.dmEncryptP95Ms) {
    reasonCodes.push("DM_ENCRYPT_LATENCY_HIGH")
  }

  if (dmDecryptP95Ms >= thresholds.dmDecryptP95Ms) {
    reasonCodes.push("DM_DECRYPT_LATENCY_HIGH")
  }

  if (groupChurnRekeyP95Ms >= thresholds.groupChurnRekeyP95Ms) {
    reasonCodes.push("GROUP_REKEY_CHURN_LATENCY_HIGH")
  }

  if (breachStreakCount >= thresholds.breachStreakCount) {
    reasonCodes.push("PERFORMANCE_DEGRADATION_STREAK")
  }

  if (reasonCodes.length === 0) {
    return {
      shouldPrompt: false,
      severity: "none",
      reasonCodes,
    }
  }

  const severeThresholdHit =
    dmEncryptP95Ms >= thresholds.dmEncryptP95Ms * 1.5 ||
    dmDecryptP95Ms >= thresholds.dmDecryptP95Ms * 1.5 ||
    groupChurnRekeyP95Ms >= thresholds.groupChurnRekeyP95Ms * 1.5

  return {
    shouldPrompt: true,
    severity: severeThresholdHit ? "high" : "moderate",
    reasonCodes,
  }
}

export type AdaptivePolicySafeLimits = {
  strictModeAllowAutoFallback: boolean
  compatibilityAutoFallbackBudget: number
  requireReasonCode: boolean
  requireUserConfirmation: boolean
}

export const DEFAULT_ADAPTIVE_POLICY_SAFE_LIMITS: AdaptivePolicySafeLimits = {
  strictModeAllowAutoFallback: false,
  compatibilityAutoFallbackBudget: 3,
  requireReasonCode: true,
  requireUserConfirmation: true,
}

export type AdaptiveBehaviorDecisionInput = {
  policyMode: PqcPolicyMode
  allowClassicalFallback: boolean
  userConfirmedDowngrade?: boolean
  autoFallbacksUsed?: number
}

export type AdaptiveBehaviorDecision = {
  canAutoFallback: boolean
  remainingAutoFallbacks: number
  requiresUserConfirmation: boolean
  policyMode: PqcPolicyMode
}

export const resolveAdaptiveBehaviorDecision = (
  input: AdaptiveBehaviorDecisionInput,
  limits: AdaptivePolicySafeLimits = DEFAULT_ADAPTIVE_POLICY_SAFE_LIMITS,
): AdaptiveBehaviorDecision => {
  if (input.policyMode === "strict") {
    return {
      canAutoFallback: limits.strictModeAllowAutoFallback,
      remainingAutoFallbacks: 0,
      requiresUserConfirmation: true,
      policyMode: input.policyMode,
    }
  }

  const used = Math.max(0, Math.floor(input.autoFallbacksUsed || 0))
  const budget = Math.max(0, limits.compatibilityAutoFallbackBudget)
  const remainingAutoFallbacks = Math.max(0, budget - used)
  const requiresUserConfirmation =
    limits.requireUserConfirmation && !Boolean(input.userConfirmedDowngrade)

  const canAutoFallback =
    input.allowClassicalFallback && !requiresUserConfirmation && remainingAutoFallbacks > 0

  return {
    canAutoFallback,
    remainingAutoFallbacks,
    requiresUserConfirmation,
    policyMode: input.policyMode,
  }
}
