import {describe, it, expect, vi, beforeEach} from "vitest"
import {
  PQC_KEY_SCHEMA_VERSION,
  generatePqcKeyPair,
  validatePqcKeyPublicationRecord,
  selectPreferredActivePqcKey,
} from "src/engine/pqc/key-publication"
import {base64ToBytes, bytesToBase64} from "src/engine/pqc/crypto-provider"

const now = 1739836800

const makeRecord = (overrides = {}) => ({
  schema: PQC_KEY_SCHEMA_VERSION,
  user_pubkey: "f".repeat(64),
  pq_alg: "mlkem768",
  pq_pub: "base64:pub",
  key_id: "k-001",
  created_at: now - 100,
  expires_at: now + 100,
  status: "active" as const,
  ...overrides,
})

describe("pq-key-lifecycle stale key eviction", () => {
  it("rejects cached key where expires_at < now", () => {
    const expiredRecord = makeRecord({expires_at: now - 1})
    const result = validatePqcKeyPublicationRecord(expiredRecord, {now, requireActive: true})

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe("ERR_KEY_EXPIRED")
    }
  })

  it("accepts cached key where expires_at > now", () => {
    const freshRecord = makeRecord({expires_at: now + 3600})
    const result = validatePqcKeyPublicationRecord(freshRecord, {now, requireActive: true})

    expect(result.ok).toBe(true)
  })

  it("expired keys are filtered out by selectPreferredActivePqcKey", () => {
    const records = [
      makeRecord({key_id: "k-expired-1", expires_at: now - 100}),
      makeRecord({key_id: "k-expired-2", expires_at: now - 1}),
    ]

    const selected = selectPreferredActivePqcKey(records, now)
    expect(selected).toBeNull()
  })

  it("selects fresh key when mix of expired and fresh exist", () => {
    const records = [
      makeRecord({key_id: "k-expired", expires_at: now - 1}),
      makeRecord({key_id: "k-fresh", expires_at: now + 3600, created_at: now - 50}),
    ]

    const selected = selectPreferredActivePqcKey(records, now)
    expect(selected?.key_id).toBe("k-fresh")
  })
})
