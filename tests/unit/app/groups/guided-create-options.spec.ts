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
          id: "secure",
          label: "Secure (Common Encryption)",
        }),
        expect.objectContaining({
          id: "max",
          label: "Max (Post Quantum Cryptography)",
        }),
      ]),
    )
  })

  it("describes secure lane behavior for secure mode", () => {
    const status = getGuidedSecurityStatus("secure")

    expect(status.badge).toBe("Secure (Common Encryption)")
    expect(status.hint).toContain("secure-nip-ee")
    expect(status.hint).toContain("does not allow capability fallback")
  })

  it("returns compatibility guidance for auto mode", () => {
    const status = getGuidedSecurityStatus("auto")

    expect(status.badge).toBe("Auto (Compatibility First)")
    expect(status.hint).toContain("baseline-nip29")
    expect(status.hint).toContain("capability fallback")
  })

  it("extracts relay host from valid group id", () => {
    expect(getRecommendedRelayHost("relay.example'ops")).toBe("relay.example")
  })

  it("falls back to relay.example when address is invalid", () => {
    expect(getRecommendedRelayHost("not-a-valid-group-id")).toBe("relay.example")
  })

  it("returns interoperability defaults for basic mode", () => {
    const status = getGuidedSecurityStatus("basic")

    expect(status.badge).toBe("Basic (Open Group)")
    expect(status.hint).toContain("baseline-nip29")
    expect(status.hint).toContain("open/interoperable")
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
