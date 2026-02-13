import type {GroupMemberRole} from "src/domain/group"
import {revokeSecureGroupKeys} from "src/engine/group-key-lifecycle"

export type GroupKeyRevocationAuditEvent = {
  action: "key-revocation"
  groupId: string
  compromisedPubkey: string
  actorRole: GroupMemberRole
  reason: string
  correlationId: string
  createdAt: number
  revokedKeyCount: number
}

export type RevokeCompromisedDeviceInput = {
  groupId: string
  compromisedPubkey: string
  actorRole: GroupMemberRole
  reason?: string
  correlationId?: string
  now?: number
}

export type RevokeCompromisedDeviceResult = {
  ok: boolean
  revokedKeyCount: number
  auditEvent: GroupKeyRevocationAuditEvent
}

const makeCorrelationId = (groupId: string, compromisedPubkey: string, now: number) =>
  `revocation:${groupId}:${compromisedPubkey.slice(0, 12)}:${now}`

export const revokeCompromisedDeviceForGroup = ({
  groupId,
  compromisedPubkey,
  actorRole,
  reason = "compromised-device",
  correlationId,
  now = Math.floor(Date.now() / 1000),
}: RevokeCompromisedDeviceInput): RevokeCompromisedDeviceResult => {
  const revokedKeys = revokeSecureGroupKeys(groupId, now)
  const revokedKeyCount = revokedKeys.length

  const auditEvent: GroupKeyRevocationAuditEvent = {
    action: "key-revocation",
    groupId,
    compromisedPubkey,
    actorRole,
    reason,
    correlationId: correlationId || makeCorrelationId(groupId, compromisedPubkey, now),
    createdAt: now,
    revokedKeyCount,
  }

  return {
    ok: revokedKeyCount > 0,
    revokedKeyCount,
    auditEvent,
  }
}
