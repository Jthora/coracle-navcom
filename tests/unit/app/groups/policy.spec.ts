import {describe, expect, it} from "vitest"
import {
  asGroupPolicySummary,
  createDefaultGroupPolicyDraft,
  evaluateGroupPolicyDraft,
  isGroupPolicyDraftValid,
} from "src/app/groups/policy"

describe("app/groups policy", () => {
  it("creates baseline default draft", () => {
    expect(createDefaultGroupPolicyDraft()).toEqual({
      tier: 0,
      preferredMode: "baseline-nip29",
      allowDowngrade: true,
    })
  })

  it("flags tier-2 downgrade as invalid", () => {
    const draft = {
      tier: 2 as const,
      preferredMode: "secure-nip-ee" as const,
      allowDowngrade: true,
    }

    expect(isGroupPolicyDraftValid(draft)).toBe(false)
    expect(evaluateGroupPolicyDraft(draft).some(notice => notice.level === "warning")).toBe(true)
  })

  it("builds deterministic policy summary", () => {
    expect(
      asGroupPolicySummary({
        tier: 1,
        preferredMode: "secure-nip-ee",
        allowDowngrade: false,
      }),
    ).toBe("Tier 1 · secure-nip-ee · downgrade disabled")
  })
})
