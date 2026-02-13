import type {GroupMemberRole} from "src/domain/group"
import {
  scheduleSecureGroupKeyRotationIfNeeded,
  type GroupKeyRotationJob,
} from "src/engine/group-key-rotation-service"
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

  const rotationJob = scheduleSecureGroupKeyRotationIfNeeded({
    groupId,
    trigger: "compromise-suspected",
    at: now,
  })

  return {
    ok: true,
    membershipRemediated: true,
    revocation,
    rotationScheduled: Boolean(rotationJob),
    rotationJob,
  }
}
