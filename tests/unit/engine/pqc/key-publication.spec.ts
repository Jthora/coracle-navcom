import {describe, expect, it} from "vitest"
import {
  DEFAULT_PQC_KEY_ROTATION_TTL_SECONDS,
  DEFAULT_PQC_KEY_STALE_AFTER_SECONDS,
  PQC_KEY_SCHEMA_VERSION,
  generatePqcKeyPair,
  getPqcKeyFreshness,
  getPqcKeyFreshnessState,
  selectPreferredActivePqcKey,
  selectPreferredActivePqcKeyOrError,
  validatePqcKeyPublicationRecord,
} from "../../../../src/engine/pqc/key-publication"
import {
  mlKemEncapsulate,
  mlKemDecapsulate,
  base64ToBytes,
} from "../../../../src/engine/pqc/crypto-provider"

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

  it("generates a real ML-KEM-768 keypair with valid record", () => {
    const {record, secretKey} = generatePqcKeyPair({
      userPubkey: "a".repeat(64),
      deviceHint: "test-device",
    })

    expect(record.pq_alg).toBe("mlkem768")
    expect(record.status).toBe("active")
    expect(record.schema).toBe(PQC_KEY_SCHEMA_VERSION)
    expect(record.device_hint).toBe("test-device")
    expect(secretKey.length).toBe(2400) // ML-KEM-768 secret key size

    // The published public key should be real ML-KEM material
    const pubKeyBytes = base64ToBytes(record.pq_pub)
    expect(pubKeyBytes.length).toBe(1184) // ML-KEM-768 public key size
  })

  it("generated keypair can encapsulate and decapsulate", () => {
    const {record, secretKey} = generatePqcKeyPair({userPubkey: "b".repeat(64)})
    const pubKeyBytes = base64ToBytes(record.pq_pub)

    const {cipherText, sharedSecret: ss1} = mlKemEncapsulate(pubKeyBytes)
    const ss2 = mlKemDecapsulate(cipherText, secretKey)

    expect(Array.from(ss1)).toEqual(Array.from(ss2))
    expect(ss1.length).toBe(32)
  })

  it("generated record passes validation", () => {
    const {record} = generatePqcKeyPair({userPubkey: "c".repeat(64)})
    const result = validatePqcKeyPublicationRecord(record, {requireActive: true})
    expect(result.ok).toBe(true)
  })

  it("returns null when all keys are revoked", () => {
    const records = [
      makeRecord({key_id: "k-rev1", status: "revoked"}),
      makeRecord({key_id: "k-rev2", status: "revoked"}),
    ]

    const selected = selectPreferredActivePqcKey(records as any, now)
    expect(selected).toBeNull()
  })

  it("returns null when all keys are deprecated", () => {
    const records = [
      makeRecord({key_id: "k-dep1", status: "deprecated"}),
      makeRecord({key_id: "k-dep2", status: "deprecated"}),
    ]

    const selected = selectPreferredActivePqcKey(records as any, now)
    expect(selected).toBeNull()
  })

  describe("selectPreferredActivePqcKeyOrError", () => {
    it("returns structured error for empty records", () => {
      const result = selectPreferredActivePqcKeyOrError([], now)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("NO_KEYS_AVAILABLE")
    })

    it("returns ALL_KEYS_REVOKED when all keys are revoked", () => {
      const records = [
        makeRecord({key_id: "k-r1", status: "revoked"}),
        makeRecord({key_id: "k-r2", status: "revoked"}),
      ]
      const result = selectPreferredActivePqcKeyOrError(records as any, now)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("ALL_KEYS_REVOKED")
    })

    it("returns ALL_KEYS_DEPRECATED when all keys are deprecated", () => {
      const records = [
        makeRecord({key_id: "k-d1", status: "deprecated"}),
        makeRecord({key_id: "k-d2", status: "deprecated"}),
      ]
      const result = selectPreferredActivePqcKeyOrError(records as any, now)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("ALL_KEYS_DEPRECATED")
    })

    it("returns ALL_KEYS_EXPIRED when all active keys are expired", () => {
      const records = [
        makeRecord({key_id: "k-e1", expires_at: now - 1}),
        makeRecord({key_id: "k-e2", expires_at: now - 100}),
      ]
      const result = selectPreferredActivePqcKeyOrError(records as any, now)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe("ALL_KEYS_EXPIRED")
    })

    it("returns ok with key when a valid key exists", () => {
      const records = [
        makeRecord({key_id: "k-good", expires_at: now + 3600}),
        makeRecord({key_id: "k-rev", status: "revoked"}),
      ]
      const result = selectPreferredActivePqcKeyOrError(records as any, now)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.key.key_id).toBe("k-good")
    })
  })
})
