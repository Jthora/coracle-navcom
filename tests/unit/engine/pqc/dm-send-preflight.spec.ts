import {describe, expect, it} from "vitest"
import {runDmPqcSendPreflight} from "../../../../src/engine/pqc/dm-send-preflight"
import {
  PQC_KEY_SCHEMA_VERSION,
  type PqcKeyPublicationRecord,
} from "../../../../src/engine/pqc/key-publication"

const now = 1739836800

const makePeerKey = (
  overrides: Partial<PqcKeyPublicationRecord> = {},
): PqcKeyPublicationRecord => ({
  schema: PQC_KEY_SCHEMA_VERSION,
  user_pubkey: "f".repeat(64),
  pq_alg: "mlkem768",
  pq_pub: "base64:peer-key",
  key_id: "k-001",
  created_at: now - 600,
  expires_at: now + 3600,
  status: "active",
  ...overrides,
})

const makePeerCaps = () => ({
  modes: ["hybrid", "classical"],
  algs: ["hybrid-mlkem768+x25519-aead-v1"],
})

describe("engine/pqc/dm-send-preflight", () => {
  it("returns fresh hybrid-ready outcome when key and caps are valid", () => {
    const result = runDmPqcSendPreflight({
      policyMode: "strict",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      peerCapabilities: makePeerCaps(),
      peerKeyRecord: makePeerKey(),
      now,
      lastValidatedAt: now - 30,
    })

    expect(result.keyFreshness).toBe("fresh")
    expect(result.shouldRefreshKey).toBe(false)
    expect(result.negotiation.mode).toBe("hybrid")
    expect(result.telemetryReason).toBe("DM_PREFLIGHT_OK")
  })

  it("flags stale key for refresh and returns stale telemetry reason", () => {
    const result = runDmPqcSendPreflight({
      policyMode: "compatibility",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      peerCapabilities: makePeerCaps(),
      peerKeyRecord: makePeerKey(),
      now,
      lastValidatedAt: now - 60 * 60 * 24 * 2,
      staleAfterSeconds: 60 * 60 * 24,
    })

    expect(result.keyFreshness).toBe("stale")
    expect(result.shouldRefreshKey).toBe(true)
    expect(result.telemetryReason).toBe("DM_KEY_STALE")
  })

  it("maps missing key to unavailable telemetry reason", () => {
    const result = runDmPqcSendPreflight({
      policyMode: "compatibility",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      peerCapabilities: makePeerCaps(),
      peerKeyRecord: null,
      now,
    })

    expect(result.keyFreshness).toBe("missing")
    expect(result.shouldRefreshKey).toBe(true)
    expect(result.telemetryReason).toBe("DM_KEY_UNAVAILABLE")
  })

  it("maps expired key to expiry telemetry reason", () => {
    const result = runDmPqcSendPreflight({
      policyMode: "strict",
      preferredHybridAlg: "hybrid-mlkem768+x25519-aead-v1",
      localSupportedAlgs: ["hybrid-mlkem768+x25519-aead-v1"],
      peerCapabilities: makePeerCaps(),
      peerKeyRecord: makePeerKey({expires_at: now - 1}),
      now,
    })

    expect(result.keyFreshness).toBe("expired")
    expect(result.telemetryReason).toBe("DM_KEY_EXPIRED")
    expect(result.blocked).toBe(true)
  })
})
