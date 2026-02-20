export type PqcPolicyMode = "strict" | "compatibility"

export type PqcNegotiationReasonCode =
  | "NEGOTIATION_OK_HYBRID"
  | "NEGOTIATION_FALLBACK_CLASSICAL"
  | "NEGOTIATION_NO_CAPS"
  | "NEGOTIATION_STALE_CAPS"
  | "NEGOTIATION_NO_SHARED_ALG"
  | "NEGOTIATION_MISSING_KEY"
  | "NEGOTIATION_POLICY_BLOCKED"

export type PqcNegotiationOutcome = {
  ok: boolean
  mode: "hybrid" | "classical" | "blocked"
  alg?: string
  reason: PqcNegotiationReasonCode
}

export type PeerCapabilitySnapshot = {
  modes: string[]
  algs: string[]
  stale?: boolean
}

export type PqcNegotiationInput = {
  policyMode: PqcPolicyMode
  preferredHybridAlg: string
  localSupportedAlgs: string[]
  peerCapabilities?: PeerCapabilitySnapshot | null
  hasValidPeerPqKey: boolean
  allowClassicalFallback?: boolean
}

const hasMode = (caps: PeerCapabilitySnapshot | null | undefined, mode: string) =>
  Boolean(caps && Array.isArray(caps.modes) && caps.modes.includes(mode))

const sharedHybridAlg = (
  preferredHybridAlg: string,
  localSupportedAlgs: string[],
  peerCapabilities?: PeerCapabilitySnapshot | null,
) => {
  if (!peerCapabilities) return null
  if (!peerCapabilities.algs.includes(preferredHybridAlg)) return null
  if (!localSupportedAlgs.includes(preferredHybridAlg)) return null

  return preferredHybridAlg
}

const blocked = (reason: PqcNegotiationReasonCode): PqcNegotiationOutcome => ({
  ok: false,
  mode: "blocked",
  reason,
})

const classicalFallback = (): PqcNegotiationOutcome => ({
  ok: true,
  mode: "classical",
  reason: "NEGOTIATION_FALLBACK_CLASSICAL",
})

export const negotiatePqcMode = ({
  policyMode,
  preferredHybridAlg,
  localSupportedAlgs,
  peerCapabilities,
  hasValidPeerPqKey,
  allowClassicalFallback = true,
}: PqcNegotiationInput): PqcNegotiationOutcome => {
  const canFallback = policyMode === "compatibility" && allowClassicalFallback

  if (!peerCapabilities) {
    return canFallback ? classicalFallback() : blocked("NEGOTIATION_NO_CAPS")
  }

  if (peerCapabilities.stale) {
    return canFallback ? classicalFallback() : blocked("NEGOTIATION_STALE_CAPS")
  }

  const sharedAlg = sharedHybridAlg(preferredHybridAlg, localSupportedAlgs, peerCapabilities)

  if (!hasMode(peerCapabilities, "hybrid") || !sharedAlg) {
    return canFallback ? classicalFallback() : blocked("NEGOTIATION_NO_SHARED_ALG")
  }

  if (!hasValidPeerPqKey) {
    return canFallback ? classicalFallback() : blocked("NEGOTIATION_MISSING_KEY")
  }

  return {
    ok: true,
    mode: "hybrid",
    alg: sharedAlg,
    reason: "NEGOTIATION_OK_HYBRID",
  }
}
