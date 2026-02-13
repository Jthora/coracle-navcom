import {GROUP_KINDS} from "src/domain/group-kinds"
import type {GroupKeyLifecycleState} from "src/engine/group-key-lifecycle"
import {
  getGroupKeyRotationRetryDelaySeconds,
  resolveGroupKeyRotationPolicy,
  shouldRotateGroupKey,
  type GroupKeyRotationPolicy,
  type GroupKeyRotationTrigger,
} from "src/engine/group-key-rotation-policy"

export type GroupKeyRotationJobStatus = "pending" | "failed" | "completed"

export type GroupKeyRotationJob = {
  groupId: string
  keyId: string
  trigger: GroupKeyRotationTrigger
  status: GroupKeyRotationJobStatus
  scheduledAt: number
  updatedAt: number
  attempts: number
  nextRetryAt?: number
  lastAttemptAt?: number
  lastError?: string
}

export type ScheduleGroupKeyRotationInput = {
  groupId: string
  keyId: string
  trigger: GroupKeyRotationTrigger
  at?: number
}

export type ScheduleGroupKeyRotationIfNeededInput = {
  groupId: string
  keyState?: GroupKeyLifecycleState | null
  trigger: GroupKeyRotationTrigger
  at?: number
}

const MEMBERSHIP_CHANGE_KINDS = new Set<number>([
  GROUP_KINDS.NIP29.JOIN_REQUEST,
  GROUP_KINDS.NIP29.LEAVE_REQUEST,
  GROUP_KINDS.NIP29.PUT_USER,
  GROUP_KINDS.NIP29.REMOVE_USER,
  GROUP_KINDS.NIP_EE.WELCOME,
])

const asKind = (event: unknown) => {
  if (!event || typeof event !== "object") return null

  const candidate = event as Record<string, unknown>

  return typeof candidate.kind === "number" ? candidate.kind : null
}

const hasMembershipChangeEvent = (events: unknown[]) =>
  events.some(event => {
    const kind = asKind(event)

    return typeof kind === "number" && MEMBERSHIP_CHANGE_KINDS.has(kind)
  })

export type GroupKeyRotationService = {
  getPolicy: () => GroupKeyRotationPolicy
  getJob: (groupId: string) => GroupKeyRotationJob | null
  listJobs: () => GroupKeyRotationJob[]
  scheduleRotation: (input: ScheduleGroupKeyRotationInput) => GroupKeyRotationJob
  scheduleRotationIfNeeded: (
    input: ScheduleGroupKeyRotationIfNeededInput,
  ) => GroupKeyRotationJob | null
  scheduleMembershipTriggeredRotation: (input: {
    groupId: string
    keyState?: GroupKeyLifecycleState | null
    remoteEvents: unknown[]
    at?: number
  }) => GroupKeyRotationJob | null
  recordFailure: (groupId: string, error: unknown, at?: number) => GroupKeyRotationJob | null
  canRetry: (groupId: string, at?: number) => boolean
  markRetryScheduled: (groupId: string, at?: number) => GroupKeyRotationJob | null
  completeRotation: (groupId: string, at?: number) => GroupKeyRotationJob | null
  reset: () => void
}

export const createGroupKeyRotationService = (
  policyOverrides: Partial<GroupKeyRotationPolicy> = {},
  nowProvider: () => number = () => Math.floor(Date.now() / 1000),
): GroupKeyRotationService => {
  const policy = resolveGroupKeyRotationPolicy(policyOverrides)
  const jobsByGroup = new Map<string, GroupKeyRotationJob>()

  const getJob = (groupId: string) => jobsByGroup.get(groupId) || null

  const scheduleRotation = ({groupId, keyId, trigger, at}: ScheduleGroupKeyRotationInput) => {
    const now = at ?? nowProvider()
    const existing = getJob(groupId)

    if (existing && existing.status !== "completed") {
      const updated: GroupKeyRotationJob = {
        ...existing,
        keyId,
        trigger,
        status: "pending",
        updatedAt: now,
      }

      jobsByGroup.set(groupId, updated)

      return updated
    }

    const created: GroupKeyRotationJob = {
      groupId,
      keyId,
      trigger,
      status: "pending",
      scheduledAt: now,
      updatedAt: now,
      attempts: 0,
    }

    jobsByGroup.set(groupId, created)

    return created
  }

  const scheduleRotationIfNeeded = ({
    groupId,
    keyState,
    trigger,
    at,
  }: ScheduleGroupKeyRotationIfNeededInput) => {
    const now = at ?? nowProvider()

    if (!shouldRotateGroupKey({keyState, trigger, now, policy})) {
      return null
    }

    const keyId = keyState?.keyId || `secure-session:${groupId}`

    return scheduleRotation({groupId, keyId, trigger, at: now})
  }

  const scheduleMembershipTriggeredRotation = ({
    groupId,
    keyState,
    remoteEvents,
    at,
  }: {
    groupId: string
    keyState?: GroupKeyLifecycleState | null
    remoteEvents: unknown[]
    at?: number
  }) => {
    if (!hasMembershipChangeEvent(remoteEvents)) {
      return null
    }

    return scheduleRotationIfNeeded({
      groupId,
      keyState,
      trigger: "membership-change",
      at,
    })
  }

  const recordFailure = (groupId: string, error: unknown, at?: number) => {
    const now = at ?? nowProvider()
    const current = getJob(groupId)

    if (!current) {
      return null
    }

    const attempts = current.attempts + 1
    const delaySeconds = getGroupKeyRotationRetryDelaySeconds(attempts, policy)
    const exhausted = attempts >= policy.maxRetries

    const failed: GroupKeyRotationJob = {
      ...current,
      status: "failed",
      attempts,
      lastAttemptAt: now,
      updatedAt: now,
      nextRetryAt: exhausted ? undefined : now + delaySeconds,
      lastError: error instanceof Error ? error.message : String(error || "rotation failure"),
    }

    jobsByGroup.set(groupId, failed)

    return failed
  }

  const canRetry = (groupId: string, at?: number) => {
    const now = at ?? nowProvider()
    const job = getJob(groupId)

    if (!job || job.status !== "failed") {
      return false
    }

    if (job.attempts >= policy.maxRetries) {
      return false
    }

    return typeof job.nextRetryAt === "number" && now >= job.nextRetryAt
  }

  const markRetryScheduled = (groupId: string, at?: number) => {
    const now = at ?? nowProvider()
    const job = getJob(groupId)

    if (!job || !canRetry(groupId, now)) {
      return null
    }

    const pending: GroupKeyRotationJob = {
      ...job,
      status: "pending",
      updatedAt: now,
      nextRetryAt: undefined,
    }

    jobsByGroup.set(groupId, pending)

    return pending
  }

  const completeRotation = (groupId: string, at?: number) => {
    const now = at ?? nowProvider()
    const job = getJob(groupId)

    if (!job) {
      return null
    }

    const completed: GroupKeyRotationJob = {
      ...job,
      status: "completed",
      updatedAt: now,
      nextRetryAt: undefined,
      lastError: undefined,
    }

    jobsByGroup.set(groupId, completed)

    return completed
  }

  const reset = () => jobsByGroup.clear()

  return {
    getPolicy: () => policy,
    getJob,
    listJobs: () => Array.from(jobsByGroup.values()),
    scheduleRotation,
    scheduleRotationIfNeeded,
    scheduleMembershipTriggeredRotation,
    recordFailure,
    canRetry,
    markRetryScheduled,
    completeRotation,
    reset,
  }
}

const secureGroupKeyRotationService = createGroupKeyRotationService()

export const scheduleSecureGroupKeyRotationIfNeeded = (
  input: ScheduleGroupKeyRotationIfNeededInput,
) => secureGroupKeyRotationService.scheduleRotationIfNeeded(input)

export const scheduleSecureGroupMembershipTriggeredRotation = (input: {
  groupId: string
  keyState?: GroupKeyLifecycleState | null
  remoteEvents: unknown[]
  at?: number
}) => secureGroupKeyRotationService.scheduleMembershipTriggeredRotation(input)

export const recordSecureGroupKeyRotationFailure = (groupId: string, error: unknown, at?: number) =>
  secureGroupKeyRotationService.recordFailure(groupId, error, at)

export const canRetrySecureGroupKeyRotation = (groupId: string, at?: number) =>
  secureGroupKeyRotationService.canRetry(groupId, at)

export const markSecureGroupKeyRotationRetryScheduled = (groupId: string, at?: number) =>
  secureGroupKeyRotationService.markRetryScheduled(groupId, at)

export const completeSecureGroupKeyRotation = (groupId: string, at?: number) =>
  secureGroupKeyRotationService.completeRotation(groupId, at)

export const getSecureGroupKeyRotationJob = (groupId: string) =>
  secureGroupKeyRotationService.getJob(groupId)

export const listSecureGroupKeyRotationJobs = () => secureGroupKeyRotationService.listJobs()

export const resetSecureGroupKeyRotationService = () => secureGroupKeyRotationService.reset()
