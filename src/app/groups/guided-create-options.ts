import {parseGroupAddressResult} from "src/domain/group-id"

export type GuidedPrivacyLevel = "standard" | "private" | "fallback-friendly"

export const GUIDED_PRIVACY_OPTIONS: Array<{
  id: GuidedPrivacyLevel
  label: string
  description: string
}> = [
  {
    id: "standard",
    label: "Standard (balanced)",
    description: "Balanced default. Uses compatibility mode unless secure relays are available.",
  },
  {
    id: "private",
    label: "PQC-preferred",
    description: "Prefer post-quantum-capable secure transport when relays support it.",
  },
  {
    id: "fallback-friendly",
    label: "Compatibility first",
    description: "Prioritize widest compatibility over PQC-preferred transport.",
  },
]

export const getRecommendedRelayHost = (groupId = "") => {
  const parsed = parseGroupAddressResult(groupId)

  if (parsed.ok && parsed.value.relayHost) {
    return parsed.value.relayHost
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname?.toLowerCase()

    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return host
    }
  }

  return "relay.example"
}

export const getGuidedSecurityStatus = (privacy: GuidedPrivacyLevel) => {
  if (privacy === "private") {
    return {
      badge: "PQC-preferred",
      hint: "Attempts secure post-quantum-capable transport first. If unavailable, compatibility fallback is shown.",
    }
  }

  if (privacy === "fallback-friendly") {
    return {
      badge: "Prefer compatibility",
      hint: "Uses compatibility mode for broader relay support. You can switch to PQC-preferred later.",
    }
  }

  return {
    badge: "Balanced default",
    hint: "Starts balanced between compatibility and stronger transport. Runtime state is shown in the room banner.",
  }
}
