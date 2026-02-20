import {
  DEFAULT_PQC_KEY_STALE_AFTER_SECONDS,
  getPqcKeyFreshnessState,
  type PqcKeyPublicationRecord,
} from "src/engine/pqc/key-publication"
import {
  negotiatePqcMode,
  type PeerCapabilitySnapshot,
  type PqcNegotiationOutcome,
  type PqcPolicyMode,
} from "src/engine/pqc/negotiation"

export type DmPqcPreflightTelemetryReason =
  | "DM_PREFLIGHT_OK"
  | "DM_KEY_UNAVAILABLE"
  | "DM_KEY_STALE"
  | "DM_KEY_EXPIRED"
  | "DM_NEGOTIATION_FAILED"
  | "DM_POLICY_BLOCKED"

export type DmPqcSendPreflightInput = {
  policyMode: PqcPolicyMode
  preferredHybridAlg: string
  localSupportedAlgs: string[]
  peerCapabilities?: PeerCapabilitySnapshot | null
  peerKeyRecord?: PqcKeyPublicationRecord | null
  now?: number
  lastValidatedAt?: number
  staleAfterSeconds?: number
  allowClassicalFallback?: boolean
}

export type DmPqcSendPreflightResult = {
  keyFreshness: "fresh" | "stale" | "expired" | "missing"
  shouldRefreshKey: boolean
  negotiation: PqcNegotiationOutcome
  blocked: boolean
  telemetryReason: DmPqcPreflightTelemetryReason
}

const getTelemetryReason = ({
  keyFreshness,
  negotiation,
}: {
  keyFreshness: DmPqcSendPreflightResult["keyFreshness"]
  negotiation: PqcNegotiationOutcome
}): DmPqcPreflightTelemetryReason => {
  if (keyFreshness === "missing") return "DM_KEY_UNAVAILABLE"
  if (keyFreshness === "expired") return "DM_KEY_EXPIRED"
  if (keyFreshness === "stale") return "DM_KEY_STALE"
  if (!negotiation.ok && negotiation.mode === "blocked") {
    return negotiation.reason === "NEGOTIATION_POLICY_BLOCKED"
      ? "DM_POLICY_BLOCKED"
      : "DM_NEGOTIATION_FAILED"
  }

  return "DM_PREFLIGHT_OK"
}

export const runDmPqcSendPreflight = ({
  policyMode,
  preferredHybridAlg,
  localSupportedAlgs,
  peerCapabilities,
  peerKeyRecord,
  now = Math.floor(Date.now() / 1000),
  lastValidatedAt,
  staleAfterSeconds = DEFAULT_PQC_KEY_STALE_AFTER_SECONDS,
  allowClassicalFallback = true,
}: DmPqcSendPreflightInput): DmPqcSendPreflightResult => {
  const keyFreshness = peerKeyRecord
    ? getPqcKeyFreshnessState(peerKeyRecord, {now, lastValidatedAt, staleAfterSeconds})
    : "missing"

  const hasValidPeerPqKey = keyFreshness === "fresh"

  const negotiation = negotiatePqcMode({
    policyMode,
    preferredHybridAlg,
    localSupportedAlgs,
    peerCapabilities,
    hasValidPeerPqKey,
    allowClassicalFallback,
  })

  const shouldRefreshKey = keyFreshness === "stale" || keyFreshness === "missing"

  return {
    keyFreshness,
    shouldRefreshKey,
    negotiation,
    blocked: !negotiation.ok,
    telemetryReason: getTelemetryReason({keyFreshness, negotiation}),
  }
}
