import {describe, it, expect, vi, beforeEach, afterEach} from "vitest"

// Mock idb before pq-key-store imports secure-store
vi.mock("idb", () => {
  const data = new Map<string, any>()
  return {
    openDB: vi.fn().mockResolvedValue({
      put(_s: string, v: any) {
        data.set(v.id, structuredClone(v))
      },
      get(_s: string, k: string) {
        return data.get(k) ? structuredClone(data.get(k)) : undefined
      },
      getAll(_s: string) {
        return Array.from(data.values()).map(v => structuredClone(v))
      },
      getAllKeys(_s: string) {
        return Array.from(data.keys())
      },
      delete(_s: string, k: string) {
        data.delete(k)
      },
    }),
  }
})

describe("pq-key-store", () => {
  let savePqcKeyPair: typeof import("src/engine/pqc/pq-key-store").savePqcKeyPair
  let loadPqcKeyPair: typeof import("src/engine/pqc/pq-key-store").loadPqcKeyPair
  let loadPqcSecretKey: typeof import("src/engine/pqc/pq-key-store").loadPqcSecretKey
  let removePqcKeyPair: typeof import("src/engine/pqc/pq-key-store").removePqcKeyPair
  let setActivePassphrase: typeof import("src/engine/pqc/pq-key-store").setActivePassphrase

  const store = new Map<string, string>()

  beforeEach(async () => {
    vi.resetModules()
    store.clear()

    // Mock localStorage
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    })

    const mod = await import("src/engine/pqc/pq-key-store")
    savePqcKeyPair = mod.savePqcKeyPair
    loadPqcKeyPair = mod.loadPqcKeyPair
    loadPqcSecretKey = mod.loadPqcSecretKey
    removePqcKeyPair = mod.removePqcKeyPair
    setActivePassphrase = mod.setActivePassphrase

    // Set passphrase so secure store is used
    setActivePassphrase("test-passphrase")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const fakeRecord = {
    schema: 1,
    user_pubkey: "abc123",
    pq_alg: "mlkem768",
    pq_pub: "AQID", // base64 for [1,2,3]
    key_id: "mlkem768-100-abc12345",
    created_at: 100,
    expires_at: 999999999,
    status: "active" as const,
  }

  const fakeSecret = new Uint8Array([10, 20, 30, 40])

  it("saves and loads a keypair", async () => {
    await savePqcKeyPair("abc123", fakeRecord, fakeSecret)

    const loaded = await loadPqcKeyPair("abc123")
    expect(loaded).not.toBeNull()
    expect(loaded!.record.key_id).toBe("mlkem768-100-abc12345")
    expect(loaded!.secretKey).toBeInstanceOf(Uint8Array)
    expect(loaded!.secretKey.length).toBe(fakeSecret.length)
  })

  it("returns null for missing user", async () => {
    expect(await loadPqcKeyPair("nonexistent")).toBeNull()
  })

  it("loads secret key by ID", async () => {
    await savePqcKeyPair("abc123", fakeRecord, fakeSecret)

    const sk = await loadPqcSecretKey("abc123", "mlkem768-100-abc12345")
    expect(sk).not.toBeNull()
    expect(sk!.length).toBe(fakeSecret.length)
  })

  it("returns null for missing secret key ID", async () => {
    expect(await loadPqcSecretKey("abc123", "no-such-key")).toBeNull()
  })

  it("removes keypair", async () => {
    await savePqcKeyPair("abc123", fakeRecord, fakeSecret)
    await removePqcKeyPair("abc123")

    expect(await loadPqcKeyPair("abc123")).toBeNull()
    expect(await loadPqcSecretKey("abc123", "mlkem768-100-abc12345")).toBeNull()
  })

  it("handles corrupted localStorage gracefully", async () => {
    store.set("pqc-key-record:abc123", "not-json!")
    expect(await loadPqcKeyPair("abc123")).toBeNull()
  })
})
