/**
 * Delegation certificate creation and verification.
 *
 * Creates kind 30078 (NIP-33) parameterized replaceable events
 * for operator → admin and admin → member delegations.
 */

import type {TrustedEvent} from "@welshman/util"

/** Permission types for delegation certificates */
export type DelegationPermission =
  | "group-admin"
  | "user-invite"
  | "group-create"
  | "member-revoke"
  | "full-admin"

/**
 * Build a delegation certificate event template (kind 30078).
 * The caller must sign this with the delegator's key.
 */
export function buildDelegationEvent(
  delegatePubkey: string,
  permissions: DelegationPermission[],
  validUntilSeconds: number,
): {kind: number; content: string; tags: string[][]; created_at: number} {
  const now = Math.floor(Date.now() / 1000)

  return {
    kind: 30078,
    content: "",
    created_at: now,
    tags: [
      ["d", "delegation"],
      ["p", delegatePubkey],
      ["permissions", permissions.join(",")],
      ["valid-until", String(validUntilSeconds)],
    ],
  }
}

/**
 * Build a revocation event template (kind 30078).
 * The caller must sign this with the revoking authority's key.
 */
export function buildRevocationEvent(
  certificateEventId: string,
  revokedPubkey: string,
): {kind: number; content: string; tags: string[][]; created_at: number} {
  const now = Math.floor(Date.now() / 1000)

  return {
    kind: 30078,
    content: "",
    created_at: now,
    tags: [
      ["d", "revocation"],
      ["e", certificateEventId],
      ["p", revokedPubkey],
    ],
  }
}

/**
 * Validate a delegation certificate event.
 * Checks required tags and time bounds.
 */
export function validateDelegationEvent(event: TrustedEvent): {valid: boolean; error?: string} {
  if (event.kind !== 30078) {
    return {valid: false, error: "Not a kind 30078 event"}
  }

  const dTag = event.tags.find(t => t[0] === "d")
  if (!dTag || dTag[1] !== "delegation") {
    return {valid: false, error: 'Missing or incorrect "d" tag'}
  }

  const pTag = event.tags.find(t => t[0] === "p")
  if (!pTag || !pTag[1] || pTag[1].length !== 64) {
    return {valid: false, error: "Missing or invalid delegate pubkey"}
  }

  const validUntilTag = event.tags.find(t => t[0] === "valid-until")
  if (validUntilTag) {
    const ts = parseInt(validUntilTag[1], 10)
    if (isNaN(ts)) {
      return {valid: false, error: "Invalid valid-until timestamp"}
    }
    const now = Math.floor(Date.now() / 1000)
    if (ts <= now) {
      return {valid: false, error: "Delegation has expired"}
    }
  }

  return {valid: true}
}

/**
 * Check if a delegation grants a specific permission.
 */
export function hasPermission(permissions: string[], required: DelegationPermission): boolean {
  return permissions.includes("full-admin") || permissions.includes(required)
}
