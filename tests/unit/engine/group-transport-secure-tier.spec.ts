import {describe, expect, it} from "vitest"
import {evaluateSecureGroupSendTierPolicy} from "../../../src/engine/group-transport-secure-tier"

describe("engine/group-transport-secure-tier", () => {
  it("allows secure sends for tier 0 and tier 2 secure mode", () => {
    expect(
      evaluateSecureGroupSendTierPolicy({
        groupId: "ops",
        missionTier: 0,
      }),
    ).toEqual({ok: true})

    expect(
      evaluateSecureGroupSendTierPolicy({
        groupId: "ops",
        missionTier: 2,
        requestedMode: "secure-nip-ee",
        resolvedMode: "secure-nip-ee",
      }),
    ).toEqual({ok: true})
  })

  it("blocks tier 2 insecure downgrade by default", () => {
    const result = evaluateSecureGroupSendTierPolicy({
      groupId: "ops",
      missionTier: 2,
      requestedMode: "secure-nip-ee",
      resolvedMode: "baseline-nip29",
    })

    expect(result).toMatchObject({ok: false})
  })

  it("requires explicit confirmation for tier 2 override paths", () => {
    const blocked = evaluateSecureGroupSendTierPolicy({
      groupId: "ops",
      missionTier: 2,
      requestedMode: "baseline-nip29",
      resolvedMode: "baseline-nip29",
      allowTier2Override: true,
      downgradeConfirmed: false,
    })

    expect(blocked).toMatchObject({ok: false})

    const allowed = evaluateSecureGroupSendTierPolicy({
      groupId: "ops",
      missionTier: 2,
      requestedMode: "baseline-nip29",
      resolvedMode: "baseline-nip29",
      allowTier2Override: true,
      downgradeConfirmed: true,
    })

    expect(allowed).toEqual({ok: true})
  })
})
