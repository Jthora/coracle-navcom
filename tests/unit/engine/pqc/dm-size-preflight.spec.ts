import {describe, expect, it} from "vitest"
import {
  estimatePayloadSizeBytes,
  runDmPayloadSizePreflight,
} from "../../../../src/engine/pqc/dm-size-preflight"

describe("engine/pqc/dm-size-preflight", () => {
  it("estimates utf8 payload size", () => {
    expect(estimatePayloadSizeBytes("abc")).toBeGreaterThanOrEqual(3)
    expect(estimatePayloadSizeBytes("😀")).toBeGreaterThanOrEqual(4)
  })

  it("allows payloads within limit", () => {
    const result = runDmPayloadSizePreflight({
      content: "hello",
      maxBytes: 1024,
      policyMode: "strict",
    })

    expect(result.allowed).toBe(true)
    expect(result.shouldFallback).toBe(false)
    expect(result.reason).toBe("DM_PAYLOAD_WITHIN_LIMIT")
  })

  it("blocks oversize payload in strict mode", () => {
    const result = runDmPayloadSizePreflight({
      content: "x".repeat(2048),
      maxBytes: 32,
      policyMode: "strict",
    })

    expect(result.allowed).toBe(false)
    expect(result.shouldFallback).toBe(false)
    expect(result.reason).toBe("DM_PAYLOAD_OVERSIZE_BLOCKED")
  })

  it("routes oversize payload to fallback in compatibility mode", () => {
    const result = runDmPayloadSizePreflight({
      content: "x".repeat(2048),
      maxBytes: 32,
      policyMode: "compatibility",
      allowClassicalFallback: true,
    })

    expect(result.allowed).toBe(true)
    expect(result.shouldFallback).toBe(true)
    expect(result.reason).toBe("DM_PAYLOAD_OVERSIZE_FALLBACK")
  })
})
