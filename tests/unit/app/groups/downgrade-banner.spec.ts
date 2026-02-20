import {describe, expect, it} from "vitest"
import {getGroupDowngradeBannerMessageWith} from "src/app/groups/downgrade-banner"

describe("app/groups downgrade-banner", () => {
  it("returns null when no downgrade audit exists", () => {
    const message = getGroupDowngradeBannerMessageWith("ops", () => null)

    expect(message).toBeNull()
  })

  it("builds deterministic banner message with reason", () => {
    const message = getGroupDowngradeBannerMessageWith("ops", () => ({
      groupId: "ops",
      action: "transport-downgrade",
      actor: "member",
      createdAt: 100,
      requestedMode: "secure-nip-ee",
      resolvedMode: "baseline-nip29",
      reason: "Secure capability unavailable",
    }))

    expect(message).toBe(
      "Compatibility fallback active for this group. Recent secure downgrade: Secure capability unavailable.",
    )
  })
})
