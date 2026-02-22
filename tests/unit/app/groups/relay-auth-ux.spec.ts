import {describe, expect, it} from "vitest"
import {
  buildReceiverSetupChecklist,
  buildRelayAccessPackageText,
  getRelayAuthMethodIndicator,
  summarizeMissingRelayCredentials,
} from "src/app/groups/relay-auth-ux"

describe("app/groups relay-auth-ux", () => {
  it("returns neutral indicator when auth is not required", () => {
    const indicator = getRelayAuthMethodIndicator({
      status: "ready",
      authRequired: false,
      challengeResponseAuth: false,
    })

    expect(indicator.needsCredential).toBe(false)
    expect(indicator.tone).toBe("neutral")
  })

  it("returns challenge/response indicator when auth-required relay advertises NIP-42", () => {
    const indicator = getRelayAuthMethodIndicator({
      status: "auth-required",
      authRequired: true,
      challengeResponseAuth: true,
    })

    expect(indicator.needsCredential).toBe(true)
    expect(indicator.tone).toBe("warning")
    expect(indicator.label).toContain("NIP-42")
  })

  it("returns unknown-method indicator when auth-required relay does not advertise challenge auth", () => {
    const indicator = getRelayAuthMethodIndicator({
      status: "auth-required",
      authRequired: true,
      challengeResponseAuth: false,
    })

    expect(indicator.needsCredential).toBe(true)
    expect(indicator.tone).toBe("danger")
  })

  it("summarizes missing signer and unknown relay auth method requirements", () => {
    const summary = summarizeMissingRelayCredentials({
      checks: [
        {
          relay: "wss://relay.signer-required",
          status: "auth-required",
          supportsGroups: true,
          authRequired: true,
          challengeResponseAuth: true,
          details: "auth",
        },
        {
          relay: "wss://relay.unknown-method",
          status: "auth-required",
          supportsGroups: true,
          authRequired: true,
          challengeResponseAuth: false,
          details: "auth",
        },
      ],
      authConfirmed: {},
      hasSigner: false,
    })

    expect(summary.missingSignerRelays).toEqual(["wss://relay.signer-required"])
    expect(summary.unknownMethodRelays).toEqual(["wss://relay.unknown-method"])
    expect(summary.warnings).toHaveLength(2)
  })

  it("does not warn for already confirmed auth-required relays", () => {
    const summary = summarizeMissingRelayCredentials({
      checks: [
        {
          relay: "wss://relay.auth-ok",
          status: "auth-required",
          supportsGroups: true,
          authRequired: true,
          challengeResponseAuth: true,
          details: "auth",
        },
      ],
      authConfirmed: {"wss://relay.auth-ok": true},
      hasSigner: false,
    })

    expect(summary.warnings).toEqual([])
    expect(summary.missingSignerRelays).toEqual([])
    expect(summary.unknownMethodRelays).toEqual([])
  })

  it("builds sender access package with relays, auth requirements, and fallback expectation", () => {
    const text = buildRelayAccessPackageText({
      groupAddress: "relay.example'ops",
      relays: ["wss://relay.example", "wss://relay.secure"],
      checks: [
        {
          relay: "wss://relay.secure",
          status: "auth-required",
          supportsGroups: true,
          authRequired: true,
          challengeResponseAuth: true,
          details: "auth",
        },
      ],
      securityMode: "private",
      requestedTransportMode: "secure-nip-ee",
    })

    expect(text).toContain("NAVCOM Group Access Package")
    expect(text).toContain("Group address: relay.example'ops")
    expect(text).toContain("- wss://relay.example")
    expect(text).toContain("- wss://relay.secure (challenge/response (NIP-42 signer))")
    expect(text).toContain("Security mode: private")
    expect(text).toContain("Requested transport mode: secure-nip-ee")
    expect(text).toContain("Fallback expectation:")
  })

  it("returns empty string when address or relays are missing", () => {
    expect(
      buildRelayAccessPackageText({
        groupAddress: "",
        relays: ["wss://relay.example"],
        checks: [],
        securityMode: "standard",
        requestedTransportMode: "baseline-nip29",
      }),
    ).toBe("")

    expect(
      buildRelayAccessPackageText({
        groupAddress: "relay.example'ops",
        relays: [],
        checks: [],
        securityMode: "standard",
        requestedTransportMode: "baseline-nip29",
      }),
    ).toBe("")
  })

  it("builds receiver checklist with blocking reasons when setup is incomplete", () => {
    const checklist = buildReceiverSetupChecklist({
      groupAddress: "relay.example'ops",
      groupAddressValid: true,
      selectedRelays: ["wss://relay.auth"],
      checks: [
        {
          relay: "wss://relay.auth",
          status: "auth-required",
          supportsGroups: true,
          authRequired: true,
          challengeResponseAuth: true,
          details: "auth",
        },
      ],
      authConfirmed: {},
    })

    expect(checklist.readyToJoin).toBe(false)
    expect(checklist.items.find(item => item.id === "relay-auth")?.done).toBe(false)
    expect(checklist.blockingReasons).toContain("Authenticate required relays before joining.")
  })

  it("marks receiver checklist ready when address, checks, auth, and viability are satisfied", () => {
    const checklist = buildReceiverSetupChecklist({
      groupAddress: "relay.example'ops",
      groupAddressValid: true,
      selectedRelays: ["wss://relay.ready"],
      checks: [
        {
          relay: "wss://relay.ready",
          status: "ready",
          supportsGroups: true,
          authRequired: false,
          challengeResponseAuth: false,
          details: "ready",
        },
      ],
      authConfirmed: {},
    })

    expect(checklist.readyToJoin).toBe(true)
    expect(checklist.blockingReasons).toEqual([])
    expect(checklist.items.every(item => item.done)).toBe(true)
  })
})
