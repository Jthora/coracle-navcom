import {describe, expect, it} from "vitest"
import {
  GUIDED_PRIVACY_OPTIONS,
  getGuidedSecurityStatus,
  getRecommendedRelayHost,
} from "src/app/groups/guided-create-options"

describe("app/groups guided-create-options", () => {
  it("keeps explicit PQC-preferred and compatibility labels", () => {
    expect(GUIDED_PRIVACY_OPTIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "private",
          label: "PQC-preferred",
        }),
        expect.objectContaining({
          id: "fallback-friendly",
          label: "Compatibility first",
        }),
      ]),
    )
  })

  it("describes secure-first and fallback behavior for private mode", () => {
    const status = getGuidedSecurityStatus("private")

    expect(status.badge).toBe("PQC-preferred")
    expect(status.hint).toContain("secure post-quantum-capable transport first")
    expect(status.hint).toContain("compatibility fallback")
  })

  it("returns compatibility guidance for fallback-friendly mode", () => {
    const status = getGuidedSecurityStatus("fallback-friendly")

    expect(status.badge).toBe("Prefer compatibility")
    expect(status.hint).toContain("broader relay support")
    expect(status.hint).toContain("switch to PQC-preferred later")
  })

  it("extracts relay host from valid group id", () => {
    expect(getRecommendedRelayHost("relay.example'ops")).toBe("relay.example")
  })

  it("falls back to relay.example when address is invalid", () => {
    expect(getRecommendedRelayHost("not-a-valid-group-id")).toBe("relay.example")
  })

  it("returns balanced defaults for standard privacy mode", () => {
    const status = getGuidedSecurityStatus("standard")

    expect(status.badge).toBe("Balanced default")
    expect(status.hint).toContain("balanced")
    expect(status.hint).toContain("Runtime state is shown")
  })
})
