import {describe, expect, it} from "vitest"
import {getProjectionSecurityState, resolveGroupSecurityState} from "src/app/groups/security-state"

describe("app/groups security-state", () => {
  it("returns explicit secure label for secure transport", () => {
    const state = resolveGroupSecurityState({transportMode: "secure-nip-ee"})

    expect(state).toMatchObject({
      state: "secure-active",
      label: "Secure active (PQC-preferred)",
    })
    expect(state.hint).toContain("Preferred secure transport is active")
  })

  it("returns explicit compatibility label for baseline transport", () => {
    const state = resolveGroupSecurityState({transportMode: "baseline-nip29"})

    expect(state).toMatchObject({
      state: "compatibility-active",
      label: "Compatibility active (non-PQC)",
    })
    expect(state.hint).toContain("Compatibility transport is active")
  })

  it("prioritizes fallback and blocked messaging when signaled", () => {
    const fallback = resolveGroupSecurityState({
      transportMode: "secure-nip-ee",
      hasDowngradeSignal: true,
    })
    const blocked = resolveGroupSecurityState({
      transportMode: "secure-nip-ee",
      isBlocked: true,
    })

    expect(fallback).toMatchObject({
      state: "fallback-active",
      label: "Fallback active",
    })
    expect(fallback.hint).toContain("non-preferred compatibility path")
    expect(blocked).toMatchObject({state: "blocked", label: "Blocked"})
    expect(blocked.hint).toContain("room policy and relay capabilities")
  })

  it("provides explicit compatibility fallback while projection is loading", () => {
    const state = getProjectionSecurityState(undefined)

    expect(state).toMatchObject({
      state: "compatibility-active",
      label: "Compatibility active (non-PQC)",
      hint: "Security state unavailable until group data loads.",
    })
  })

  it("returns fallback-active when projection exists with downgrade signal", () => {
    const projection = {
      group: {
        transportMode: "secure-nip-ee",
      },
    } as any

    const state = getProjectionSecurityState(projection, true)

    expect(state).toMatchObject({
      state: "fallback-active",
      label: "Fallback active",
    })
    expect(state.hint).toContain("non-preferred compatibility path")
  })
})
