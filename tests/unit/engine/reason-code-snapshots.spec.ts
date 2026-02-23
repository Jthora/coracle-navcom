import {describe, expect, it} from "vitest"
import {GROUP_COMMAND_REASON} from "../../../src/domain/group-command-feedback"
import {GROUP_SECURE_CONTROL_REASON} from "../../../src/engine/group-transport-secure-control"
import {GROUP_SECURE_SEND_INPUT_REASON} from "../../../src/engine/group-transport-secure-input"
import {GROUP_TRANSPORT_INTENT_REASON} from "../../../src/engine/group-transport-intent"
import {
  getRelayAuthRequirementBlockReason,
  resolveGuidedSetupBlockReason,
} from "../../../src/app/groups/create-join-policy"
import type {RelayCapabilityCheck} from "../../../src/app/groups/relay-capability"

const makeRelayCheck = (overrides: Partial<RelayCapabilityCheck> = {}): RelayCapabilityCheck => ({
  relay: "wss://relay.example",
  status: "ready",
  supportsGroups: true,
  authRequired: false,
  challengeResponseAuth: false,
  details: "ok",
  ...overrides,
})

describe("engine reason-code snapshots", () => {
  it("locks engine reason-code enums", () => {
    expect({
      command: Object.values(GROUP_COMMAND_REASON),
      secureControl: Object.values(GROUP_SECURE_CONTROL_REASON),
      secureSendInput: Object.values(GROUP_SECURE_SEND_INPUT_REASON),
      transportIntent: Object.values(GROUP_TRANSPORT_INTENT_REASON),
    }).toMatchInlineSnapshot(`
      {
        "command": [
          "GROUP_COMMAND_PERMISSION_DENIED",
          "GROUP_COMMAND_INVALID_INPUT",
          "GROUP_COMMAND_CAPABILITY_BLOCKED",
          "GROUP_COMMAND_POLICY_BLOCKED",
          "GROUP_COMMAND_PUBLISH_FAILED",
          "GROUP_COMMAND_UNKNOWN",
        ],
        "secureControl": [
          "GROUP_SECURE_CONTROL_INVALID_SHAPE",
          "GROUP_SECURE_CONTROL_GROUP_ID_REQUIRED",
          "GROUP_SECURE_CONTROL_MEMBER_PUBKEY_REQUIRED",
        ],
        "secureSendInput": [
          "GROUP_SECURE_SEND_INVALID_SHAPE",
          "GROUP_SECURE_SEND_GROUP_ID_REQUIRED",
          "GROUP_SECURE_SEND_CONTENT_REQUIRED",
          "GROUP_SECURE_SEND_RECIPIENTS_REQUIRED",
          "GROUP_SECURE_SEND_RECIPIENT_PUBKEY_INVALID",
        ],
        "transportIntent": [
          "GROUP_TRANSPORT_INTENT_INVALID_GROUP_ID",
          "GROUP_TRANSPORT_INTENT_INVALID_MEMBER_PUBKEY",
        ],
      }
    `)
  })

  it("locks guided setup blocker reason outcomes", () => {
    const missingCredentials = {
      missingSignerRelays: ["wss://relay.signer"],
      unknownMethodRelays: [],
      warnings: [],
    }

    const outcomes = {
      strictPilotDisabled: resolveGuidedSetupBlockReason({
        missionTier: 0,
        privacy: "secure",
        relayChecks: [makeRelayCheck({supportsNipEeSignal: true})],
        securePilotEnabled: false,
        hasRelayViabilityBlocker: false,
        hasRelayAuthBlocker: false,
        missingCredentials,
      }),
      strictNoChecks: resolveGuidedSetupBlockReason({
        missionTier: 0,
        privacy: "secure",
        relayChecks: [],
        securePilotEnabled: true,
        hasRelayViabilityBlocker: false,
        hasRelayAuthBlocker: false,
        missingCredentials,
      }),
      strictNoSignal: resolveGuidedSetupBlockReason({
        missionTier: 0,
        privacy: "secure",
        relayChecks: [makeRelayCheck({supportsNipEeSignal: false})],
        securePilotEnabled: true,
        hasRelayViabilityBlocker: false,
        hasRelayAuthBlocker: false,
        missingCredentials,
      }),
      maxMissingNip104Signal: resolveGuidedSetupBlockReason({
        missionTier: 0,
        privacy: "max",
        relayChecks: [
          makeRelayCheck({
            supportsNipEeSignal: true,
            supportsNip104: false,
          }),
        ],
        securePilotEnabled: true,
        hasRelayViabilityBlocker: false,
        hasRelayAuthBlocker: false,
        missingCredentials,
      }),
      inviteTier2NonStrict: resolveGuidedSetupBlockReason({
        missionTier: 2,
        privacy: "basic",
        relayChecks: [makeRelayCheck({supportsNipEeSignal: true})],
        securePilotEnabled: true,
        hasRelayViabilityBlocker: false,
        hasRelayAuthBlocker: false,
        missingCredentials,
      }),
      relayViabilityBlocked: resolveGuidedSetupBlockReason({
        missionTier: 0,
        privacy: "auto",
        relayChecks: [makeRelayCheck({supportsNipEeSignal: true})],
        securePilotEnabled: true,
        hasRelayViabilityBlocker: true,
        hasRelayAuthBlocker: false,
        missingCredentials,
      }),
      relayAuthUnknownMethod: resolveGuidedSetupBlockReason({
        missionTier: 0,
        privacy: "auto",
        relayChecks: [makeRelayCheck({supportsNipEeSignal: true})],
        securePilotEnabled: true,
        hasRelayViabilityBlocker: false,
        hasRelayAuthBlocker: true,
        missingCredentials: {
          missingSignerRelays: [],
          unknownMethodRelays: ["wss://relay.unknown"],
          warnings: [],
        },
      }),
      relayAuthDefaultChallenge: getRelayAuthRequirementBlockReason({
        missingSignerRelays: [],
        unknownMethodRelays: [],
        warnings: [],
      }),
    }

    expect(outcomes).toMatchInlineSnapshot(`
      {
        "inviteTier2NonStrict": "INVITE_TIER2_REQUIRES_STRICT_MODE",
        "maxMissingNip104Signal": "MAX_REQUIRES_NIP104_SIGNAL",
        "relayAuthDefaultChallenge": "RELAY_REQUIRES_AUTH_CHALLENGE",
        "relayAuthUnknownMethod": "RELAY_REQUIRES_RELAY_SPECIFIC_CREDENTIAL",
        "relayViabilityBlocked": "RELAY_REQUIRES_VIABLE_PATH",
        "strictNoChecks": "STRICT_REQUIRES_RELAY_CHECKS",
        "strictNoSignal": "STRICT_REQUIRES_NIP_EE_SIGNAL",
        "strictPilotDisabled": "STRICT_REQUIRES_SECURE_PILOT",
      }
    `)
  })
})
