import type {PqcKeyPublicationRecord} from "src/engine/pqc/key-publication"
import type {
  PeerCapabilitySnapshot,
  PqcNegotiationOutcome,
  PqcPolicyMode,
} from "src/engine/pqc/negotiation"
import {
  runDmPqcSendPreflight,
  type DmPqcPreflightTelemetryReason,
} from "src/engine/pqc/dm-send-preflight"

export type DmPeerSecurityContext = {
  peerCapabilities?: PeerCapabilitySnapshot | null
  peerKeyRecord?: PqcKeyPublicationRecord | null
  lastValidatedAt?: number
}

export type DmPeerSecurityContextResolver = (
  recipientPubkey: string,
) => DmPeerSecurityContext | null

let dmPeerSecurityContextResolver: DmPeerSecurityContextResolver = () => null

export const setDmPeerSecurityContextResolver = (
  resolver: DmPeerSecurityContextResolver | null,
) => {
  dmPeerSecurityContextResolver = resolver || (() => null)
}

export type DmSendPolicyInput = {
  recipients: string[]
  policyMode: PqcPolicyMode
  preferredHybridAlg: string
  localSupportedAlgs: string[]
  allowClassicalFallback?: boolean
  now?: number
}

export type DmSendPolicyRecipientDecision = {
  recipient: string
  negotiation: PqcNegotiationOutcome
  telemetryReason: DmPqcPreflightTelemetryReason
}

export type DmSendPolicyDecision = {
  allowed: boolean
  mode: "hybrid" | "classical" | "blocked"
  shouldFallback: boolean
  recipientDecisions: DmSendPolicyRecipientDecision[]
  blockReason?: DmPqcPreflightTelemetryReason
}

export const resolveDmSendPolicy = ({
  recipients,
  policyMode,
  preferredHybridAlg,
  localSupportedAlgs,
  allowClassicalFallback = true,
  now,
}: DmSendPolicyInput): DmSendPolicyDecision => {
  const recipientDecisions = recipients.map(recipient => {
    const context = dmPeerSecurityContextResolver(recipient) || {}

    const preflight = runDmPqcSendPreflight({
      policyMode,
      preferredHybridAlg,
      localSupportedAlgs,
      peerCapabilities: context.peerCapabilities,
      peerKeyRecord: context.peerKeyRecord,
      lastValidatedAt: context.lastValidatedAt,
      allowClassicalFallback,
      now,
    })

    return {
      recipient,
      negotiation: preflight.negotiation,
      telemetryReason: preflight.telemetryReason,
    }
  })

  const blocked = recipientDecisions.find(d => d.negotiation.mode === "blocked")

  if (blocked) {
    return {
      allowed: false,
      mode: "blocked",
      shouldFallback: false,
      recipientDecisions,
      blockReason: blocked.telemetryReason,
    }
  }

  const shouldFallback = recipientDecisions.some(d => d.negotiation.mode === "classical")

  return {
    allowed: true,
    mode: shouldFallback ? "classical" : "hybrid",
    shouldFallback,
    recipientDecisions,
  }
}
