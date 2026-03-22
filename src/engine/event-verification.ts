/**
 * Event signature verification for security-critical event kinds.
 *
 * Welshman's pool layer does NOT verify event signatures by default —
 * it assigns the `TrustedEvent` type based on structure, not cryptographic
 * proof. This module provides verification at NavCom's ingestion boundary.
 *
 * Strategy: Verify ALL events, but only reject security-critical ones on
 * failure. Non-critical events with bad signatures are logged but accepted
 * (to avoid breaking feed display for edge-case relay behavior).
 */

import {verifyEvent} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"

/** Event kinds where signature verification failure = silent reject. */
const CRITICAL_KINDS = new Set([
  0, // profile metadata
  3, // contact list
  4, // encrypted DM (NIP-04)
  10002, // relay list (NIP-65)
  27, // group admin
  1059, // gift-wrapped DM (NIP-59)
  30078, // application-specific data (key material)
])

let verifiedCount = 0
let rejectedCount = 0

/**
 * Verify event signature. Returns true if the event is valid or
 * non-critical (accepted despite bad sig). Returns false if the
 * event is critical and fails verification (should be dropped).
 */
export function verifyEventSignature(event: TrustedEvent): boolean {
  // Events without signatures cannot be verified — accept non-critical, reject critical
  if (!event.sig) {
    if (CRITICAL_KINDS.has(event.kind)) {
      rejectedCount++
      logRejection(event, "missing-signature")
      return false
    }
    return true
  }

  const valid = verifyEvent(event)

  if (valid) {
    verifiedCount++
    return true
  }

  // Invalid signature
  if (CRITICAL_KINDS.has(event.kind)) {
    rejectedCount++
    logRejection(event, "invalid-signature")
    return false
  }

  // Non-critical: log but accept
  console.warn(
    `[SigVerify] Non-critical event ${event.id?.slice(0, 8)}… (kind ${event.kind}) has invalid signature — accepted`,
  )
  return true
}

function logRejection(event: TrustedEvent, reason: string): void {
  console.warn(
    `[SecurityAudit] Event signature rejected [${reason}]: kind=${event.kind} id=${event.id?.slice(0, 8)}… pubkey=${event.pubkey?.slice(0, 8)}…`,
  )
}

/** Get verification statistics for monitoring. */
export function getVerificationStats(): {verified: number; rejected: number} {
  return {verified: verifiedCount, rejected: rejectedCount}
}

/** Reset counters (useful for testing). */
export function resetVerificationStats(): void {
  verifiedCount = 0
  rejectedCount = 0
}
