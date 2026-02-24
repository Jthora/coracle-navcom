import {describe, expect, it} from "vitest"
import {getMaxDiagnosticsToneClass, getMaxModeDiagnostics} from "src/app/groups/max-diagnostics"

describe("app/groups max-diagnostics", () => {
  it("returns null when privacy mode is not max", () => {
    expect(
      getMaxModeDiagnostics({
        privacy: "secure",
        relayChecks: [],
        securePilotEnabled: true,
      }),
    ).toBeNull()
  })

  it("returns blocked diagnostics when secure pilot is disabled", () => {
    const diagnostics = getMaxModeDiagnostics({
      privacy: "max",
      relayChecks: [],
      securePilotEnabled: false,
    })

    expect(diagnostics).toMatchObject({
      state: "blocked",
      reason: "STRICT_REQUIRES_SECURE_PILOT",
    })
    expect(diagnostics?.warning).toContain("⚠️")
  })

  it("returns active diagnostics when relay checks are missing", () => {
    const diagnostics = getMaxModeDiagnostics({
      privacy: "max",
      relayChecks: [],
      securePilotEnabled: true,
    })

    expect(diagnostics).toMatchObject({
      state: "active",
      label: "Max ready",
    })
    expect(diagnostics?.warning).toContain("⚠️")
  })

  it("returns active diagnostics when max prerequisites pass", () => {
    const diagnostics = getMaxModeDiagnostics({
      privacy: "max",
      relayChecks: [
        {
          relay: "wss://relay.navcom.app",
          status: "ready",
          supportsGroups: true,
          supportsNipEeSignal: true,
          supportsNip104: true,
          supportsNavcomBaseline: true,
          isNavcomDefaultRelay: true,
          authRequired: false,
          challengeResponseAuth: false,
          details: "ok",
        },
      ],
      securePilotEnabled: true,
    })

    expect(diagnostics).toMatchObject({
      state: "active",
      label: "Max ready",
    })
  })

  it("returns deterministic tone classes", () => {
    expect(getMaxDiagnosticsToneClass("active")).toContain("emerald")
    expect(getMaxDiagnosticsToneClass("blocked")).toContain("warning")
    expect(getMaxDiagnosticsToneClass("pending")).toContain("neutral")
  })
})
