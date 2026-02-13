import type {GroupMemberRole} from "src/domain/group"

export type GroupTransportModeId = "baseline-nip29" | "secure-nip-ee" | string

export type GroupCapabilitySnapshot = {
  readiness?: "R0" | "R1" | "R2" | "R3" | "R4"
  reasons?: string[]
}

export type GroupTransportControlAction =
  | "create"
  | "join"
  | "leave"
  | "put-member"
  | "remove-member"
  | "edit-metadata"

export type GroupTransportControlPayload = {
  groupId: string
  title?: string
  description?: string
  picture?: string
  memberPubkey?: string
  role?: GroupMemberRole
  reason?: string
}

export type GroupTransportControlRequest = {
  action: GroupTransportControlAction
  payload: GroupTransportControlPayload
  actorRole: GroupMemberRole
  requestedMode: GroupTransportModeId
  createdAt: number
}

export type GroupTransportErrorCode =
  | "GROUP_TRANSPORT_UNSUPPORTED"
  | "GROUP_TRANSPORT_CAPABILITY_BLOCKED"
  | "GROUP_TRANSPORT_VALIDATION_FAILED"
  | "GROUP_TRANSPORT_DISPATCH_FAILED"

export type GroupTransportSuccess<T = unknown> = {
  ok: true
  value: T
}

export type GroupTransportFailure = {
  ok: false
  code: GroupTransportErrorCode
  message: string
  retryable: boolean
  details?: unknown
}

export type GroupTransportResult<T = unknown> = GroupTransportSuccess<T> | GroupTransportFailure

export type GroupTransportSubscribeHandlers = {
  onEvent: (event: unknown) => void
  onNotice?: (notice: unknown) => void
  onError?: (error: unknown) => void
}

export type GroupTransportSubscription = {
  unsubscribe: () => void
}

export type GroupTransportCanOperateInput = {
  requestedMode: GroupTransportModeId
  capabilitySnapshot?: GroupCapabilitySnapshot
}

export type GroupTransportCanOperateResult = {
  ok: boolean
  reason?: string
}

export type GroupTransportDiagnostics = {
  onResolved?: (input: {intent: GroupTransportControlRequest; adapterId: string}) => void
  onFallback?: (input: {
    intent: GroupTransportControlRequest
    requestedMode: string
    adapterId: string
    reason?: string
  }) => void
  onCapabilityBlocked?: (input: {
    intent: GroupTransportControlRequest
    requestedMode: string
    reason?: string
  }) => void
  onTierPolicyBlocked?: (input: {
    intent: GroupTransportControlRequest
    missionTier: 0 | 1 | 2
    reason: string
  }) => void
  onTierOverride?: (input: {
    intent: GroupTransportControlRequest
    auditEvent: {
      action: string
      groupId: string
      missionTier: 0 | 1 | 2
      requestedMode: GroupTransportModeId
      resolvedMode: GroupTransportModeId
      actorRole: string
      createdAt: number
      reason: string
    }
  }) => void
}

export interface GroupTransport {
  getModeId: () => GroupTransportModeId
  start?: () => Promise<void> | void
  stop?: () => Promise<void> | void
  canOperate: (input: GroupTransportCanOperateInput) => GroupTransportCanOperateResult
  sendMessage?: (
    input: unknown,
  ) => Promise<GroupTransportResult<unknown>> | GroupTransportResult<unknown>
  subscribe?: (
    input: {groupId: string; cursor?: string | number},
    handlers: GroupTransportSubscribeHandlers,
  ) =>
    | Promise<GroupTransportResult<GroupTransportSubscription>>
    | GroupTransportResult<GroupTransportSubscription>
  publishControlAction: (
    request: GroupTransportControlRequest,
  ) => Promise<GroupTransportResult<unknown>> | GroupTransportResult<unknown>
  reconcile?: (input: {
    groupId: string
    remoteEvents: unknown[]
    localState?: unknown
  }) => Promise<GroupTransportResult<unknown>> | GroupTransportResult<unknown>
}

export const okTransportResult = <T>(value: T): GroupTransportSuccess<T> => ({ok: true, value})

export const errTransportResult = (
  code: GroupTransportErrorCode,
  message: string,
  retryable = false,
  details?: unknown,
): GroupTransportFailure => ({ok: false, code, message, retryable, details})
