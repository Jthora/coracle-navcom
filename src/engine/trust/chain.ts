/**
 * Chain of Trust — Certificate verification and trust chain walking.
 *
 * Verifies the chain: Operator Root → Admin Delegation → User Membership
 * using kind 30078 (NIP-33 parameterized replaceable) events.
 */

import type {TrustedEvent} from "@welshman/util"

/** Trust level for a verified identity */
export type TrustLevel = "operator" | "admin" | "member" | "unknown"

/** Result of verifying a pubkey's trust chain */
export interface TrustChainResult {
  level: TrustLevel
  chain: TrustChainLink[]
  valid: boolean
  reason?: string
}

/** One link in a trust chain */
export interface TrustChainLink {
  pubkey: string
  role: TrustLevel
  delegatedBy?: string
  certEventId?: string
  validUntil?: number
}

/** Delegation certificate extracted from a kind 30078 event */
export interface DelegationCertificate {
  eventId: string
  delegatorPubkey: string
  delegatePubkey: string
  permissions: string[]
  validUntil: number
  revoked: boolean
}

/** The operator root pubkey from build config */
export function getOperatorRootPubkey(): string | null {
  try {
    return (import.meta as any).env?.VITE_OPERATOR_ROOT_PUBKEY || null
  } catch {
    return null
  }
}

/** Check if an operator root pubkey is configured */
export function hasOperatorRoot(): boolean {
  const pk = getOperatorRootPubkey()
  return !!pk && pk.length === 64
}

/**
 * Parse a kind 30078 event into a DelegationCertificate.
 * Returns null if the event is not a valid delegation certificate.
 */
export function parseDelegationCertificate(event: TrustedEvent): DelegationCertificate | null {
  if (event.kind !== 30078) return null

  const dTag = event.tags.find(t => t[0] === "d")
  if (dTag?.[1] !== "delegation") return null

  const pTag = event.tags.find(t => t[0] === "p")
  if (!pTag?.[1]) return null

  const permsTag = event.tags.find(t => t[0] === "permissions")
  const permissions =
    permsTag?.[1]
      ?.split(",")
      .map(s => s.trim())
      .filter(Boolean) ?? []

  const validUntilTag = event.tags.find(t => t[0] === "valid-until")
  const validUntil = validUntilTag ? parseInt(validUntilTag[1], 10) : Infinity

  return {
    eventId: event.id,
    delegatorPubkey: event.pubkey,
    delegatePubkey: pTag[1],
    permissions,
    validUntil: isNaN(validUntil) ? Infinity : validUntil,
    revoked: false,
  }
}

/**
 * Parse a kind 30078 revocation event.
 * Returns the revoked event ID and pubkey, or null.
 */
export function parseRevocation(
  event: TrustedEvent,
): {eventId: string; revokedPubkey: string} | null {
  if (event.kind !== 30078) return null

  const dTag = event.tags.find(t => t[0] === "d")
  if (dTag?.[1] !== "revocation") return null

  const eTag = event.tags.find(t => t[0] === "e")
  const pTag = event.tags.find(t => t[0] === "p")
  if (!eTag?.[1] || !pTag?.[1]) return null

  return {eventId: eTag[1], revokedPubkey: pTag[1]}
}

/**
 * Verify a trust chain for a given pubkey.
 *
 * @param pubkey The pubkey to verify
 * @param delegations All known delegation certificates (kind 30078 d=delegation)
 * @param revocations All known revocation events (kind 30078 d=revocation)
 * @param rootOverride Optional operator root pubkey override (for testing)
 * @returns TrustChainResult with the verified chain
 */
export function verifyTrustChain(
  pubkey: string,
  delegations: DelegationCertificate[],
  revocations: {eventId: string; revokedPubkey: string}[],
  rootOverride?: string,
): TrustChainResult {
  const rootPubkey = rootOverride ?? getOperatorRootPubkey()
  if (!rootPubkey) {
    return {level: "unknown", chain: [], valid: false, reason: "No operator root configured"}
  }

  // Build revocation set for fast lookup
  const revokedEventIds = new Set(revocations.map(r => r.eventId))
  const revokedPubkeys = new Set(revocations.map(r => r.revokedPubkey))

  // Is the pubkey the operator root itself?
  if (pubkey === rootPubkey) {
    return {
      level: "operator",
      chain: [{pubkey, role: "operator"}],
      valid: true,
    }
  }

  // Check if pubkey is revoked
  if (revokedPubkeys.has(pubkey)) {
    return {level: "unknown", chain: [], valid: false, reason: "Identity revoked"}
  }

  const now = Math.floor(Date.now() / 1000)

  // Look for a delegation from the operator root to this pubkey
  const directDelegation = delegations.find(
    d =>
      d.delegatorPubkey === rootPubkey &&
      d.delegatePubkey === pubkey &&
      !revokedEventIds.has(d.eventId) &&
      d.validUntil > now,
  )

  if (directDelegation) {
    return {
      level: "admin",
      chain: [
        {pubkey: rootPubkey, role: "operator"},
        {
          pubkey,
          role: "admin",
          delegatedBy: rootPubkey,
          certEventId: directDelegation.eventId,
          validUntil: directDelegation.validUntil,
        },
      ],
      valid: true,
    }
  }

  // Look for a two-hop chain: operator → admin → member
  for (const adminDelegation of delegations) {
    if (adminDelegation.delegatorPubkey !== rootPubkey) continue
    if (revokedEventIds.has(adminDelegation.eventId)) continue
    if (adminDelegation.validUntil <= now) continue

    const adminPubkey = adminDelegation.delegatePubkey
    if (revokedPubkeys.has(adminPubkey)) continue

    // Check if this admin has delegated to our target pubkey
    const memberDelegation = delegations.find(
      d =>
        d.delegatorPubkey === adminPubkey &&
        d.delegatePubkey === pubkey &&
        !revokedEventIds.has(d.eventId) &&
        d.validUntil > now,
    )

    if (memberDelegation) {
      return {
        level: "member",
        chain: [
          {pubkey: rootPubkey, role: "operator"},
          {
            pubkey: adminPubkey,
            role: "admin",
            delegatedBy: rootPubkey,
            certEventId: adminDelegation.eventId,
            validUntil: adminDelegation.validUntil,
          },
          {
            pubkey,
            role: "member",
            delegatedBy: adminPubkey,
            certEventId: memberDelegation.eventId,
            validUntil: memberDelegation.validUntil,
          },
        ],
        valid: true,
      }
    }
  }

  return {level: "unknown", chain: [], valid: false, reason: "No valid trust chain found"}
}
