import {parseGroupAddressResult} from "src/domain/group-id"

export type GuidedPrivacyLevel = "standard" | "private" | "fallback-friendly"
export type GuidedRelayPreset = "navcom" | "public" | "custom"

export const GUIDED_RELAY_PRESET_OPTIONS: Array<{
  id: GuidedRelayPreset
  label: string
  description: string
}> = [
  {
    id: "navcom",
    label: "Navcom Relays",
    description: "Use Navcom/default relay set for group setup.",
  },
  {
    id: "public",
    label: "Public Relays",
    description: "Use broad public relay set.",
  },
  {
    id: "custom",
    label: "Custom Relays",
    description: "Manually enter relay addresses.",
  },
]

export const GUIDED_PRIVACY_OPTIONS: Array<{
  id: GuidedPrivacyLevel
  label: string
  description: string
}> = [
  {
    id: "standard",
    label: "Balanced security (recommended)",
    description:
      "Security: Medium. Trade-off: balanced reliability and stronger transport when available. Encryption: compatibility transport by default, auto-upgrades to secure transport when available. PQC: opportunistic.",
  },
  {
    id: "private",
    label: "Higher security (PQC preferred)",
    description:
      "Security: Higher. Trade-off: stronger transport preference with possible fallback on unsupported relays. Encryption: secure transport preferred with compatibility fallback. PQC: yes, preferred when available.",
  },
  {
    id: "fallback-friendly",
    label: "Maximum compatibility (lowest security)",
    description:
      "Security: Lower. Trade-off: highest relay/device compatibility over stronger transport. Encryption: compatibility transport path. PQC: no by default.",
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

const toRelayAddress = (value: string) => {
  const token = (value || "").trim().toLowerCase().replace(/\/+$/g, "")

  if (!token) return ""

  if (token.startsWith("wss://") || token.startsWith("ws://")) {
    try {
      const parsed = new URL(token)

      return `${parsed.protocol}//${parsed.host}`
    } catch {
      return token
    }
  }

  return `wss://${token}`
}

export const parseSelectedRelays = (value: string) => {
  const tokens = (value || "")
    .split(/[\n,\s]+/)
    .map(token => toRelayAddress(token))
    .filter(Boolean)

  return Array.from(new Set(tokens))
}

export const formatSelectedRelays = (relays: string[]) => relays.join("\n")

export const getPrimaryRelayHostFromSelectedRelays = (value: string) => {
  const firstRelay = parseSelectedRelays(value)[0] || ""

  if (!firstRelay) return ""

  try {
    return new URL(firstRelay).host.toLowerCase()
  } catch {
    return firstRelay.replace(/^wss?:\/\//, "").toLowerCase()
  }
}

export const getRelayPresetValues = ({
  preset,
  recommendedRelayHost,
  defaultRelays = [],
  indexerRelays = [],
}: {
  preset: GuidedRelayPreset
  recommendedRelayHost: string
  defaultRelays?: string[]
  indexerRelays?: string[]
}) => {
  if (preset === "custom") {
    return []
  }

  const recommended = toRelayAddress(recommendedRelayHost)
  const navcom = parseSelectedRelays([recommended, ...defaultRelays].join("\n")).slice(0, 8)
  const publicPreset = parseSelectedRelays(indexerRelays.join("\n")).slice(0, 8)

  return preset === "public" ? publicPreset : navcom
}

export const getGuidedSecurityStatus = (privacy: GuidedPrivacyLevel) => {
  if (privacy === "private") {
    return {
      badge: "Higher security (PQC preferred)",
      hint: "Uses secure transport first and prefers PQC-capable path when available. Trade-off: may fall back to compatibility on unsupported relays.",
    }
  }

  if (privacy === "fallback-friendly") {
    return {
      badge: "Maximum compatibility",
      hint: "Uses compatibility transport for widest support. Trade-off: lower security than PQC-preferred mode.",
    }
  }

  return {
    badge: "Balanced security",
    hint: "Starts in compatibility transport and upgrades to secure transport when available. Trade-off: balanced reliability and security.",
  }
}
