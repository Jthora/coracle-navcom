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
    label: "Medium (Auto)",
    description:
      "Requests baseline transport (baseline-nip29). Best default for mixed relays. Works with widest compatibility while still allowing secure-aware clients and relay checks.",
  },
  {
    id: "private",
    label: "High (Secure-first)",
    description:
      "Requests secure transport (secure-nip-ee) first. If secure path is unavailable, flow may fall back to baseline depending on capability/policy. Use when stronger transport is required.",
  },
  {
    id: "fallback-friendly",
    label: "Low (Compatibility-first)",
    description:
      "Requests baseline transport and prioritizes interoperability wording for legacy/public relays. Today this is operationally the same transport request as Medium during create/join.",
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
      badge: "High (Secure-first)",
      hint: "Secure transport is requested first (secure-nip-ee). If the secure lane is unavailable, fallback to baseline can occur based on runtime capability and policy.",
    }
  }

  if (privacy === "fallback-friendly") {
    return {
      badge: "Low (Compatibility-first)",
      hint: "Baseline transport (baseline-nip29) with compatibility-first posture for mixed/legacy relays. Same transport request as Medium in current create/join flow.",
    }
  }

  return {
    badge: "Medium (Auto)",
    hint: "Baseline transport (baseline-nip29) optimized for reliability across public/mixed relays while retaining secure capability signaling and checks.",
  }
}
