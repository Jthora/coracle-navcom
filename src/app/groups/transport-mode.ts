import type {GuidedPrivacyLevel} from "src/app/groups/guided-create-options"
import type {GroupTransportModeId} from "src/engine/group-transport-contracts"

type ResolveRequestedTransportModeInput = {
  flow: "create" | "join"
  privacy?: GuidedPrivacyLevel
  invitePreferredMode?: string | null
}

export type ResolveRequestedTransportModeResult = {
  requestedMode: GroupTransportModeId
  source: "invite" | "guided-privacy" | "default"
}

const isSupportedMode = (value: unknown): value is GroupTransportModeId =>
  value === "baseline-nip29" || value === "secure-nip-ee"

const fromPrivacy = (privacy: GuidedPrivacyLevel | undefined): GroupTransportModeId => {
  if (privacy === "secure" || privacy === "max") {
    return "secure-nip-ee"
  }

  return "baseline-nip29"
}

export const resolveRequestedTransportMode = ({
  flow,
  privacy,
  invitePreferredMode,
}: ResolveRequestedTransportModeInput): ResolveRequestedTransportModeResult => {
  if (flow === "join" && isSupportedMode(invitePreferredMode)) {
    return {
      requestedMode: invitePreferredMode,
      source: "invite",
    }
  }

  if (flow === "create" && privacy) {
    return {
      requestedMode: fromPrivacy(privacy),
      source: "guided-privacy",
    }
  }

  return {
    requestedMode: "baseline-nip29",
    source: "default",
  }
}
