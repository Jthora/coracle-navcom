import {parseGroupAddressResult} from "src/domain/group-id"

export type GuidedPrivacyLevel = "standard" | "private" | "fallback-friendly"

export const GUIDED_PRIVACY_OPTIONS: Array<{
  id: GuidedPrivacyLevel
  label: string
  description: string
}> = [
  {
    id: "standard",
    label: "Standard privacy",
    description: "Balanced default for most rooms.",
  },
  {
    id: "private",
    label: "Extra private",
    description: "Prefer stronger protections when supported.",
  },
  {
    id: "fallback-friendly",
    label: "Compatibility first",
    description: "Prioritize broad relay compatibility.",
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
      badge: "Prefer stronger protection",
      hint: "If relay capabilities are limited, we will show compatibility fallback and next steps.",
    }
  }

  if (privacy === "fallback-friendly") {
    return {
      badge: "Prefer compatibility",
      hint: "You can switch to stronger privacy later in room settings when relays support it.",
    }
  }

  return {
    badge: "Balanced default",
    hint: "If security mode changes, check the room status banner for recovery actions.",
  }
}
