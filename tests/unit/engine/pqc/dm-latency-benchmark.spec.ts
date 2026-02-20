import {describe, expect, it} from "vitest"
import {
  benchmarkDmEncryptDecryptLatency,
  percentile,
  runLatencyBenchmark,
  summarizeLatency,
} from "../../../../src/engine/pqc/dm-latency-benchmark"

describe("engine/pqc/dm-latency-benchmark", () => {
  it("calculates percentile using ceiling-rank behavior", () => {
    const values = [5, 1, 3, 2, 4]

    expect(percentile(values, 0.5)).toBe(3)
    expect(percentile(values, 0.95)).toBe(5)
    expect(percentile(values, 0.99)).toBe(5)
    expect(percentile([], 0.5)).toBe(0)
  })

  it("summarizes latency values with p50/p95/p99", () => {
    const summary = summarizeLatency([1, 2, 3, 4, 5])

    expect(summary).toMatchObject({
      count: 5,
      min: 1,
      max: 5,
      mean: 3,
      p50: 3,
      p95: 5,
      p99: 5,
    })
  })

  it("collects deterministic benchmark samples via injected timer", () => {
    const timeline = [100, 101, 200, 204, 300, 303]
    let pointer = 0
    const now = () => {
      const value = timeline[pointer]
      pointer += 1
      return value
    }

    const summary = runLatencyBenchmark({
      iterations: 3,
      now,
      run: () => undefined,
    })

    expect(summary).toMatchObject({
      count: 3,
      min: 1,
      max: 4,
      p50: 3,
      p95: 4,
      p99: 4,
    })
  })

  it("benchmarks DM encrypt/decrypt with strict-vs-compatibility overhead output", () => {
    const iterations =
      process.env.PQC_PRINT_BASELINE === "1"
        ? Number.parseInt(process.env.PQC_DM_BENCH_ITERATIONS || "50", 10)
        : 5

    const result = benchmarkDmEncryptDecryptLatency({
      iterations,
      plaintext: "hello benchmark",
      senderPubkey: "sender",
      recipientPubkey: "recipient",
    })

    if (process.env.PQC_PRINT_BASELINE === "1") {
      console.log(`PQC_DM_BASELINE:${JSON.stringify(result)}`)
    }

    expect(result.encrypt.count).toBe(iterations)
    expect(result.decryptStrict.count).toBe(iterations)
    expect(result.decryptCompatibility.count).toBe(iterations)
    expect(Number.isFinite(result.compatibilityOverhead.p50)).toBe(true)
    expect(Number.isFinite(result.compatibilityOverhead.p95)).toBe(true)
    expect(Number.isFinite(result.compatibilityOverhead.p99)).toBe(true)
  })
})
