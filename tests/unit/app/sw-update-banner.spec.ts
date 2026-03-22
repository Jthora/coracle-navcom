import {describe, it, expect} from "vitest"
import {get} from "svelte/store"

describe("SwUpdateBanner state", () => {
  it("exports swUpdateState store with default values", async () => {
    const {swUpdateState} = await import("../../../src/app/shared/sw-update-state")

    const state = get(swUpdateState)
    expect(state.available).toBe(false)
    expect(state.updateSW).toBeNull()
    expect(state.registrationError).toBe(false)
    expect(state.securityCritical).toBe(false)
  })

  it("can be updated to show available state", async () => {
    const {swUpdateState} = await import("../../../src/app/shared/sw-update-state")

    const mockUpdate = async () => {}
    swUpdateState.set({
      available: true,
      updateSW: mockUpdate,
      registrationError: false,
      securityCritical: false,
    })

    const state = get(swUpdateState)
    expect(state.available).toBe(true)
    expect(state.updateSW).toBe(mockUpdate)

    // Reset
    swUpdateState.set({
      available: false,
      updateSW: null,
      registrationError: false,
      securityCritical: false,
    })
  })

  it("can be updated to show registration error", async () => {
    const {swUpdateState} = await import("../../../src/app/shared/sw-update-state")

    swUpdateState.set({
      available: false,
      updateSW: null,
      registrationError: true,
      securityCritical: false,
    })

    const state = get(swUpdateState)
    expect(state.registrationError).toBe(true)

    // Reset
    swUpdateState.set({
      available: false,
      updateSW: null,
      registrationError: false,
      securityCritical: false,
    })
  })

  it("supports securityCritical flag", async () => {
    const {swUpdateState} = await import("../../../src/app/shared/sw-update-state")

    const mockUpdate = async () => {}
    swUpdateState.set({
      available: true,
      updateSW: mockUpdate,
      registrationError: false,
      securityCritical: true,
    })

    const state = get(swUpdateState)
    expect(state.securityCritical).toBe(true)

    // Reset
    swUpdateState.set({
      available: false,
      updateSW: null,
      registrationError: false,
      securityCritical: false,
    })
  })
})
