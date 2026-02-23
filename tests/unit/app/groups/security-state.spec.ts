import {describe, expect, it} from "vitest"
import {getProjectionSecurityState, resolveGroupSecurityState} from "src/app/groups/security-state"

describe("app/groups security-state", () => {
  it("returns explicit secure label for secure transport", () => {
    const state = resolveGroupSecurityState({transportMode: "secure-nip-ee"})

    expect(state).toMatchObject({
      state: "secure-active",
      label: "Secure transport active",
    })
    expect(state.hint).toContain("Secure pilot transport is active")
    expect(state.hint).not.toContain("fallback may be used")
  })

  it("returns strict secure label for secure transport when secure mode is selected", () => {
    const state = resolveGroupSecurityState({
      transportMode: "secure-nip-ee",
      securityMode: "secure",
    })

    expect(state).toMatchObject({
      state: "secure-active",
      label: "Secure mode active",
    })
    expect(state.hint).toContain("Secure mode is active")
  })

  it("returns explicit compatibility label for baseline transport", () => {
    const state = resolveGroupSecurityState({transportMode: "baseline-nip29"})

    expect(state).toMatchObject({
      state: "compatibility-active",
      label: "Compatibility transport active",
    })
    expect(state.hint).toContain("does not imply confidentiality")
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
      label: "Compatibility transport active",
    })
    expect(fallback.hint).toContain("Compatibility fallback is active")
    expect(blocked).toMatchObject({state: "blocked", label: "Blocked"})
    expect(blocked.hint).toContain("room policy and relay capabilities")
  })

  it("uses strict degradation hints for strict mode", () => {
    const fallback = resolveGroupSecurityState({
      transportMode: "secure-nip-ee",
      hasDowngradeSignal: true,
      securityMode: "max",
    })

    expect(fallback).toMatchObject({
      state: "fallback-active",
      label: "Strict mode degraded",
    })
    expect(fallback.hint).toContain("Max mode was requested")
    expect(fallback.hint).toContain("Compatibility fallback remains blocked")
  })

  it("provides explicit compatibility fallback while projection is loading", () => {
    const state = getProjectionSecurityState(undefined)

    expect(state).toMatchObject({
      state: "compatibility-active",
      label: "Compatibility transport active",
      hint: "Security state unavailable until group data loads.",
    })
  })

  it("provides strict loading hint while projection is unavailable", () => {
    const state = getProjectionSecurityState(undefined, false, "max")

    expect(state).toMatchObject({
      state: "compatibility-active",
      label: "Compatibility transport active",
    })
    expect(state.hint).toContain("Max mode requested")
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
      label: "Compatibility transport active",
    })
    expect(state.hint).toContain("Compatibility fallback is active")
  })
})
