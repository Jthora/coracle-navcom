import {describe, it, expect, beforeEach, vi} from "vitest"
import {
  verifyEventSignature,
  getVerificationStats,
  resetVerificationStats,
} from "src/engine/event-verification"

// Mock verifyEvent from welshman
vi.mock("@welshman/util", () => ({
  verifyEvent: vi.fn(),
}))

import {verifyEvent} from "@welshman/util"
const mockVerifyEvent = verifyEvent as ReturnType<typeof vi.fn>

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "abc12345deadbeef",
    pubkey: "pub12345deadbeef",
    kind: 1,
    created_at: 1711000000,
    content: "hello",
    tags: [],
    sig: "sig12345",
    ...overrides,
  } as any
}

describe("event-verification", () => {
  beforeEach(() => {
    mockVerifyEvent.mockReset()
    resetVerificationStats()
  })

  it("accepts events with valid signatures", () => {
    mockVerifyEvent.mockReturnValue(true)

    const result = verifyEventSignature(makeEvent())
    expect(result).toBe(true)
    expect(getVerificationStats().verified).toBe(1)
  })

  it("rejects critical events with invalid signatures", () => {
    mockVerifyEvent.mockReturnValue(false)

    // kind 0 = profile metadata (critical)
    const result = verifyEventSignature(makeEvent({kind: 0}))
    expect(result).toBe(false)
    expect(getVerificationStats().rejected).toBe(1)
  })

  it("accepts non-critical events with invalid signatures (logged)", () => {
    mockVerifyEvent.mockReturnValue(false)

    // kind 1 = text note (non-critical)
    const result = verifyEventSignature(makeEvent({kind: 1}))
    expect(result).toBe(true)
  })

  it("rejects critical events with missing signature", () => {
    const result = verifyEventSignature(makeEvent({kind: 3, sig: undefined}))
    expect(result).toBe(false)
    expect(getVerificationStats().rejected).toBe(1)
  })

  it("accepts non-critical events with missing signature", () => {
    const result = verifyEventSignature(makeEvent({kind: 1, sig: undefined}))
    expect(result).toBe(true)
  })

  it("rejects all critical event kinds with bad signature", () => {
    mockVerifyEvent.mockReturnValue(false)

    const criticalKinds = [0, 3, 4, 10002, 27, 1059, 30078]
    for (const kind of criticalKinds) {
      expect(verifyEventSignature(makeEvent({kind}))).toBe(false)
    }
    expect(getVerificationStats().rejected).toBe(criticalKinds.length)
  })

  it("tracks verification statistics", () => {
    mockVerifyEvent.mockReturnValue(true)
    verifyEventSignature(makeEvent())
    verifyEventSignature(makeEvent({id: "other1234"}))

    mockVerifyEvent.mockReturnValue(false)
    verifyEventSignature(makeEvent({kind: 0, id: "bad12345"}))

    expect(getVerificationStats()).toEqual({verified: 2, rejected: 1})
  })

  it("resetVerificationStats clears counters", () => {
    mockVerifyEvent.mockReturnValue(true)
    verifyEventSignature(makeEvent())
    resetVerificationStats()
    expect(getVerificationStats()).toEqual({verified: 0, rejected: 0})
  })
})
