import {describe, it, expect} from "vitest"
import {
  generateEpochKey,
  deriveEpochContentKey,
  deriveEpochIntegrityKey,
} from "src/engine/pqc/epoch-key-manager"
import {bytesToBase64} from "src/engine/pqc/crypto-provider"

describe("EpochKeyManager", () => {
  it("generates unique epoch keys", () => {
    const k1 = generateEpochKey()
    const k2 = generateEpochKey()
    expect(k1.length).toBe(32)
    expect(k2.length).toBe(32)
    expect(bytesToBase64(k1)).not.toBe(bytesToBase64(k2))
  })

  it("derives deterministic content key from same inputs", async () => {
    const master = generateEpochKey()
    const key1 = await deriveEpochContentKey(master, "group-1", "epoch-1")
    const key2 = await deriveEpochContentKey(master, "group-1", "epoch-1")
    expect(Array.from(key1)).toEqual(Array.from(key2))
    expect(key1.length).toBe(32)
  })

  it("derives different keys for different epochs", async () => {
    const master = generateEpochKey()
    const key1 = await deriveEpochContentKey(master, "group-1", "epoch-1")
    const key2 = await deriveEpochContentKey(master, "group-1", "epoch-2")
    expect(Array.from(key1)).not.toEqual(Array.from(key2))
  })

  it("derives different content vs integrity keys", async () => {
    const master = generateEpochKey()
    const contentKey = await deriveEpochContentKey(master, "group-1", "epoch-1")
    const integrityKey = await deriveEpochIntegrityKey(master, "group-1", "epoch-1")
    expect(Array.from(contentKey)).not.toEqual(Array.from(integrityKey))
    expect(integrityKey.length).toBe(32)
  })

  it("derives different keys for different groups", async () => {
    const master = generateEpochKey()
    const key1 = await deriveEpochContentKey(master, "group-alpha", "epoch-1")
    const key2 = await deriveEpochContentKey(master, "group-beta", "epoch-1")
    expect(Array.from(key1)).not.toEqual(Array.from(key2))
  })
})
