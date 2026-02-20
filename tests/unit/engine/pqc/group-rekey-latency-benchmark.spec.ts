import {describe, expect, it} from "vitest"
import {
  benchmarkGroupRekeyLatency,
  DEFAULT_GROUP_REKEY_LATENCY_THRESHOLDS,
  evaluateGroupRekeyLatencyThresholds,
} from "../../../../src/engine/pqc/group-rekey-latency-benchmark"

describe("engine/pqc/group-rekey-latency-benchmark", () => {
  it("captures add/remove/churn benchmark summaries", () => {
    const iterations =
      process.env.PQC_PRINT_BASELINE === "1"
        ? Number.parseInt(process.env.PQC_GROUP_BENCH_ITERATIONS || "50", 10)
        : 5

    const result = benchmarkGroupRekeyLatency({
      iterations,
      churnBatchSize: 8,
    })

    if (process.env.PQC_PRINT_BASELINE === "1") {
      console.log(`PQC_GROUP_REKEY_BASELINE:${JSON.stringify(result)}`)
    }

    expect(result.addMemberRekey.count).toBe(iterations)
    expect(result.removeMemberRekey.count).toBe(iterations)
    expect(result.churnBatchRekey.count).toBe(iterations)
    expect(result.combinedMembershipRekey.count).toBe(iterations * 2)
    expect(result.churnBatchRekey.p95).toBeGreaterThanOrEqual(0)
  })

  it("evaluates threshold pass/fail state deterministically", () => {
    const result = {
      addMemberRekey: {
        count: 3,
        min: 1,
        max: 3,
        mean: 2,
        p50: 2,
        p95: 3,
        p99: 3,
      },
      removeMemberRekey: {
        count: 3,
        min: 1,
        max: 4,
        mean: 2,
        p50: 2,
        p95: 4,
        p99: 4,
      },
      churnBatchRekey: {
        count: 3,
        min: 2,
        max: 9,
        mean: 4,
        p50: 3,
        p95: 9,
        p99: 9,
      },
      combinedMembershipRekey: {
        count: 6,
        min: 1,
        max: 4,
        mean: 2,
        p50: 2,
        p95: 4,
        p99: 4,
      },
    }

    const pass = evaluateGroupRekeyLatencyThresholds(result)

    expect(pass.pass).toBe(true)

    const fail = evaluateGroupRekeyLatencyThresholds(result, {
      addOrRemoveP95Ms: 2,
      addOrRemoveP99Ms: 3,
      churnBatchP95Ms: 8,
      churnBatchP99Ms: 8,
    })

    expect(fail.pass).toBe(false)
    expect(fail.thresholds).not.toEqual(DEFAULT_GROUP_REKEY_LATENCY_THRESHOLDS)
  })
})
