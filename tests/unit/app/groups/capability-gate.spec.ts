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

    expect(warning).toContain("Secure capability mismatch")
  })
})
