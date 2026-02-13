import type {GroupTransportModeId} from "src/engine/group-transport-contracts"

export type GroupMissionTier = 0 | 1 | 2

export type GroupTierOverrideAuditEvent = {
  action: "tier-policy-override"
  groupId: string
  missionTier: GroupMissionTier
  requestedMode: GroupTransportModeId
  resolvedMode: GroupTransportModeId
  actorRole: string
  createdAt: number
  reason: string
}

export type EvaluateTierPolicyInput = {
  missionTier: GroupMissionTier
  groupId: string
  actorRole: string
  requestedMode: GroupTransportModeId
  resolvedMode: GroupTransportModeId
  downgradeConfirmed?: boolean
  allowTier2Override?: boolean
  now?: number
}

export type EvaluateTierPolicyResult =
  | {
      ok: true
      overrideAuditEvent?: GroupTierOverrideAuditEvent
    }
  | {
      ok: false
      reason: string
    }

const isDowngrade = (requestedMode: GroupTransportModeId, resolvedMode: GroupTransportModeId) =>
  requestedMode === "secure-nip-ee" && resolvedMode !== "secure-nip-ee"

export const evaluateTierPolicy = ({
  missionTier,
  groupId,
  actorRole,
  requestedMode,
  resolvedMode,
  downgradeConfirmed = false,
  allowTier2Override = false,
  now = Math.floor(Date.now() / 1000),
}: EvaluateTierPolicyInput): EvaluateTierPolicyResult => {
  if (missionTier === 0) {
    return {ok: true}
  }

  const downgrade = isDowngrade(requestedMode, resolvedMode)

  if (missionTier === 1 && downgrade && !downgradeConfirmed) {
    return {
      ok: false,
      reason: "Tier policy blocked: Tier 1 secure downgrade requires explicit confirmation.",
    }
  }

  if (missionTier === 2) {
    if (requestedMode !== "secure-nip-ee" && !allowTier2Override) {
      return {
        ok: false,
        reason: "Tier policy blocked: Tier 2 requires secure mode lock.",
      }
    }

    if (downgrade && !allowTier2Override) {
      return {
        ok: false,
        reason: "Tier policy blocked: Tier 2 does not allow automatic downgrade.",
      }
    }

    if ((requestedMode !== "secure-nip-ee" || downgrade) && allowTier2Override) {
      if (!downgradeConfirmed) {
        return {
          ok: false,
          reason: "Tier policy blocked: Tier 2 override requires explicit confirmation.",
        }
      }

      return {
        ok: true,
        overrideAuditEvent: {
          action: "tier-policy-override",
          groupId,
          missionTier,
          requestedMode,
          resolvedMode,
          actorRole,
          createdAt: now,
          reason: "Tier 2 downgrade override acknowledged",
        },
      }
    }
  }

  return {ok: true}
}
