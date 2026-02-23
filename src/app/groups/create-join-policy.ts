import type {GuidedPrivacyLevel} from "src/app/groups/guided-create-options"
import type {RelayCapabilityCheck} from "src/app/groups/relay-capability"
import type {MissingRelayCredentialSummary} from "src/app/groups/relay-auth-ux"
import {
  evaluateMaxPreconditions,
  toMaxPreconditionBlockMessage,
  type MaxPreconditionBlockReason,
} from "src/app/groups/max-preconditions"

export type GuidedStrictModeBlockReason =
  | "STRICT_REQUIRES_SECURE_PILOT"
  | "STRICT_REQUIRES_RELAY_CHECKS"
  | "STRICT_REQUIRES_NIP_EE_SIGNAL"
  | MaxPreconditionBlockReason

export type GuidedInvitePolicyBlockReason = "INVITE_TIER2_REQUIRES_STRICT_MODE"

export type GuidedRelayRequirementBlockReason =
  | "RELAY_REQUIRES_VIABLE_PATH"
  | "RELAY_REQUIRES_AUTH_CHALLENGE"
  | "RELAY_REQUIRES_SIGNER_FOR_AUTH"
  | "RELAY_REQUIRES_RELAY_SPECIFIC_CREDENTIAL"

export type GuidedSetupBlockReason =
  | GuidedInvitePolicyBlockReason
  | GuidedStrictModeBlockReason
  | GuidedRelayRequirementBlockReason

export const isStrictGuidedMode = (privacy: GuidedPrivacyLevel) =>
  privacy === "secure" || privacy === "max"

export const shouldAllowCapabilityFallback = (privacy: GuidedPrivacyLevel) => privacy === "auto"

const hasSecureSignal = (check: RelayCapabilityCheck) => check.supportsNipEeSignal === true

export const getStrictModeCapabilityBlockReason = ({
  privacy,
  relayChecks,
  securePilotEnabled,
}: {
  privacy: GuidedPrivacyLevel
  relayChecks: RelayCapabilityCheck[]
  securePilotEnabled: boolean
}): GuidedStrictModeBlockReason | null => {
  if (!isStrictGuidedMode(privacy)) {
    return null
  }

  if (!securePilotEnabled) {
    return "STRICT_REQUIRES_SECURE_PILOT"
  }

  if (relayChecks.length === 0) {
    return "STRICT_REQUIRES_RELAY_CHECKS"
  }

  if (!relayChecks.some(hasSecureSignal)) {
    return "STRICT_REQUIRES_NIP_EE_SIGNAL"
  }

  if (privacy === "max") {
    const maxPreconditionReason = evaluateMaxPreconditions({relayChecks})

    if (maxPreconditionReason) {
      return maxPreconditionReason
    }
  }

  return null
}

export const toStrictModeCapabilityBlockMessage = (reason: GuidedStrictModeBlockReason) => {
  if (reason === "STRICT_REQUIRES_SECURE_PILOT") {
    return "Secure mode is unavailable in this runtime. Enable secure pilot before using Secure or Max."
  }

  if (reason === "STRICT_REQUIRES_RELAY_CHECKS") {
    return "Run relay checks first. Secure and Max require verified relay capability signals before create/join."
  }

  if (reason === "STRICT_REQUIRES_NIP_EE_SIGNAL") {
    return "Selected relays do not advertise secure NIP-EE capability. Choose relays with secure signals or use Auto/Basic."
  }

  return toMaxPreconditionBlockMessage(reason as MaxPreconditionBlockReason)
}

export const getInvitePolicyBlockReason = ({
  missionTier,
  privacy,
}: {
  missionTier: 0 | 1 | 2 | null
  privacy: GuidedPrivacyLevel
}): GuidedInvitePolicyBlockReason | null => {
  if (missionTier !== 2) {
    return null
  }

  if (privacy === "secure" || privacy === "max") {
    return null
  }

  return "INVITE_TIER2_REQUIRES_STRICT_MODE"
}

export const toInvitePolicyBlockMessage = (reason: GuidedInvitePolicyBlockReason) => {
  if (reason === "INVITE_TIER2_REQUIRES_STRICT_MODE") {
    return "This invite is mission tier 2 and requires Secure or Max mode. Switch security mode to continue."
  }

  return "Invite policy requirements are not satisfied."
}

export const getRelayAuthRequirementBlockReason = (
  missingCredentials: MissingRelayCredentialSummary,
): GuidedRelayRequirementBlockReason => {
  if (missingCredentials.missingSignerRelays.length > 0) {
    return "RELAY_REQUIRES_SIGNER_FOR_AUTH"
  }

  if (missingCredentials.unknownMethodRelays.length > 0) {
    return "RELAY_REQUIRES_RELAY_SPECIFIC_CREDENTIAL"
  }

  return "RELAY_REQUIRES_AUTH_CHALLENGE"
}

export const toRelayRequirementBlockMessage = (reason: GuidedRelayRequirementBlockReason) => {
  if (reason === "RELAY_REQUIRES_VIABLE_PATH") {
    return "No viable relay path is available. Run relay checks, authenticate required relays, or update the selected relay list."
  }

  if (reason === "RELAY_REQUIRES_SIGNER_FOR_AUTH") {
    return "At least one relay requires challenge/response authentication, but no signer is available. Unlock a signer, then retry."
  }

  if (reason === "RELAY_REQUIRES_RELAY_SPECIFIC_CREDENTIAL") {
    return "At least one relay requires a relay-specific authentication method that is not advertised. Provide relay credentials or switch relays."
  }

  return "At least one relay requires challenge/response authentication. Authenticate required relays, then retry."
}

export const resolveGuidedSetupBlockReason = ({
  missionTier,
  privacy,
  relayChecks,
  securePilotEnabled,
  hasRelayViabilityBlocker,
  hasRelayAuthBlocker,
  missingCredentials,
}: {
  missionTier: 0 | 1 | 2 | null
  privacy: GuidedPrivacyLevel
  relayChecks: RelayCapabilityCheck[]
  securePilotEnabled: boolean
  hasRelayViabilityBlocker: boolean
  hasRelayAuthBlocker: boolean
  missingCredentials: MissingRelayCredentialSummary
}): GuidedSetupBlockReason | null => {
  const invitePolicyReason = getInvitePolicyBlockReason({missionTier, privacy})

  if (invitePolicyReason) {
    return invitePolicyReason
  }

  const strictModeReason = getStrictModeCapabilityBlockReason({
    privacy,
    relayChecks,
    securePilotEnabled,
  })

  if (strictModeReason) {
    return strictModeReason
  }

  if (hasRelayViabilityBlocker) {
    return "RELAY_REQUIRES_VIABLE_PATH"
  }

  if (hasRelayAuthBlocker) {
    return getRelayAuthRequirementBlockReason(missingCredentials)
  }

  return null
}

export const toGuidedSetupBlockMessage = (reason: GuidedSetupBlockReason) => {
  if (reason === "INVITE_TIER2_REQUIRES_STRICT_MODE") {
    return toInvitePolicyBlockMessage(reason)
  }

  if (reason.startsWith("STRICT_") || reason.startsWith("MAX_")) {
    return toStrictModeCapabilityBlockMessage(reason as GuidedStrictModeBlockReason)
  }

  return toRelayRequirementBlockMessage(reason as GuidedRelayRequirementBlockReason)
}
