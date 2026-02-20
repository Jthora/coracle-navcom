import {afterEach, describe, expect, it} from "vitest"
import {
  resolveDmSendPolicy,
  setDmPeerSecurityContextResolver,
} from "../../../../src/engine/pqc/dm-send-policy"
import {
  PQC_KEY_SCHEMA_VERSION,
  type PqcKeyPublicationRecord,
} from "../../../../src/engine/pqc/key-publication"
import type {PqcNegotiationReasonCode, PqcPolicyMode} from "../../../../src/engine/pqc/negotiation"
import type {DmPqcPreflightTelemetryReason} from "../../../../src/engine/pqc/dm-send-preflight"

const now = 1739836800

type SenderProfile = "hybrid" | "classical-only"
type ReceiverProfile = "hybrid" | "classical-only" | "stale-key"
type UserState = "secure" | "fallback" | "blocked"

type MatrixCase = {
  sender: SenderProfile
  receiver: ReceiverProfile
  policy: PqcPolicyMode
  expectedMode: "hybrid" | "classical" | "blocked"
  expectedReason: PqcNegotiationReasonCode
  expectedTelemetry: DmPqcPreflightTelemetryReason
  expectedUserState: UserState
}

const makePeerKey = (
  overrides: Partial<PqcKeyPublicationRecord> = {},
): PqcKeyPublicationRecord => ({
  schema: PQC_KEY_SCHEMA_VERSION,
  user_pubkey: "f".repeat(64),
  pq_alg: "mlkem768",
  pq_pub: "base64:peer-key",
  key_id: "k-001",
  created_at: now - 120,
  expires_at: now + 3600,
  status: "active",
  ...overrides,
})

const buildReceiverContext = (profile: ReceiverProfile) => {
  if (profile === "hybrid") {
    return {
      peerCapabilities: {
        modes: ["hybrid", "classical"],
        algs: ["hybrid-mlkem768+x25519-aead-v1"],
      },
      peerKeyRecord: makePeerKey(),
      lastValidatedAt: now - 30,
    }
  }

  if (profile === "classical-only") {
    return {
      peerCapabilities: {
        modes: ["classical"],
        algs: [],
      },
      peerKeyRecord: makePeerKey(),
      lastValidatedAt: now - 30,
    }
  }

  return {
    peerCapabilities: {
      modes: ["hybrid", "classical"],
      algs: ["hybrid-mlkem768+x25519-aead-v1"],
    },
    peerKeyRecord: makePeerKey(),
    lastValidatedAt: now - 60 * 60 * 24 * 2,
  }
}

const buildLocalSupportedAlgs = (profile: SenderProfile) =>
  profile === "hybrid" ? ["hybrid-mlkem768+x25519-aead-v1"] : ["classical-x25519-aead-v1"]

const toUserState = (decision: ReturnType<typeof resolveDmSendPolicy>): UserState => {
  if (!decision.allowed) {
    return "blocked"
  }

  if (decision.shouldFallback) {
    return "fallback"
  }

  return "secure"
}

const cases: MatrixCase[] = [
  {
    sender: "hybrid",
    receiver: "hybrid",
    policy: "strict",
    expectedMode: "hybrid",
    expectedReason: "NEGOTIATION_OK_HYBRID",
    expectedTelemetry: "DM_PREFLIGHT_OK",
    expectedUserState: "secure",
  },
  {
    sender: "hybrid",
    receiver: "hybrid",
    policy: "compatibility",
    expectedMode: "hybrid",
    expectedReason: "NEGOTIATION_OK_HYBRID",
    expectedTelemetry: "DM_PREFLIGHT_OK",
    expectedUserState: "secure",
  },
  {
    sender: "hybrid",
    receiver: "classical-only",
    policy: "strict",
    expectedMode: "blocked",
    expectedReason: "NEGOTIATION_NO_SHARED_ALG",
    expectedTelemetry: "DM_NEGOTIATION_FAILED",
    expectedUserState: "blocked",
  },
  {
    sender: "hybrid",
    receiver: "classical-only",
    policy: "compatibility",
    expectedMode: "classical",
    expectedReason: "NEGOTIATION_FALLBACK_CLASSICAL",
    expectedTelemetry: "DM_PREFLIGHT_OK",
    expectedUserState: "fallback",
  },
  {
    sender: "hybrid",
    receiver: "stale-key",
    policy: "strict",
    expectedMode: "blocked",
    expectedReason: "NEGOTIATION_MISSING_KEY",
    expectedTelemetry: "DM_KEY_STALE",
    expectedUserState: "blocked",
  },
  {
    sender: "hybrid",
    receiver: "stale-key",
    policy: "compatibility",
    expectedMode: "classical",
    expectedReason: "NEGOTIATION_FALLBACK_CLASSICAL",
    expectedTelemetry: "DM_KEY_STALE",
    expectedUserState: "fallback",
  },
  {
    sender: "classical-only",
    receiver: "hybrid",
    policy: "strict",
    expectedMode: "blocked",
    expectedReason: "NEGOTIATION_NO_SHARED_ALG",
    expectedTelemetry: "DM_NEGOTIATION_FAILED",
    expectedUserState: "blocked",
  },
  {
    sender: "classical-only",
    receiver: "hybrid",
    policy: "compatibility",
    expectedMode: "classical",
    expectedReason: "NEGOTIATION_FALLBACK_CLASSICAL",
    expectedTelemetry: "DM_PREFLIGHT_OK",
    expectedUserState: "fallback",
  },
  {
    sender: "classical-only",
    receiver: "classical-only",
    policy: "strict",
    expectedMode: "blocked",
    expectedReason: "NEGOTIATION_NO_SHARED_ALG",
    expectedTelemetry: "DM_NEGOTIATION_FAILED",
    expectedUserState: "blocked",
  },
  {
    sender: "classical-only",
    receiver: "classical-only",
    policy: "compatibility",
    expectedMode: "classical",
    expectedReason: "NEGOTIATION_FALLBACK_CLASSICAL",
    expectedTelemetry: "DM_PREFLIGHT_OK",
    expectedUserState: "fallback",
  },
  {
    sender: "classical-only",
    receiver: "stale-key",
    policy: "strict",
    expectedMode: "blocked",
    expectedReason: "NEGOTIATION_NO_SHARED_ALG",
    expectedTelemetry: "DM_KEY_STALE",
    expectedUserState: "blocked",
  },
  {
    sender: "classical-only",
    receiver: "stale-key",
    policy: "compatibility",
    expectedMode: "classical",
    expectedReason: "NEGOTIATION_FALLBACK_CLASSICAL",
    expectedTelemetry: "DM_KEY_STALE",
    expectedUserState: "fallback",
  },
]

describe("engine/pqc/interop-matrix", () => {
  afterEach(() => {
    setDmPeerSecurityContextResolver(null)
  })

  it.each(cases)(
    "resolves sender=$sender receiver=$receiver policy=$policy",
    ({
      sender,
      receiver,
      policy,
      expectedMode,
      expectedReason,
      expectedTelemetry,
      expectedUserState,
    }) => {
      setDmPeerSecurityContextResolver(() => buildReceiverContext(receiver))

      const decision = resolveDmSendPolicy({
        recipients: ["peer"],
        policyMode: policy,
        preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
        localSupportedAlgs: buildLocalSupportedAlgs(sender),
        now,
      })

      expect(decision.mode).toBe(expectedMode)
      expect(toUserState(decision)).toBe(expectedUserState)
      expect(decision.recipientDecisions).toHaveLength(1)
      expect(decision.recipientDecisions[0].negotiation.reason).toBe(expectedReason)
      expect(decision.recipientDecisions[0].telemetryReason).toBe(expectedTelemetry)
    },
  )
})
