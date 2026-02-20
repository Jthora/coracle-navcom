import {describe, expect, it} from "vitest"
import {
  DEFAULT_PQC_KEY_ROTATION_TTL_SECONDS,
  DEFAULT_PQC_KEY_STALE_AFTER_SECONDS,
  PQC_KEY_SCHEMA_VERSION,
  getPqcKeyFreshness,
  getPqcKeyFreshnessState,
  selectPreferredActivePqcKey,
  validatePqcKeyPublicationRecord,
} from "../../../../src/engine/pqc/key-publication"

const now = 1739836800

const makeRecord = (overrides = {}) => ({
  schema: PQC_KEY_SCHEMA_VERSION,
  user_pubkey: "f".repeat(64),
  pq_alg: "mlkem768",
  pq_pub: "base64:pub",
  key_id: "k-001",
  created_at: now - 100,
  expires_at: now + 100,
  status: "active",
  ...overrides,
})

describe("engine/pqc/key-publication", () => {
  it("validates a complete active record", () => {
    const result = validatePqcKeyPublicationRecord(makeRecord(), {now, requireActive: true})

    expect(result.ok).toBe(true)
  })

  it("rejects unsupported schema versions", () => {
    const result = validatePqcKeyPublicationRecord(makeRecord({schema: 999}), {now})

    expect(result).toMatchObject({
      ok: false,
      code: "ERR_KEY_SCHEMA_INVALID",
    })
  })

  it("rejects inverted created/expiry windows", () => {
    const result = validatePqcKeyPublicationRecord(
      makeRecord({created_at: now + 100, expires_at: now - 100}),
      {now},
    )

    expect(result).toMatchObject({
      ok: false,
      code: "ERR_KEY_TIME_WINDOW_INVALID",
    })
  })

  it("enforces active/fresh requirements when requested", () => {
    const deprecated = validatePqcKeyPublicationRecord(makeRecord({status: "deprecated"}), {
      now,
      requireActive: true,
    })
    expect(deprecated).toMatchObject({ok: false, code: "ERR_KEY_NOT_ACTIVE"})

    const expired = validatePqcKeyPublicationRecord(makeRecord({expires_at: now - 1}), {
      now,
      requireActive: true,
    })
    expect(expired).toMatchObject({ok: false, code: "ERR_KEY_EXPIRED"})
  })

  it("computes freshness and deterministic preferred key selection", () => {
    expect(getPqcKeyFreshness(makeRecord({expires_at: now + 1}), now)).toBe("fresh")
    expect(getPqcKeyFreshness(makeRecord({expires_at: now - 1}), now)).toBe("expired")

    const records = [
      makeRecord({key_id: "k-001", created_at: now - 10}),
      makeRecord({key_id: "k-010", created_at: now - 10}),
      makeRecord({key_id: "k-000", created_at: now - 20}),
      makeRecord({key_id: "k-rev", status: "revoked"}),
      makeRecord({key_id: "k-exp", expires_at: now - 1}),
    ]

    const selected = selectPreferredActivePqcKey(records as any, now)

    expect(selected?.key_id).toBe("k-010")
  })

  it("provides default lifecycle timing constants", () => {
    expect(DEFAULT_PQC_KEY_ROTATION_TTL_SECONDS).toBe(60 * 60 * 24 * 90)
    expect(DEFAULT_PQC_KEY_STALE_AFTER_SECONDS).toBe(60 * 60 * 24)
  })

  it("computes fresh/stale/expired freshness states", () => {
    const fresh = getPqcKeyFreshnessState(makeRecord({expires_at: now + 10}), {
      now,
      lastValidatedAt: now - 10,
    })
    expect(fresh).toBe("fresh")

    const stale = getPqcKeyFreshnessState(makeRecord({expires_at: now + 10}), {
      now,
      lastValidatedAt: now - DEFAULT_PQC_KEY_STALE_AFTER_SECONDS - 1,
    })
    expect(stale).toBe("stale")

    const expired = getPqcKeyFreshnessState(makeRecord({expires_at: now - 1}), {
      now,
      lastValidatedAt: now,
    })
    expect(expired).toBe("expired")
  })
})
