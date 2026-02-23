import type {RelayCapabilityCheck} from "src/app/groups/relay-capability"

export type RelayAuthMethodIndicatorTone = "neutral" | "warning" | "danger"

export type RelayAuthMethodIndicator = {
  label: string
  tone: RelayAuthMethodIndicatorTone
  needsCredential: boolean
}

export type MissingRelayCredentialSummary = {
  missingSignerRelays: string[]
  unknownMethodRelays: string[]
  warnings: string[]
}

export type RelayAccessPackageInput = {
  groupAddress: string
  relays: string[]
  checks: RelayCapabilityCheck[]
  securityMode: "auto" | "basic" | "secure" | "max"
  requestedTransportMode: string
}

export type ReceiverSetupChecklistItemId =
  | "group-address"
  | "relay-selection"
  | "relay-capability-check"
  | "relay-auth"
  | "relay-viability"

export type ReceiverSetupChecklistItem = {
  id: ReceiverSetupChecklistItemId
  label: string
  done: boolean
  blocking: boolean
}

export type ReceiverSetupChecklist = {
  items: ReceiverSetupChecklistItem[]
  blockingReasons: string[]
  readyToJoin: boolean
}

const getFallbackExpectation = ({
  securityMode,
  requestedTransportMode,
}: {
  securityMode: RelayAccessPackageInput["securityMode"]
  requestedTransportMode: string
}) => {
  if (securityMode === "max") {
    return "Max (Post Quantum Cryptography): secure transport requested with Navcom PQC-targeted posture. PQC runtime path requires compatible client/signer behavior."
  }

  if (securityMode === "secure") {
    return "Secure (Common Encryption): secure transport requested first. Fallback to baseline may occur when secure path is unavailable."
  }

  if (securityMode === "basic") {
    return "Basic (Open Group): baseline relay behavior (NIP-29 lane) is expected."
  }

  if (requestedTransportMode === "secure-nip-ee") {
    return "Secure lane requested."
  }

  return "Auto (Compatibility First): baseline transport requested for reliability across mixed relays."
}

export const buildRelayAccessPackageText = ({
  groupAddress,
  relays,
  checks,
  securityMode,
  requestedTransportMode,
}: RelayAccessPackageInput) => {
  const canonicalGroupAddress = (groupAddress || "").trim()
  const relayList = (relays || []).map(relay => relay.trim()).filter(Boolean)
  const authRequiredChecks = (checks || []).filter(check => check.status === "auth-required")

  if (!canonicalGroupAddress || relayList.length === 0) {
    return ""
  }

  const authRequirementLines =
    authRequiredChecks.length > 0
      ? authRequiredChecks
          .map(check => {
            const method =
              check.challengeResponseAuth === true
                ? "challenge/response (NIP-42 signer)"
                : "relay-specific auth (method not advertised)"

            return `- ${check.relay} (${method})`
          })
          .join("\n")
      : "- none"

  return [
    "NAVCOM Group Access Package",
    `Group address: ${canonicalGroupAddress}`,
    "",
    "Relays:",
    ...relayList.map(relay => `- ${relay}`),
    "",
    "Relay authentication requirements:",
    authRequirementLines,
    "",
    `Security mode: ${securityMode}`,
    `Requested transport mode: ${requestedTransportMode || "baseline-nip29"}`,
    `Fallback expectation: ${getFallbackExpectation({securityMode, requestedTransportMode})}`,
  ].join("\n")
}

export const buildReceiverSetupChecklist = ({
  groupAddress,
  groupAddressValid,
  selectedRelays,
  checks,
  authConfirmed,
}: {
  groupAddress: string
  groupAddressValid: boolean
  selectedRelays: string[]
  checks: RelayCapabilityCheck[]
  authConfirmed: Record<string, boolean>
}): ReceiverSetupChecklist => {
  const hasAddress = Boolean((groupAddress || "").trim())
  const hasRelaySelection = (selectedRelays || []).length > 0
  const hasCapabilityChecks = (checks || []).length > 0
  const unresolvedAuthCount = (checks || []).filter(
    check => check.status === "auth-required" && !authConfirmed[check.relay],
  ).length
  const hasViableRelayPath =
    (checks || []).length === 0
      ? hasRelaySelection
      : (checks || []).some(check => {
          if (check.status === "unreachable") return false
          if (check.status === "auth-required") {
            return Boolean(authConfirmed[check.relay])
          }

          return true
        })

  const addressDone = groupAddressValid && hasAddress
  const relaySelectionDone = hasRelaySelection
  const relayChecksDone = hasCapabilityChecks
  const relayAuthDone = unresolvedAuthCount === 0
  const relayViabilityDone = hasViableRelayPath

  const items: ReceiverSetupChecklistItem[] = [
    {
      id: "group-address",
      label: "Valid group address provided",
      done: addressDone,
      blocking: !addressDone,
    },
    {
      id: "relay-selection",
      label: "At least one relay selected",
      done: relaySelectionDone,
      blocking: !relaySelectionDone,
    },
    {
      id: "relay-capability-check",
      label: "Relay capability check completed",
      done: relayChecksDone,
      blocking: !relayChecksDone,
    },
    {
      id: "relay-auth",
      label: "Required relay authentication resolved",
      done: relayAuthDone,
      blocking: !relayAuthDone,
    },
    {
      id: "relay-viability",
      label: "Viable relay path available",
      done: relayViabilityDone,
      blocking: !relayViabilityDone,
    },
  ]

  const blockingReasons: string[] = []

  if (!addressDone) {
    blockingReasons.push("Provide a valid group address from the invite.")
  }

  if (!relaySelectionDone) {
    blockingReasons.push("Add at least one relay before joining.")
  }

  if (!relayChecksDone) {
    blockingReasons.push("Run relay capability checks to verify relay reachability and auth needs.")
  }

  if (!relayAuthDone) {
    blockingReasons.push("Authenticate required relays before joining.")
  }

  if (!relayViabilityDone) {
    blockingReasons.push("No viable relay path detected. Replace or authenticate relays.")
  }

  return {
    items,
    blockingReasons,
    readyToJoin: items.every(item => item.done),
  }
}

export const getRelayAuthMethodIndicator = (
  check: Pick<RelayCapabilityCheck, "status" | "authRequired" | "challengeResponseAuth">,
): RelayAuthMethodIndicator => {
  const authRequired = check.status === "auth-required" || check.authRequired === true

  if (!authRequired) {
    return {
      label: "No relay auth required",
      tone: "neutral",
      needsCredential: false,
    }
  }

  if (check.challengeResponseAuth === true) {
    return {
      label: "Auth: challenge/response (NIP-42 signer)",
      tone: "warning",
      needsCredential: true,
    }
  }

  return {
    label: "Auth required (method not advertised)",
    tone: "danger",
    needsCredential: true,
  }
}

export const summarizeMissingRelayCredentials = ({
  checks,
  authConfirmed,
  hasSigner,
}: {
  checks: RelayCapabilityCheck[]
  authConfirmed: Record<string, boolean>
  hasSigner: boolean
}): MissingRelayCredentialSummary => {
  const missingSignerRelays: string[] = []
  const unknownMethodRelays: string[] = []

  for (const check of checks) {
    if (check.status !== "auth-required" || authConfirmed[check.relay]) continue

    if (check.challengeResponseAuth === true) {
      if (!hasSigner) {
        missingSignerRelays.push(check.relay)
      }

      continue
    }

    unknownMethodRelays.push(check.relay)
  }

  const warnings: string[] = []

  if (missingSignerRelays.length > 0) {
    warnings.push(
      "Some relays require challenge/response authentication, but a signer is unavailable.",
    )
  }

  if (unknownMethodRelays.length > 0) {
    warnings.push(
      "Some relays require authentication with a relay-specific method that is not advertised.",
    )
  }

  return {
    missingSignerRelays,
    unknownMethodRelays,
    warnings,
  }
}
