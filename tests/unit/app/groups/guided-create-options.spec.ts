import {describe, expect, it} from "vitest"
import {
  GUIDED_PRIVACY_OPTIONS,
  getGuidedSecurityStatus,
  getRecommendedRelayHost,
} from "src/app/groups/guided-create-options"

describe("app/groups guided-create-options", () => {
  it("exposes explicit security and compatibility labels", () => {
    expect(GUIDED_PRIVACY_OPTIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "private",
          label: "Higher security (PQC preferred)",
        }),
        expect.objectContaining({
          id: "fallback-friendly",
          label: "Maximum compatibility (lowest security)",
        }),
      ]),
    )
  })

  it("describes secure-first and fallback behavior for private mode", () => {
    const status = getGuidedSecurityStatus("private")

    expect(status.badge).toBe("Higher security (PQC preferred)")
    expect(status.hint).toContain("secure transport first")
    expect(status.hint).toContain("PQC-capable path")
    expect(status.hint).toContain("fall back to compatibility")
  })

  it("returns compatibility guidance for fallback-friendly mode", () => {
    const status = getGuidedSecurityStatus("fallback-friendly")

    expect(status.badge).toBe("Maximum compatibility")
    expect(status.hint).toContain("widest support")
    expect(status.hint).toContain("lower security")
  })

  it("extracts relay host from valid group id", () => {
    expect(getRecommendedRelayHost("relay.example'ops")).toBe("relay.example")
  })

  it("falls back to relay.example when address is invalid", () => {
    expect(getRecommendedRelayHost("not-a-valid-group-id")).toBe("relay.example")
  })

  it("returns balanced defaults for standard privacy mode", () => {
    const status = getGuidedSecurityStatus("standard")

    expect(status.badge).toBe("Balanced security")
    expect(status.hint).toContain("compatibility transport")
    expect(status.hint).toContain("upgrades to secure transport")
    expect(status.hint).toContain("balanced reliability and security")
  })
})
