import {parseGroupAddressResult} from "src/domain/group-id"

export type GuidedPrivacyLevel = "auto" | "basic" | "secure" | "max"
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
    id: "auto",
    label: "Auto (Compatibility First)",
    description:
      "Uses baseline lane by default (NIP-29) for widest interoperability. May move to secure-capable behavior based on runtime compatibility.",
  },
  {
    id: "basic",
    label: "Basic (Open Group)",
    description:
      "Uses baseline lane (NIP-29) for open/interoperable group operations. Group privacy depends on relay policy and message path, not this label alone.",
  },
  {
    id: "secure",
    label: "Secure (Common Encryption)",
    description:
      "Requests secure lane (secure-nip-ee) with compatibility fallback as needed. Intended for common encrypted group messaging paths.",
  },
  {
    id: "max",
    label: "Max (Post Quantum Cryptography)",
    description:
      "Requests secure lane and targets Navcom PQC path (NIP-104+PQC label in Navcom context). PQC depends on compatible client/signer/runtime; not all relays advertise this explicitly.",
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
  if (privacy === "max") {
    return {
      badge: "Max (Post Quantum Cryptography)",
      hint: "Lane target: NIP-104+PQC (Navcom terminology) over secure transport. Current request mode is secure-nip-ee; PQC depends on compatible runtime path.",
    }
  }

  if (privacy === "secure") {
    return {
      badge: "Secure (Common Encryption)",
      hint: "Lane target: secure-nip-ee (NIP-EE lane). Falls back to NIP-29 baseline when secure path is unavailable.",
    }
  }

  if (privacy === "basic") {
    return {
      badge: "Basic (Open Group)",
      hint: "Lane target: baseline-nip29 (NIP-29). Optimized for open/interoperable group operation.",
    }
  }

  return {
    badge: "Auto (Compatibility First)",
    hint: "Lane target: baseline-nip29 (NIP-29) by default; may use secure-compatible path when available.",
  }
}
