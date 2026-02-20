import {GROUP_KINDS} from "src/domain/group-kinds"
import type {GroupKeyLifecycleState} from "src/engine/group-key-lifecycle"
import {advanceSecureGroupEpochState} from "src/engine/group-epoch-state"
import {createGroupKeyRotationService} from "src/engine/group-key-rotation-service"
import {summarizeLatency, type LatencySummary} from "src/engine/pqc/dm-latency-benchmark"

const defaultNow = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now()

const collectLatencySamples = ({
  iterations,
  run,
  now = defaultNow,
}: {
  iterations: number
  run: () => void
  now?: () => number
}) => {
  const sampleCount = Math.max(1, Math.floor(iterations))
  const samples: number[] = []

  for (let index = 0; index < sampleCount; index += 1) {
    const start = now()
    run()
    const elapsed = now() - start
    samples.push(Math.max(0, elapsed))
  }

  return samples
}

const createMemoryStorage = () => {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}

const createActiveKeyState = (groupId: string, at: number): GroupKeyLifecycleState => ({
  keyId: `secure-session:${groupId}`,
  groupId,
  secretClass: "S2",
  status: "active",
  createdAt: at,
  updatedAt: at,
  useCount: 0,
  usageByAction: {
    send: 0,
    subscribe: 0,
    reconcile: 0,
    control: 0,
  },
})

const createMembershipEvents = (kind: number) => [{kind}]

const createChurnBatchEvents = (batchSize: number) => {
  const normalizedSize = Math.max(1, Math.floor(batchSize))
  const events: {kind: number}[] = []

  for (let index = 0; index < normalizedSize; index += 1) {
    const kind = index % 2 === 0 ? GROUP_KINDS.NIP29.PUT_USER : GROUP_KINDS.NIP29.REMOVE_USER
    events.push({kind})
  }

  return events
}

export type GroupRekeyLatencyThresholds = {
  addOrRemoveP95Ms: number
  addOrRemoveP99Ms: number
  churnBatchP95Ms: number
  churnBatchP99Ms: number
}

export const DEFAULT_GROUP_REKEY_LATENCY_THRESHOLDS: GroupRekeyLatencyThresholds = {
  addOrRemoveP95Ms: 25,
  addOrRemoveP99Ms: 50,
  churnBatchP95Ms: 75,
  churnBatchP99Ms: 120,
}

export type GroupRekeyLatencyBenchmarkInput = {
  iterations?: number
  churnBatchSize?: number
  now?: () => number
}

export type GroupRekeyLatencyBenchmarkResult = {
  addMemberRekey: LatencySummary
  removeMemberRekey: LatencySummary
  churnBatchRekey: LatencySummary
  combinedMembershipRekey: LatencySummary
}

export type GroupRekeyThresholdEvaluation = {
  pass: boolean
  thresholds: GroupRekeyLatencyThresholds
  checks: {
    combinedMembershipP95Pass: boolean
    combinedMembershipP99Pass: boolean
    churnBatchP95Pass: boolean
    churnBatchP99Pass: boolean
  }
}

export const benchmarkGroupRekeyLatency = ({
  iterations = 100,
  churnBatchSize = 50,
  now = defaultNow,
}: GroupRekeyLatencyBenchmarkInput = {}): GroupRekeyLatencyBenchmarkResult => {
  const sampleCount = Math.max(1, Math.floor(iterations))
  const storage = createMemoryStorage()
  const rotationService = createGroupKeyRotationService()
  const churnEvents = createChurnBatchEvents(churnBatchSize)

  let sequence = 0
  const nextGroupId = () => {
    sequence += 1

    return `benchmark-group-${sequence}`
  }

  const addMemberSamples = collectLatencySamples({
    iterations: sampleCount,
    now,
    run: () => {
      const groupId = nextGroupId()
      const keyState = createActiveKeyState(groupId, 1)

      rotationService.scheduleMembershipTriggeredRotation({
        groupId,
        keyState,
        remoteEvents: createMembershipEvents(GROUP_KINDS.NIP29.PUT_USER),
        at: 1,
      })

      advanceSecureGroupEpochState(groupId, {at: 1, storage})
    },
  })

  const removeMemberSamples = collectLatencySamples({
    iterations: sampleCount,
    now,
    run: () => {
      const groupId = nextGroupId()
      const keyState = createActiveKeyState(groupId, 1)

      rotationService.scheduleMembershipTriggeredRotation({
        groupId,
        keyState,
        remoteEvents: createMembershipEvents(GROUP_KINDS.NIP29.REMOVE_USER),
        at: 1,
      })

      advanceSecureGroupEpochState(groupId, {at: 1, storage})
    },
  })

  const churnBatchSamples = collectLatencySamples({
    iterations: sampleCount,
    now,
    run: () => {
      const groupId = nextGroupId()
      const keyState = createActiveKeyState(groupId, 1)

      rotationService.scheduleMembershipTriggeredRotation({
        groupId,
        keyState,
        remoteEvents: churnEvents,
        at: 1,
      })

      advanceSecureGroupEpochState(groupId, {at: 1, storage})
    },
  })

  const addMemberRekey = summarizeLatency(addMemberSamples)
  const removeMemberRekey = summarizeLatency(removeMemberSamples)
  const churnBatchRekey = summarizeLatency(churnBatchSamples)
  const combinedMembershipRekey = summarizeLatency([...addMemberSamples, ...removeMemberSamples])

  return {
    addMemberRekey,
    removeMemberRekey,
    churnBatchRekey,
    combinedMembershipRekey,
  }
}

export const evaluateGroupRekeyLatencyThresholds = (
  result: GroupRekeyLatencyBenchmarkResult,
  thresholds: GroupRekeyLatencyThresholds = DEFAULT_GROUP_REKEY_LATENCY_THRESHOLDS,
): GroupRekeyThresholdEvaluation => {
  const checks = {
    combinedMembershipP95Pass: result.combinedMembershipRekey.p95 <= thresholds.addOrRemoveP95Ms,
    combinedMembershipP99Pass: result.combinedMembershipRekey.p99 <= thresholds.addOrRemoveP99Ms,
    churnBatchP95Pass: result.churnBatchRekey.p95 <= thresholds.churnBatchP95Ms,
    churnBatchP99Pass: result.churnBatchRekey.p99 <= thresholds.churnBatchP99Ms,
  }

  return {
    pass: Object.values(checks).every(Boolean),
    thresholds,
    checks,
  }
}
