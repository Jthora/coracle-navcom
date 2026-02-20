import type {GroupMemberRole} from "src/domain/group"
import {
  scheduleSecureGroupCompromiseRemediationRotation,
  type GroupKeyRotationJob,
} from "src/engine/group-key-rotation-service"
import {
  advanceSecureGroupEpochState,
  ensureSecureGroupEpochState,
  type SecureGroupEpochState,
} from "src/engine/group-epoch-state"
import {
  revokeCompromisedDeviceForGroup,
  type RevokeCompromisedDeviceResult,
} from "src/engine/group-key-revocation"

export type CompromisedDeviceRemediationInput = {
  groupId: string
  compromisedPubkey: string
  actorRole: GroupMemberRole
  reason?: string
  now?: number
  enforceMembershipRemediation: (
    input: {groupId: string; compromisedPubkey: string; reason?: string},
    actorRole: GroupMemberRole,
  ) => Promise<unknown>
}

export type CompromisedDeviceRemediationResult = {
  ok: boolean
  membershipRemediated: boolean
  revocation: RevokeCompromisedDeviceResult
  rotationScheduled: boolean
  rotationJob: GroupKeyRotationJob | null
  epochTransition: {
    supersededEpoch: SecureGroupEpochState
    activeEpoch: SecureGroupEpochState
  }
}

export const remediateCompromisedDevice = async ({
  groupId,
  compromisedPubkey,
  actorRole,
  reason = "compromised-device-remediation",
  now = Math.floor(Date.now() / 1000),
  enforceMembershipRemediation,
}: CompromisedDeviceRemediationInput): Promise<CompromisedDeviceRemediationResult> => {
  await enforceMembershipRemediation({groupId, compromisedPubkey, reason}, actorRole)

  const revocation = revokeCompromisedDeviceForGroup({
    groupId,
    compromisedPubkey,
    actorRole,
    reason,
    now,
  })

  const supersededEpoch = ensureSecureGroupEpochState(groupId, {at: now})
  const activeEpoch = advanceSecureGroupEpochState(groupId, {at: now})

  const rotationJob = scheduleSecureGroupCompromiseRemediationRotation({
    groupId,
    at: now,
  })

  return {
    ok: true,
    membershipRemediated: true,
    revocation,
    rotationScheduled: Boolean(rotationJob),
    rotationJob,
    epochTransition: {
      supersededEpoch,
      activeEpoch,
    },
  }
}
