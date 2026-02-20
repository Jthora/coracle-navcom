import {describe, expect, it} from "vitest"
import {
  resolveDmSendPolicy,
  setDmPeerSecurityContextResolver,
} from "../../../../src/engine/pqc/dm-send-policy"
import {PQC_KEY_SCHEMA_VERSION} from "../../../../src/engine/pqc/key-publication"

const now = 1739836800

const keyRecord = {
  schema: PQC_KEY_SCHEMA_VERSION,
  user_pubkey: "f".repeat(64),
  pq_alg: "mlkem768",
  pq_pub: "base64:pub",
  key_id: "k-001",
  created_at: now - 10,
  expires_at: now + 10_000,
  status: "active" as const,
}

describe("engine/pqc/dm-send-policy", () => {
  it("blocks in strict mode when no peer context is available", () => {
    setDmPeerSecurityContextResolver(() => null)

    const decision = resolveDmSendPolicy({
      recipients: ["p1"],
      policyMode: "strict",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      now,
    })

    expect(decision.allowed).toBe(false)
    expect(decision.mode).toBe("blocked")
  })

  it("falls back in compatibility mode when peer context is missing", () => {
    setDmPeerSecurityContextResolver(() => null)

    const decision = resolveDmSendPolicy({
      recipients: ["p1"],
      policyMode: "compatibility",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      now,
    })

    expect(decision.allowed).toBe(true)
    expect(decision.mode).toBe("classical")
    expect(decision.shouldFallback).toBe(true)
  })

  it("selects hybrid when peer context indicates valid caps and key", () => {
    setDmPeerSecurityContextResolver(() => ({
      peerCapabilities: {
        modes: ["hybrid", "classical"],
        algs: ["hybrid-mlkem768+x25519-aead-v1"],
      },
      peerKeyRecord: keyRecord,
      lastValidatedAt: now,
    }))

    const decision = resolveDmSendPolicy({
      recipients: ["p1"],
      policyMode: "compatibility",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      now,
    })

    expect(decision.allowed).toBe(true)
    expect(decision.mode).toBe("hybrid")
    expect(decision.shouldFallback).toBe(false)
  })
})
