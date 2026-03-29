import {buildDmPqcEnvelope} from "src/engine/pqc/dm-envelope"
import type {DmEnvelopeBuildResult} from "src/engine/pqc/dm-envelope"
import {resolveDmReceiveContent} from "src/engine/pqc/dm-receive-envelope"

export type LatencyPercentiles = {
  p50: number
  p95: number
  p99: number
}

export type LatencySummary = LatencyPercentiles & {
  count: number
  min: number
  max: number
  mean: number
}

export type DmLatencyBenchmarkInput = {
  iterations?: number
  plaintext?: string
  senderPubkey?: string
  recipientPubkey?: string
  now?: () => number
}

export type DmLatencyBenchmarkResult = {
  encrypt: LatencySummary
  decryptStrict: LatencySummary
  decryptCompatibility: LatencySummary
  compatibilityOverhead: LatencyPercentiles
}

const defaultNow = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now()

const sortedCopy = (values: number[]) => [...values].sort((a, b) => a - b)

export const percentile = (values: number[], value: number) => {
  if (values.length === 0) {
    return 0
  }

  const sorted = sortedCopy(values)
  const clamped = Math.max(0, Math.min(1, value))
  const rank = Math.ceil(clamped * sorted.length) - 1

  return sorted[Math.max(0, rank)]
}

export const summarizeLatency = (values: number[]): LatencySummary => {
  if (values.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    }
  }

  const sorted = sortedCopy(values)
  const total = sorted.reduce((sum, current) => sum + current, 0)

  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: total / sorted.length,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
  }
}

export const runLatencyBenchmark = ({
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

  return summarizeLatency(samples)
}

export const benchmarkDmEncryptDecryptLatency = ({
  iterations = 100,
  plaintext = "benchmark-message",
  senderPubkey = "benchmark-sender",
  recipientPubkey = "benchmark-recipient",
  now = defaultNow,
}: DmLatencyBenchmarkInput = {}): DmLatencyBenchmarkResult => {
  const encrypt = runLatencyBenchmark({
    iterations,
    now,
    run: () => {
      const result = buildDmPqcEnvelope({
        plaintext,
        senderPubkey,
        recipients: [recipientPubkey],
        mode: "hybrid",
        algorithm: "hybrid-mlkem768+x25519-aead-v1",
        recipientPqPublicKeys: new Map(),
      } as any) as unknown as DmEnvelopeBuildResult

      if (result.ok === false) {
        throw new Error(result.message)
      }
    },
  })

  const envelope = buildDmPqcEnvelope({
    plaintext,
    senderPubkey,
    recipients: [recipientPubkey],
    mode: "hybrid",
    algorithm: "hybrid-mlkem768+x25519-aead-v1",
    recipientPqPublicKeys: new Map(),
  } as any) as unknown as DmEnvelopeBuildResult

  if (envelope.ok === false) {
    throw new Error(envelope.message)
  }

  const decryptStrict = runLatencyBenchmark({
    iterations,
    now,
    run: () => {
      resolveDmReceiveContent({
        tags: [["pqc", "hybrid"]],
        decryptedContent: envelope.content,
        policyMode: "strict",
        expectedSenderPubkey: senderPubkey,
        expectedRecipientPubkey: recipientPubkey,
        recipientSecretKey: new Uint8Array(0),
        recipientPubkey,
        senderPubkey,
      } as any)
    },
  })

  const decryptCompatibility = runLatencyBenchmark({
    iterations,
    now,
    run: () => {
      resolveDmReceiveContent({
        tags: [["pqc", "hybrid"]],
        decryptedContent: envelope.content,
        policyMode: "compatibility",
        allowLegacyFallback: true,
        expectedSenderPubkey: senderPubkey,
        expectedRecipientPubkey: recipientPubkey,
        recipientSecretKey: new Uint8Array(0),
        recipientPubkey,
        senderPubkey,
      } as any)
    },
  })

  return {
    encrypt,
    decryptStrict,
    decryptCompatibility,
    compatibilityOverhead: {
      p50: decryptCompatibility.p50 - decryptStrict.p50,
      p95: decryptCompatibility.p95 - decryptStrict.p95,
      p99: decryptCompatibility.p99 - decryptStrict.p99,
    },
  }
}
