import {describe, expect, it} from "vitest"
import {createGroupDowngradeAuditStore} from "src/engine/group-downgrade-audit"

const createMemoryStorage = () => {
  const bucket = new Map<string, string>()

  return {
    getItem: (key: string) => bucket.get(key) || null,
    setItem: (key: string, value: string) => {
      bucket.set(key, value)
    },
    removeItem: (key: string) => {
      bucket.delete(key)
    },
  }
}

describe("engine/group-downgrade-audit", () => {
  it("records and returns latest downgrade event per group", () => {
    const store = createGroupDowngradeAuditStore({storage: createMemoryStorage()})

    store.record({
      groupId: "ops",
      action: "transport-downgrade",
      actor: "member",
      createdAt: 100,
      requestedMode: "secure-nip-ee",
      resolvedMode: "baseline-nip29",
      reason: "Secure capability unavailable",
    })

    store.record({
      groupId: "ops",
      action: "transport-downgrade",
      actor: "admin",
      createdAt: 110,
      requestedMode: "secure-nip-ee",
      resolvedMode: "baseline-nip29",
      reason: "Relay policy mismatch",
    })

    const latest = store.getLatestByGroup("ops")

    expect(latest?.createdAt).toBe(110)
    expect(latest?.reason).toBe("Relay policy mismatch")
    expect(store.getByGroup("ops")).toHaveLength(2)
  })

  it("limits stored entries and supports clearing history", () => {
    const store = createGroupDowngradeAuditStore({storage: createMemoryStorage(), limit: 1})

    store.record({
      groupId: "ops",
      action: "transport-downgrade",
      actor: "member",
      createdAt: 100,
      requestedMode: "secure-nip-ee",
      resolvedMode: "baseline-nip29",
    })

    store.record({
      groupId: "ops",
      action: "transport-downgrade",
      actor: "member",
      createdAt: 101,
      requestedMode: "secure-nip-ee",
      resolvedMode: "baseline-nip29",
    })

    expect(store.getAll()).toHaveLength(1)

    store.clear()

    expect(store.getAll()).toEqual([])
  })
})
