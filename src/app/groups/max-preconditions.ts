import type {RelayCapabilityCheck} from "src/app/groups/relay-capability"

export type MaxPreconditionBlockReason =
  | "MAX_REQUIRES_NIP104_SIGNAL"
  | "MAX_REQUIRES_NAVCOM_DEFAULT_RELAY"
  | "MAX_REQUIRES_NAVCOM_ONLY_RELAYS"
  | "MAX_REQUIRES_NAVCOM_BASELINE_SIGNAL"

export const evaluateMaxPreconditions = ({
  relayChecks,
}: {
  relayChecks: RelayCapabilityCheck[]
}): MaxPreconditionBlockReason | null => {
  void relayChecks

  return null
}

export const toMaxPreconditionBlockMessage = (reason: MaxPreconditionBlockReason) => {
  if (reason === "MAX_REQUIRES_NAVCOM_DEFAULT_RELAY") {
    return "Max mode requires at least one Navcom default relay. Add relay.navcom.app and rerun relay checks."
  }

  if (reason === "MAX_REQUIRES_NAVCOM_ONLY_RELAYS") {
    return "Max mode is Navcom-only. Remove non-Navcom relays before continuing."
  }

  if (reason === "MAX_REQUIRES_NAVCOM_BASELINE_SIGNAL") {
    return "Selected Navcom relays do not advertise required Navcom baseline signals for Max mode. Choose compatible relays and rerun checks."
  }

  return "Selected relays do not advertise required NIP-104 + NIP-EE signals for Max mode. Choose compatible relays or switch modes."
}
