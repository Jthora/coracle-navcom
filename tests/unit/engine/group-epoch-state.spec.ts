import {describe, expect, it} from "vitest"
import {
  advanceSecureGroupEpochState,
  clearSecureGroupEpochState,
  ensureSecureGroupEpochState,
  loadSecureGroupEpochState,
  saveSecureGroupEpochState,
} from "../../../src/engine/group-epoch-state"

const createMemoryStorage = () => {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}

describe("engine/group-epoch-state", () => {
  it("creates and persists the active epoch per group", () => {
    const storage = createMemoryStorage()
    const state = ensureSecureGroupEpochState("ops", {at: 100, storage})

    expect(state.groupId).toBe("ops")
    expect(state.sequence).toBe(1)

    const loaded = loadSecureGroupEpochState(storage, "ops")

    expect(loaded).toMatchObject({
      groupId: "ops",
      sequence: 1,
    })
  })

  it("advances epoch sequence and retains original creation time", () => {
    const storage = createMemoryStorage()
    ensureSecureGroupEpochState("ops", {at: 100, storage})
    const next = advanceSecureGroupEpochState("ops", {at: 200, storage})

    expect(next.sequence).toBe(2)
    expect(next.createdAt).toBe(100)
    expect(next.updatedAt).toBe(200)
  })

  it("rejects tampered integrity values on load/save", () => {
    const storage = createMemoryStorage()
    const state = ensureSecureGroupEpochState("ops", {at: 100, storage})
    const tampered = {...state, integrityMac: "tampered"}

    expect(saveSecureGroupEpochState(storage, tampered)).toBe(false)

    storage.setItem("secure-group-epoch-state:ops", JSON.stringify(tampered))

    expect(loadSecureGroupEpochState(storage, "ops")).toBeNull()

    const mutatedPayload = {
      ...state,
      sequence: state.sequence + 1,
    }

    storage.setItem("secure-group-epoch-state:ops", JSON.stringify(mutatedPayload))

    expect(loadSecureGroupEpochState(storage, "ops")).toBeNull()

    const malformedMac = {
      ...state,
      integrityMac: "!!!",
    }

    storage.setItem("secure-group-epoch-state:ops", JSON.stringify(malformedMac))

    expect(loadSecureGroupEpochState(storage, "ops")).toBeNull()
  })

  it("migrates valid legacy schema records during load", () => {
    const storage = createMemoryStorage()
    storage.setItem(
      "secure-group-epoch-state:ops",
      JSON.stringify({
        schema: 1,
        groupId: "ops",
        epochId: "epoch:ops:1:100",
        sequence: 1,
        createdAt: 100,
        updatedAt: 100,
        integrity: "1pl1isy",
      }),
    )

    const loaded = loadSecureGroupEpochState(storage, "ops")

    expect(loaded).toMatchObject({
      schema: 2,
      groupId: "ops",
      sequence: 1,
    })
    expect(loaded?.integrityAlg).toBeTruthy()
    expect(typeof loaded?.integrityMac).toBe("string")
  })

  it("clears persisted epoch state", () => {
    const storage = createMemoryStorage()
    ensureSecureGroupEpochState("ops", {at: 100, storage})

    clearSecureGroupEpochState("ops", {storage})

    expect(loadSecureGroupEpochState(storage, "ops")).toBeNull()
  })
})
