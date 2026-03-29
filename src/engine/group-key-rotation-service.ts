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
  idempotencyKey: string
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

const SECURE_GROUP_KEY_ROTATION_SCHEMA_VERSION = 1 as const
const SECURE_GROUP_KEY_ROTATION_STORAGE_KEY = "secure-group-key-rotation-jobs"

type StorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export type SecureGroupKeyRotationReplaySummary = {
  loadedJobs: number
  alreadyPending: number
  resumedFromFailed: number
  deferredFailed: number
  reconciledFailed: number
  exhaustedFailed: number
  completedJobs: number
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

const makeIdempotencyKey = ({groupId, keyId, trigger}: ScheduleGroupKeyRotationInput) =>
  `group-rotation:${groupId}:${keyId}:${trigger}`

const isRotationJobStatus = (status: unknown): status is GroupKeyRotationJobStatus =>
  status === "pending" || status === "failed" || status === "completed"

const isGroupKeyRotationJob = (input: unknown): input is GroupKeyRotationJob => {
  if (!input || typeof input !== "object") {
    return false
  }

  const candidate = input as Record<string, unknown>

  return (
    typeof candidate.groupId === "string" &&
    typeof candidate.keyId === "string" &&
    typeof candidate.trigger === "string" &&
    typeof candidate.idempotencyKey === "string" &&
    isRotationJobStatus(candidate.status) &&
    typeof candidate.scheduledAt === "number" &&
    typeof candidate.updatedAt === "number" &&
    typeof candidate.attempts === "number" &&
    (candidate.nextRetryAt === undefined || typeof candidate.nextRetryAt === "number") &&
    (candidate.lastAttemptAt === undefined || typeof candidate.lastAttemptAt === "number") &&
    (candidate.lastError === undefined || typeof candidate.lastError === "string")
  )
}

const loadPersistedRotationJobs = (storage: StorageLike | null | undefined, storageKey: string) => {
  if (!storage) {
    return []
  }

  try {
    const raw = storage.getItem(storageKey)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as {
      schema?: unknown
      jobs?: unknown
    }

    if (
      parsed?.schema !== SECURE_GROUP_KEY_ROTATION_SCHEMA_VERSION ||
      !Array.isArray(parsed.jobs)
    ) {
      storage.removeItem(storageKey)
      return []
    }

    return parsed.jobs.filter(isGroupKeyRotationJob)
  } catch {
    try {
      storage.removeItem(storageKey)
    } catch {
      /* noop */
    }

    return []
  }
}

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
  replayPendingJobs: (at?: number) => SecureGroupKeyRotationReplaySummary
  reset: () => void
}

export const createGroupKeyRotationService = (
  policyOverrides: Partial<GroupKeyRotationPolicy> = {},
  nowProvider: () => number = () => Math.floor(Date.now() / 1000),
  {
    storage,
    storageKey = SECURE_GROUP_KEY_ROTATION_STORAGE_KEY,
  }: {storage?: StorageLike | null; storageKey?: string} = {},
): GroupKeyRotationService => {
  const policy = resolveGroupKeyRotationPolicy(policyOverrides)
  const jobsByGroup = new Map<string, GroupKeyRotationJob>()

  const persist = () => {
    if (!storage) {
      return
    }

    try {
      storage.setItem(
        storageKey,
        JSON.stringify({
          schema: SECURE_GROUP_KEY_ROTATION_SCHEMA_VERSION,
          jobs: Array.from(jobsByGroup.values()),
        }),
      )
    } catch {
      /* noop */
    }
  }

  for (const job of loadPersistedRotationJobs(storage, storageKey)) {
    jobsByGroup.set(job.groupId, job)
  }

  const getJob = (groupId: string) => jobsByGroup.get(groupId) || null

  const scheduleRotation = ({groupId, keyId, trigger, at}: ScheduleGroupKeyRotationInput) => {
    const now = at ?? nowProvider()
    const existing = getJob(groupId)

    if (existing && existing.status !== "completed") {
      const updated: GroupKeyRotationJob = {
        ...existing,
        keyId,
        trigger,
        idempotencyKey: makeIdempotencyKey({groupId, keyId, trigger}),
        status: "pending",
        updatedAt: now,
      }

      jobsByGroup.set(groupId, updated)
      persist()

      return updated
    }

    const created: GroupKeyRotationJob = {
      groupId,
      keyId,
      trigger,
      idempotencyKey: makeIdempotencyKey({groupId, keyId, trigger}),
      status: "pending",
      scheduledAt: now,
      updatedAt: now,
      attempts: 0,
    }

    jobsByGroup.set(groupId, created)
    persist()

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
    persist()

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
    persist()

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
    persist()

    return completed
  }

  const replayPendingJobs = (at?: number): SecureGroupKeyRotationReplaySummary => {
    const now = at ?? nowProvider()
    const summary: SecureGroupKeyRotationReplaySummary = {
      loadedJobs: jobsByGroup.size,
      alreadyPending: 0,
      resumedFromFailed: 0,
      deferredFailed: 0,
      reconciledFailed: 0,
      exhaustedFailed: 0,
      completedJobs: 0,
    }

    let changed = false

    for (const job of jobsByGroup.values()) {
      if (job.status === "pending") {
        summary.alreadyPending += 1
        continue
      }

      if (job.status === "completed") {
        summary.completedJobs += 1
        continue
      }

      if (job.attempts >= policy.maxRetries) {
        summary.exhaustedFailed += 1
        continue
      }

      if (typeof job.nextRetryAt !== "number") {
        const reconciled: GroupKeyRotationJob = {
          ...job,
          status: "pending",
          nextRetryAt: undefined,
          updatedAt: now,
        }

        jobsByGroup.set(job.groupId, reconciled)
        summary.reconciledFailed += 1
        changed = true
        continue
      }

      if (now >= job.nextRetryAt) {
        const resumed: GroupKeyRotationJob = {
          ...job,
          status: "pending",
          nextRetryAt: undefined,
          updatedAt: now,
        }

        jobsByGroup.set(job.groupId, resumed)
        summary.resumedFromFailed += 1
        changed = true
        continue
      }

      summary.deferredFailed += 1
    }

    if (changed) {
      persist()
    }

    return summary
  }

  const reset = () => {
    jobsByGroup.clear()
    persist()
  }

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
    replayPendingJobs,
    reset,
  }
}

const defaultStorage =
  typeof globalThis !== "undefined" && "localStorage" in globalThis
    ? (globalThis.localStorage as StorageLike)
    : null

const secureGroupKeyRotationService = createGroupKeyRotationService(
  {},
  () => Math.floor(Date.now() / 1000),
  {storage: defaultStorage},
)

export const scheduleSecureGroupKeyRotationIfNeeded = (
  input: ScheduleGroupKeyRotationIfNeededInput,
) => secureGroupKeyRotationService.scheduleRotationIfNeeded(input)

export const scheduleSecureGroupMembershipTriggeredRotation = (input: {
  groupId: string
  keyState?: GroupKeyLifecycleState | null
  remoteEvents: unknown[]
  at?: number
}) => secureGroupKeyRotationService.scheduleMembershipTriggeredRotation(input)

export const scheduleSecureGroupCompromiseRemediationRotation = ({
  groupId,
  keyState,
  at,
}: {
  groupId: string
  keyState?: GroupKeyLifecycleState | null
  at?: number
}) =>
  secureGroupKeyRotationService.scheduleRotationIfNeeded({
    groupId,
    keyState,
    trigger: "compromise-suspected",
    at,
  })

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

export const replaySecureGroupKeyRotationJobs = (at?: number) =>
  secureGroupKeyRotationService.replayPendingJobs(at)

export const resetSecureGroupKeyRotationService = () => secureGroupKeyRotationService.reset()
