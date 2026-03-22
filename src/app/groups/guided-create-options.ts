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
      "Uses NIP-29 by default for widest interoperability and allows runtime fallback behavior.",
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
      "Requests secure-nip-ee. Does not allow capability fallback in guided create/join.",
  },
  {
    id: "max",
    label: "Max (Post Quantum Cryptography)",
    description:
      "Requests secure-nip-ee with Navcom PQC-targeted runtime posture. Does not allow capability fallback in guided create/join.",
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

  // Auto-upgrade ws:// to wss:// for security
  const upgraded = token.startsWith("ws://") ? "wss://" + token.slice(5) : token

  if (upgraded.startsWith("wss://")) {
    try {
      const parsed = new URL(upgraded)

      return `${parsed.protocol}//${parsed.host}`
    } catch {
      return upgraded
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
      hint: "NIP-104+PQC (Navcom terminology) over secure transport. Current request mode is secure-nip-ee; PQC depends on compatible runtime path.",
    }
  }

  if (privacy === "secure") {
    return {
      badge: "Secure (Common Encryption)",
      hint: "secure-nip-ee requested (NIP-EE lane). Guided create/join does not allow capability fallback in this mode.",
    }
  }

  if (privacy === "basic") {
    return {
      badge: "Basic (Open Group)",
      hint: "baseline-nip29 requested (NIP-29). Optimized for open/interoperable group operation.",
    }
  }

  return {
    badge: "Auto (Compatibility First)",
    hint: "baseline-nip29 by default (NIP-29), with capability fallback allowed when secure path is unavailable.",
  }
}

export const getGuidedSecurityTechnicalProfile = (privacy: GuidedPrivacyLevel) => {
  if (privacy === "max") {
    return {
      protocol: "Requested mode: secure-nip-ee (Navcom secure lane).",
      nipLabel: "NIP profile: NIP-EE runtime lane; Navcom labels this as NIP-104+PQC posture.",
      encryption:
        "Group payload path uses wrapped secure sends plus group-epoch envelope (alg: group-epoch-aead-v1).",
      note: "PQC enforcement depends on compatible client/signer/runtime path; not guaranteed by relay advertisement alone.",
    }
  }

  if (privacy === "secure") {
    return {
      protocol: "Requested mode: secure-nip-ee.",
      nipLabel: "NIP profile: NIP-EE runtime lane.",
      encryption:
        "Group payload path uses wrapped secure sends plus group-epoch envelope (alg: group-epoch-aead-v1).",
      note: "Guided create/join does not allow capability fallback in this mode.",
    }
  }

  if (privacy === "basic") {
    return {
      protocol: "Requested mode: baseline-nip29.",
      nipLabel: "NIP profile: NIP-29 group control/events.",
      encryption: "No protocol-enforced end-to-end encryption guarantee at baseline lane.",
      note: "Relay policy may still restrict read/write, but baseline lane is interoperability-first.",
    }
  }

  return {
    protocol: "Requested mode: baseline-nip29 (default).",
    nipLabel: "NIP profile: starts on NIP-29; can fallback/adjust by capability in Auto mode.",
    encryption: "No protocol-enforced end-to-end encryption guarantee at baseline lane.",
    note: "Auto is the only guided mode that allows capability fallback.",
  }
}
