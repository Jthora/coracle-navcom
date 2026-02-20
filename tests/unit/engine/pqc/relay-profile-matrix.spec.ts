import {describe, expect, it} from "vitest"
import {
  evaluateRelayPayloadBudgets,
  selectViableRelaysForPayload,
} from "../../../../src/engine/pqc/relay-payload-budget"
import {
  detectRelaySizeRejectionReason,
  getRelaySizeRejectionNotice,
  resolveRelaySizeFallbackAction,
  selectAlternateRelaysForRetry,
} from "../../../../src/engine/pqc/relay-size-rejection"

type RelayProfile = "permissive" | "constrained" | "mixed"

type RelayMatrixCase = {
  profile: RelayProfile
  policyMode: "strict" | "compatibility"
  allowClassicalFallback: boolean
  payloadBytes: number
  attemptedRelays: string[]
  hintsByRelay: Record<string, number>
  defaultUnknownRelayBudgetBytes: number
  expectedViableRelays: string[]
  expectedBlockedRelays: string[]
  expectedAlternateRelays: string[]
  expectedFallbackAction: "retry-alt-relays" | "fallback-mode" | "block"
}

const relays = ["wss://perm-a", "wss://perm-b", "wss://perm-c"]

const cases: RelayMatrixCase[] = [
  {
    profile: "permissive",
    policyMode: "strict",
    allowClassicalFallback: false,
    payloadBytes: 5000,
    attemptedRelays: ["wss://perm-a"],
    hintsByRelay: {
      "wss://perm-a": 12000,
      "wss://perm-b": 10000,
      "wss://perm-c": 9000,
    },
    defaultUnknownRelayBudgetBytes: 8192,
    expectedViableRelays: ["wss://perm-a", "wss://perm-b", "wss://perm-c"],
    expectedBlockedRelays: [],
    expectedAlternateRelays: ["wss://perm-b", "wss://perm-c"],
    expectedFallbackAction: "retry-alt-relays",
  },
  {
    profile: "constrained",
    policyMode: "strict",
    allowClassicalFallback: false,
    payloadBytes: 5000,
    attemptedRelays: ["wss://perm-a"],
    hintsByRelay: {
      "wss://perm-a": 4096,
      "wss://perm-b": 3500,
      "wss://perm-c": 3000,
    },
    defaultUnknownRelayBudgetBytes: 4096,
    expectedViableRelays: [],
    expectedBlockedRelays: ["wss://perm-a", "wss://perm-b", "wss://perm-c"],
    expectedAlternateRelays: [],
    expectedFallbackAction: "block",
  },
  {
    profile: "constrained",
    policyMode: "compatibility",
    allowClassicalFallback: true,
    payloadBytes: 5000,
    attemptedRelays: ["wss://perm-a"],
    hintsByRelay: {
      "wss://perm-a": 4096,
      "wss://perm-b": 3500,
      "wss://perm-c": 3000,
    },
    defaultUnknownRelayBudgetBytes: 4096,
    expectedViableRelays: [],
    expectedBlockedRelays: ["wss://perm-a", "wss://perm-b", "wss://perm-c"],
    expectedAlternateRelays: [],
    expectedFallbackAction: "fallback-mode",
  },
  {
    profile: "mixed",
    policyMode: "strict",
    allowClassicalFallback: false,
    payloadBytes: 5000,
    attemptedRelays: ["wss://perm-a"],
    hintsByRelay: {
      "wss://perm-a": 3500,
      "wss://perm-b": 8000,
      "wss://perm-c": 3000,
    },
    defaultUnknownRelayBudgetBytes: 4096,
    expectedViableRelays: ["wss://perm-b"],
    expectedBlockedRelays: ["wss://perm-a", "wss://perm-c"],
    expectedAlternateRelays: ["wss://perm-b"],
    expectedFallbackAction: "retry-alt-relays",
  },
]

describe("engine/pqc/relay-profile-matrix", () => {
  it("detects and surfaces relay size rejection diagnostics", () => {
    const reason = detectRelaySizeRejectionReason("event too large for relay policy")
    const notice = getRelaySizeRejectionNotice("event too large for relay policy")

    expect(reason).toBe("RELAY_EVENT_TOO_LARGE")
    expect(notice?.reason).toBe("RELAY_EVENT_TOO_LARGE")
  })

  it.each(cases)(
    "evaluates profile=$profile policy=$policyMode fallback=$allowClassicalFallback",
    ({
      policyMode,
      allowClassicalFallback,
      payloadBytes,
      attemptedRelays,
      hintsByRelay,
      defaultUnknownRelayBudgetBytes,
      expectedViableRelays,
      expectedBlockedRelays,
      expectedAlternateRelays,
      expectedFallbackAction,
    }) => {
      const viability = selectViableRelaysForPayload({
        relays,
        payloadBytes,
        hintsByRelay,
        defaultUnknownRelayBudgetBytes,
      })

      expect(viability.viableRelays).toEqual(expectedViableRelays)
      expect(viability.blockedRelays).toEqual(expectedBlockedRelays)

      const evaluations = evaluateRelayPayloadBudgets({
        relays,
        payloadBytes,
        hintsByRelay,
        defaultUnknownRelayBudgetBytes,
      })

      const alternates = selectAlternateRelaysForRetry({
        evaluations,
        attemptedRelays,
      })

      expect(alternates).toEqual(expectedAlternateRelays)

      const action = resolveRelaySizeFallbackAction({
        policyMode,
        allowClassicalFallback,
        alternateRelays: alternates,
      })

      expect(action.action).toBe(expectedFallbackAction)
    },
  )
})
