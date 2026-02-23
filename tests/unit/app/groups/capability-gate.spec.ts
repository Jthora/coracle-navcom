import {beforeEach, describe, expect, it} from "vitest"
import {getSecureCapabilityGateMessage} from "src/app/groups/capability-gate"
import {GROUP_CAPABILITY_REASON} from "src/domain/group-capability-probe"
import {setSecurePilotEnabled} from "src/engine/group-transport-secure"

describe("app/groups capability-gate", () => {
  beforeEach(() => {
    setSecurePilotEnabled(false)
  })

  it("returns null for baseline mode", () => {
    expect(getSecureCapabilityGateMessage({preferredMode: "baseline-nip29"})).toBeNull()
  })

  it("returns warning for secure mode when secure pilot disabled", () => {
    const warning = getSecureCapabilityGateMessage({preferredMode: "secure-nip-ee"})

    expect(typeof warning).toBe("string")
    expect(warning).toContain("Strict mode remains blocked")
  })

  it("returns auto-compatible warning when secure pilot disabled in auto mode", () => {
    const warning = getSecureCapabilityGateMessage({
      preferredMode: "secure-nip-ee",
      securityMode: "auto",
    })

    expect(typeof warning).toBe("string")
    expect(warning).toContain("Auto mode can continue with compatibility transport")
  })

  it("returns readiness mismatch warning with capability reason context", () => {
    setSecurePilotEnabled(true)

    const warning = getSecureCapabilityGateMessage({
      preferredMode: "secure-nip-ee",
      capabilitySnapshot: {
        readiness: "R3",
        reasons: [GROUP_CAPABILITY_REASON.MISSING_SIGNER_FEATURE],
      },
    })

    if (warning === null) {
      throw new Error("Expected mismatch warning")
    }

    expect(warning).toContain("Strict mode remains blocked")
  })

  it("returns strict max mismatch wording when max mode is selected", () => {
    setSecurePilotEnabled(true)

    const warning = getSecureCapabilityGateMessage({
      preferredMode: "secure-nip-ee",
      securityMode: "max",
      capabilitySnapshot: {
        readiness: "R2",
      },
    })

    if (warning === null) {
      throw new Error("Expected max mismatch warning")
    }

    expect(warning).toContain("Max requirements not met")
  })
})
