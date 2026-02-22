import {evaluateTierPolicy, type GroupMissionTier} from "src/engine/group-tier-policy"

export type SecureGroupSendTierPolicyInput = {
  groupId: string
  missionTier?: GroupMissionTier
  actorRole?: string
  requestedMode?: string
  resolvedMode?: string
  downgradeConfirmed?: boolean
  allowTier2Override?: boolean
}

export type SecureGroupSendTierPolicyResult =
  | {ok: true}
  | {
      ok: false
      reason: string
    }

export const evaluateSecureGroupSendTierPolicy = ({
  groupId,
  missionTier = 0,
  actorRole = "member",
  requestedMode = "secure-nip-ee",
  resolvedMode = "secure-nip-ee",
  downgradeConfirmed = false,
  allowTier2Override = false,
}: SecureGroupSendTierPolicyInput): SecureGroupSendTierPolicyResult => {
  const evaluated = evaluateTierPolicy({
    missionTier,
    groupId,
    actorRole,
    requestedMode,
    resolvedMode,
    downgradeConfirmed,
    allowTier2Override,
  })

  if (evaluated.ok === false) {
    return {
      ok: false,
      reason: evaluated.reason,
    }
  }

  return {ok: true}
}
