/**
 * Revocation checking and caching.
 *
 * Caches revocation status to avoid querying on every message.
 * Periodic refresh ensures timely revocation detection.
 */

import type {TrustedEvent} from "@welshman/util"
import {parseRevocation} from "src/engine/trust/chain"

export interface RevocationEntry {
  eventId: string
  revokedPubkey: string
  revokerPubkey: string
  timestamp: number
}

/** In-memory revocation cache */
const revocationCache = new Map<string, RevocationEntry>()

/** Cache of pubkeys known to be revoked */
const revokedPubkeys = new Set<string>()

/** Last time the cache was refreshed */
let lastRefreshed = 0

/** Cache TTL: 5 minutes */
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Process revocation events and update the cache.
 */
export function ingestRevocations(events: TrustedEvent[]): number {
  let count = 0

  for (const event of events) {
    const rev = parseRevocation(event)
    if (!rev) continue

    if (!revocationCache.has(rev.eventId)) {
      revocationCache.set(rev.eventId, {
        eventId: rev.eventId,
        revokedPubkey: rev.revokedPubkey,
        revokerPubkey: event.pubkey,
        timestamp: event.created_at,
      })
      revokedPubkeys.add(rev.revokedPubkey)
      count++
    }
  }

  lastRefreshed = Date.now()
  return count
}

/**
 * Check if a pubkey has been revoked.
 */
export function isRevoked(pubkey: string): boolean {
  return revokedPubkeys.has(pubkey)
}

/**
 * Check if a specific certificate event has been revoked.
 */
export function isCertificateRevoked(eventId: string): boolean {
  return revocationCache.has(eventId)
}

/**
 * Whether the cache needs refreshing.
 */
export function needsRefresh(): boolean {
  return Date.now() - lastRefreshed > CACHE_TTL_MS
}

/**
 * Get all revocation entries (for trust chain verification).
 */
export function getAllRevocations(): {eventId: string; revokedPubkey: string}[] {
  return Array.from(revocationCache.values()).map(r => ({
    eventId: r.eventId,
    revokedPubkey: r.revokedPubkey,
  }))
}

/**
 * Clear the revocation cache (for testing).
 */
export function clearRevocationCache(): void {
  revocationCache.clear()
  revokedPubkeys.clear()
  lastRefreshed = 0
}

/**
 * Get cache stats for diagnostics.
 */
export function getRevocationCacheStats(): {
  entries: number
  revokedPubkeys: number
  lastRefreshed: number
} {
  return {
    entries: revocationCache.size,
    revokedPubkeys: revokedPubkeys.size,
    lastRefreshed,
  }
}
