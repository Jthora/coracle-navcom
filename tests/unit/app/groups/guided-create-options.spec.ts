import {describe, expect, it} from "vitest"
import {
  formatSelectedRelays,
  getPrimaryRelayHostFromSelectedRelays,
  getRelayPresetValues,
  parseSelectedRelays,
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

  it("parses selected relays and removes duplicates", () => {
    const relays = parseSelectedRelays("wss://relay.one\nrelay.one\nrelay.two")

    expect(relays).toEqual(["wss://relay.one", "wss://relay.two"])
    expect(formatSelectedRelays(relays)).toContain("wss://relay.one")
  })

  it("derives primary relay host from selected relays", () => {
    expect(getPrimaryRelayHostFromSelectedRelays("wss://relay.example\nwss://relay.two")).toBe(
      "relay.example",
    )
  })

  it("builds navcom and public relay presets", () => {
    const navcom = getRelayPresetValues({
      preset: "navcom",
      recommendedRelayHost: "relay.navcom.local",
      defaultRelays: ["wss://relay.default.one"],
      indexerRelays: ["wss://relay.public.one"],
    })
    const publicRelays = getRelayPresetValues({
      preset: "public",
      recommendedRelayHost: "relay.navcom.local",
      defaultRelays: ["wss://relay.default.one"],
      indexerRelays: ["wss://relay.public.one"],
    })

    expect(navcom[0]).toBe("wss://relay.navcom.local")
    expect(publicRelays).toEqual(["wss://relay.public.one"])
  })
})
