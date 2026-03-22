import {describe, expect, it, beforeEach, vi} from "vitest"
import {get} from "svelte/store"
import {
  setActivePassphrase,
  getActivePassphrase,
  pqcUnlockNeeded,
  checkPqcUnlockNeeded,
  savePqcKeyPair,
} from "src/engine/pqc/pq-key-store"

// Mock the secure store's listKeyIds
vi.mock("src/engine/keys/secure-store", () => ({
  storeKey: vi.fn(),
  retrieveKey: vi.fn(),
  hasKey: vi.fn(),
  deleteKey: vi.fn(),
  listKeyIds: vi.fn(),
}))

import {listKeyIds} from "src/engine/keys/secure-store"
const mockListKeyIds = vi.mocked(listKeyIds)

describe("pq-key-store unlock wiring", () => {
  beforeEach(() => {
    setActivePassphrase(null)
    vi.clearAllMocks()
  })

  it("setActivePassphrase stores and retrieves the passphrase", () => {
    expect(getActivePassphrase()).toBeNull()
    setActivePassphrase("test-phrase")
    expect(getActivePassphrase()).toBe("test-phrase")
  })

  it("setActivePassphrase clears pqcUnlockNeeded", () => {
    pqcUnlockNeeded.set(true)
    expect(get(pqcUnlockNeeded)).toBe(true)

    setActivePassphrase("my-passphrase")
    expect(get(pqcUnlockNeeded)).toBe(false)
  })

  it("checkPqcUnlockNeeded returns true when keys exist and no passphrase", async () => {
    mockListKeyIds.mockResolvedValue(["key-1", "key-2"])
    setActivePassphrase(null)

    const needed = await checkPqcUnlockNeeded()

    expect(needed).toBe(true)
    expect(get(pqcUnlockNeeded)).toBe(true)
  })

  it("checkPqcUnlockNeeded returns false when no keys in store", async () => {
    mockListKeyIds.mockResolvedValue([])
    setActivePassphrase(null)

    const needed = await checkPqcUnlockNeeded()

    expect(needed).toBe(false)
    expect(get(pqcUnlockNeeded)).toBe(false)
  })

  it("checkPqcUnlockNeeded returns false when passphrase already set", async () => {
    mockListKeyIds.mockResolvedValue(["key-1"])
    setActivePassphrase("already-set")

    const needed = await checkPqcUnlockNeeded()

    expect(needed).toBe(false)
    expect(get(pqcUnlockNeeded)).toBe(false)
  })

  it("simulates UnlockScreen dispatch → setActivePassphrase flow", () => {
    // Simulate: UnlockScreen dispatches unlock event
    pqcUnlockNeeded.set(true)
    expect(get(pqcUnlockNeeded)).toBe(true)
    expect(getActivePassphrase()).toBeNull()

    // Parent handler calls setActivePassphrase
    const mockEvent = {detail: {passphrase: "earth-alliance-secure"}}
    setActivePassphrase(mockEvent.detail.passphrase)

    expect(getActivePassphrase()).toBe("earth-alliance-secure")
    expect(get(pqcUnlockNeeded)).toBe(false)
  })

  it("savePqcKeyPair throws when no passphrase is set", async () => {
    setActivePassphrase(null)

    const record = {
      schema: 1,
      user_pubkey: "a".repeat(64),
      pq_alg: "mlkem768",
      pq_pub: "base64:pub",
      key_id: "k-test",
      created_at: 1000,
      expires_at: 2000,
      status: "active" as const,
    }

    await expect(savePqcKeyPair("a".repeat(64), record, new Uint8Array([1, 2, 3]))).rejects.toThrow(
      "Passphrase required",
    )
  })
})
