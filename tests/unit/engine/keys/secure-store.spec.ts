import {describe, it, expect, vi, beforeEach} from "vitest"

// In-memory fake IDB store data — accessible to mock and tests
const _data = new Map<string, any>()

vi.mock("idb", () => ({
  openDB: vi.fn().mockResolvedValue({
    put(_s: string, v: any) {
      _data.set(v.id, structuredClone(v))
    },
    get(_s: string, k: string) {
      return _data.get(k) ? structuredClone(_data.get(k)) : undefined
    },
    getAll(_s: string) {
      return Array.from(_data.values()).map(v => structuredClone(v))
    },
    getAllKeys(_s: string) {
      return Array.from(_data.keys())
    },
    delete(_s: string, k: string) {
      _data.delete(k)
    },
  }),
}))

// Must import after mock
import {
  storeKey,
  retrieveKey,
  hasKey,
  deleteKey,
  listKeyIds,
  getKeyMetadata,
} from "src/engine/keys/secure-store"

describe("secure-store", () => {
  const testPassphrase = "test-passphrase-123"

  beforeEach(() => {
    _data.clear()
  })

  it("stores and retrieves a key", async () => {
    const raw = new Uint8Array([1, 2, 3, 4, 5])
    await storeKey("test-key", raw, testPassphrase, "nostr-secret")

    const retrieved = await retrieveKey("test-key", testPassphrase)
    expect(retrieved).not.toBeNull()
    expect(retrieved).toEqual(raw)
  })

  it("returns null for wrong passphrase", async () => {
    const raw = new Uint8Array([10, 20, 30])
    await storeKey("test-key-2", raw, testPassphrase, "pqc-secret")

    const retrieved = await retrieveKey("test-key-2", "wrong-passphrase")
    expect(retrieved).toBeNull()
  })

  it("returns null for missing key", async () => {
    const retrieved = await retrieveKey("nonexistent", testPassphrase)
    expect(retrieved).toBeNull()
  })

  it("hasKey returns correct results", async () => {
    expect(await hasKey("test-key-3")).toBe(false)

    await storeKey("test-key-3", new Uint8Array([1]), testPassphrase, "nostr-secret")
    expect(await hasKey("test-key-3")).toBe(true)
  })

  it("deletes a key", async () => {
    await storeKey("test-key-4", new Uint8Array([1, 2]), testPassphrase, "nostr-secret")
    expect(await hasKey("test-key-4")).toBe(true)

    await deleteKey("test-key-4")
    expect(await hasKey("test-key-4")).toBe(false)
  })

  it("lists all key IDs", async () => {
    await storeKey("key-a", new Uint8Array([1]), testPassphrase, "nostr-secret")
    await storeKey("key-b", new Uint8Array([2]), testPassphrase, "pqc-secret")

    const ids = await listKeyIds()
    expect(ids).toContain("key-a")
    expect(ids).toContain("key-b")
  })

  it("stores metadata alongside key", async () => {
    await storeKey("key-meta", new Uint8Array([1]), testPassphrase, "nostr-secret", {
      pubkey: "abc123",
      method: "nip01",
    })

    const meta = await getKeyMetadata("key-meta")
    expect(meta).not.toBeNull()
    expect(meta!.keyType).toBe("nostr-secret")
    expect(meta!.metadata?.pubkey).toBe("abc123")
  })

  it("handles large key material (ML-KEM secret key ~2400 bytes)", async () => {
    const largeKey = new Uint8Array(2400)
    globalThis.crypto.getRandomValues(largeKey)

    await storeKey("pqc-large", largeKey, testPassphrase, "pqc-secret")
    const retrieved = await retrieveKey("pqc-large", testPassphrase)
    expect(retrieved).toEqual(largeKey)
  })
})
