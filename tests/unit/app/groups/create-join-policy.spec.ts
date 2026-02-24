import {describe, expect, it} from "vitest"
import {
  getRelayAuthRequirementBlockReason,
  getInvitePolicyBlockReason,
  resolveGuidedSetupBlockReason,
  getStrictModeCapabilityBlockReason,
  shouldAllowCapabilityFallback,
  toInvitePolicyBlockMessage,
  toGuidedSetupBlockMessage,
  toRelayRequirementBlockMessage,
  toStrictModeCapabilityBlockMessage,
} from "src/app/groups/create-join-policy"

describe("app/groups create-join-policy", () => {
  it("allows fallback only in auto mode", () => {
    expect(shouldAllowCapabilityFallback("auto")).toBe(true)
    expect(shouldAllowCapabilityFallback("basic")).toBe(false)
    expect(shouldAllowCapabilityFallback("secure")).toBe(false)
    expect(shouldAllowCapabilityFallback("max")).toBe(false)
  })

  it("blocks strict modes when secure pilot is disabled", () => {
    const reason = getStrictModeCapabilityBlockReason({
      privacy: "secure",
      relayChecks: [
        {
          relay: "wss://relay.example",
          supportsNipEeSignal: true,
          supportsNip104: false,
        },
      ],
      securePilotEnabled: false,
    })

    expect(reason).toBe("STRICT_REQUIRES_SECURE_PILOT")
    expect(toStrictModeCapabilityBlockMessage(reason!)).toContain("Enable secure pilot")
  })

  it("does not block max mode when nip-104 signal is missing", () => {
    const reason = getStrictModeCapabilityBlockReason({
      privacy: "max",
      relayChecks: [
        {
          relay: "wss://relay.example",
          supportsNipEeSignal: true,
          supportsNip104: false,
        },
      ],
      securePilotEnabled: true,
    })

    expect(reason).toBeNull()
  })

  it("does not block max mode when relays violate navcom-only constraints", () => {
    const reason = getStrictModeCapabilityBlockReason({
      privacy: "max",
      relayChecks: [
        {
          relay: "wss://relay.navcom.app",
          status: "ready",
          supportsGroups: true,
          supportsNipEeSignal: true,
          supportsNip104: true,
          supportsNavcomBaseline: true,
          isNavcomDefaultRelay: true,
          authRequired: false,
          challengeResponseAuth: false,
          details: "ok",
        },
        {
          relay: "wss://relay.public.example",
          status: "ready",
          supportsGroups: true,
          supportsNipEeSignal: true,
          supportsNip104: true,
          supportsNavcomBaseline: true,
          isNavcomDefaultRelay: false,
          authRequired: false,
          challengeResponseAuth: false,
          details: "ok",
        },
      ],
      securePilotEnabled: true,
    })

    expect(reason).toBeNull()
  })

  it("returns deterministic invite policy block reason for tier 2 non-strict mode", () => {
    const reason = getInvitePolicyBlockReason({
      missionTier: 2,
      privacy: "auto",
    })

    expect(reason).toBe("INVITE_TIER2_REQUIRES_STRICT_MODE")
    expect(toInvitePolicyBlockMessage(reason!)).toContain("requires Secure or Max")
  })

  it("does not block invite policy for tier 2 strict modes", () => {
    expect(
      getInvitePolicyBlockReason({
        missionTier: 2,
        privacy: "secure",
      }),
    ).toBeNull()
    expect(
      getInvitePolicyBlockReason({
        missionTier: 2,
        privacy: "max",
      }),
    ).toBeNull()
  })

  it("maps relay auth requirement reasons deterministically", () => {
    expect(
      getRelayAuthRequirementBlockReason({
        missingSignerRelays: ["wss://relay.one"],
        unknownMethodRelays: [],
        warnings: [],
      }),
    ).toBe("RELAY_REQUIRES_SIGNER_FOR_AUTH")

    expect(
      getRelayAuthRequirementBlockReason({
        missingSignerRelays: [],
        unknownMethodRelays: ["wss://relay.two"],
        warnings: [],
      }),
    ).toBe("RELAY_REQUIRES_RELAY_SPECIFIC_CREDENTIAL")

    expect(
      getRelayAuthRequirementBlockReason({
        missingSignerRelays: [],
        unknownMethodRelays: [],
        warnings: [],
      }),
    ).toBe("RELAY_REQUIRES_AUTH_CHALLENGE")
  })

  it("returns deterministic relay block messages", () => {
    expect(toRelayRequirementBlockMessage("RELAY_REQUIRES_VIABLE_PATH")).toContain(
      "No viable relay path",
    )
    expect(toRelayRequirementBlockMessage("RELAY_REQUIRES_SIGNER_FOR_AUTH")).toContain(
      "no signer is available",
    )
    expect(toRelayRequirementBlockMessage("RELAY_REQUIRES_RELAY_SPECIFIC_CREDENTIAL")).toContain(
      "relay-specific authentication method",
    )
    expect(toRelayRequirementBlockMessage("RELAY_REQUIRES_AUTH_CHALLENGE")).toContain(
      "requires challenge/response authentication",
    )
  })

  it("enforces mode-specific preflight behavior for auto/basic/secure/max", () => {
    const noMissingCredentials = {
      missingSignerRelays: [],
      unknownMethodRelays: [],
      warnings: [],
    }

    expect(
      resolveGuidedSetupBlockReason({
        missionTier: 0,
        privacy: "auto",
        relayChecks: [],
        securePilotEnabled: false,
        hasRelayViabilityBlocker: false,
        hasRelayAuthBlocker: false,
        missingCredentials: noMissingCredentials,
      }),
    ).toBeNull()

    expect(
      resolveGuidedSetupBlockReason({
        missionTier: 0,
        privacy: "basic",
        relayChecks: [],
        securePilotEnabled: false,
        hasRelayViabilityBlocker: false,
        hasRelayAuthBlocker: false,
        missingCredentials: noMissingCredentials,
      }),
    ).toBeNull()

    expect(
      resolveGuidedSetupBlockReason({
        missionTier: 0,
        privacy: "secure",
        relayChecks: [],
        securePilotEnabled: false,
        hasRelayViabilityBlocker: false,
        hasRelayAuthBlocker: false,
        missingCredentials: noMissingCredentials,
      }),
    ).toBe("STRICT_REQUIRES_SECURE_PILOT")

    expect(
      resolveGuidedSetupBlockReason({
        missionTier: 0,
        privacy: "max",
        relayChecks: [
          {
            relay: "wss://relay.example",
            status: "ready",
            supportsGroups: true,
            supportsNipEeSignal: true,
            supportsNip104: false,
            authRequired: false,
            challengeResponseAuth: false,
            details: "ok",
          },
        ],
        securePilotEnabled: true,
        hasRelayViabilityBlocker: false,
        hasRelayAuthBlocker: false,
        missingCredentials: noMissingCredentials,
      }),
    ).toBeNull()
  })

  it("returns guided setup message by reason family", () => {
    expect(toGuidedSetupBlockMessage("INVITE_TIER2_REQUIRES_STRICT_MODE")).toContain(
      "mission tier 2",
    )
    expect(toGuidedSetupBlockMessage("STRICT_REQUIRES_NIP_EE_SIGNAL")).toContain(
      "NIP-EE capability",
    )
    expect(toGuidedSetupBlockMessage("RELAY_REQUIRES_VIABLE_PATH")).toContain(
      "No viable relay path",
    )
  })
})
