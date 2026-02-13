import {describe, expect, it} from "vitest"
import {evaluateTierPolicy} from "../../../src/engine/group-tier-policy"

describe("engine/group-tier-policy", () => {
  it("allows tier 0 without restrictions", () => {
    expect(
      evaluateTierPolicy({
        missionTier: 0,
        groupId: "ops",
        actorRole: "admin",
        requestedMode: "baseline-nip29",
        resolvedMode: "baseline-nip29",
      }),
    ).toEqual({ok: true})
  })

  it("blocks tier 1 downgrade without confirmation", () => {
    const result = evaluateTierPolicy({
      missionTier: 1,
      groupId: "ops",
      actorRole: "admin",
      requestedMode: "secure-nip-ee",
      resolvedMode: "baseline-nip29",
      downgradeConfirmed: false,
    })

    expect(result.ok).toBe(false)
  })

  it("enforces tier 2 secure lock unless override confirmed", () => {
    const blocked = evaluateTierPolicy({
      missionTier: 2,
      groupId: "ops",
      actorRole: "admin",
      requestedMode: "baseline-nip29",
      resolvedMode: "baseline-nip29",
    })

    expect(blocked.ok).toBe(false)

    const override = evaluateTierPolicy({
      missionTier: 2,
      groupId: "ops",
      actorRole: "admin",
      requestedMode: "baseline-nip29",
      resolvedMode: "baseline-nip29",
      allowTier2Override: true,
      downgradeConfirmed: true,
      now: 100,
    })

    expect(override).toMatchObject({
      ok: true,
      overrideAuditEvent: {
        action: "tier-policy-override",
        groupId: "ops",
        missionTier: 2,
      },
    })
  })
})
