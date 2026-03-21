/**
 * PQ Key Lifecycle — generate, persist, publish, and resolve PQ public keys.
 *
 * - ensureOwnPqcKey: lazily generates + stores + publishes on first DM send
 * - resolvePeerPqPublicKey: queries kind 10051 events for a peer's PQ key
 */

import {pubkey, publishThunk, repository} from "@welshman/app"
import {Router, addMaximalFallbacks} from "@welshman/router"
import {load} from "@welshman/net"
import {makeEvent} from "@welshman/util"
import {get} from "svelte/store"
import {base64ToBytes} from "src/engine/pqc/crypto-provider"
import {
  generatePqcKeyPair,
  validatePqcKeyPublicationRecord,
  selectPreferredActivePqcKey,
  type PqcKeyPublicationRecord,
} from "src/engine/pqc/key-publication"
import {savePqcKeyPair, loadPqcKeyPair} from "src/engine/pqc/pq-key-store"
import {sign} from "src/engine/state"

/** Kind 10051 — replaceable event for PQ key package relay publication */
const PQ_KEY_PACKAGE_RELAYS_KIND = 10051

/**
 * Ensure the current user has a valid PQ keypair. If one exists in
 * localStorage and is still active+fresh, return it. Otherwise generate
 * a new pair, persist it, and publish the public record as kind 10051.
 */
export async function ensureOwnPqcKey(): Promise<{
  record: PqcKeyPublicationRecord
  secretKey: Uint8Array
} | null> {
  const userPub = get(pubkey)
  if (!userPub) return null

  // Check for existing key in store
  const existing = await loadPqcKeyPair(userPub)
  if (existing) {
    const now = Math.floor(Date.now() / 1000)
    if (existing.record.status === "active" && existing.record.expires_at > now) {
      return existing
    }
  }

  // Generate new keypair
  const {record, secretKey} = generatePqcKeyPair({userPubkey: userPub})

  // Persist locally
  await savePqcKeyPair(userPub, record, secretKey)

  // Publish kind 10051 event with "d" tag = key_id for replaceability
  try {
    const template = makeEvent(PQ_KEY_PACKAGE_RELAYS_KIND, {
      content: JSON.stringify(record),
      tags: [
        ["d", record.key_id],
        ["pq_alg", record.pq_alg],
        ["expiration", String(record.expires_at)],
      ],
    })

    const event = await sign(template)
    const relays = Router.get().FromUser().policy(addMaximalFallbacks).getUrls()

    await publishThunk({event, relays})
  } catch (e) {
    // Publication failure is non-fatal — the key is still available locally
    console.warn("Failed to publish PQ public key (kind 10051):", e)
  }

  return {record, secretKey}
}

/**
 * Resolve a peer's PQ public key by querying kind 10051 events.
 * Returns the raw ML-KEM public key bytes or null if unavailable.
 */
export async function resolvePeerPqPublicKey(peerPubkey: string): Promise<Uint8Array | null> {
  // First check the local repository cache
  const cached = findPeerPqKeyInRepository(peerPubkey)
  if (cached) return cached

  // Query relays for kind 10051 from this peer
  try {
    const relays = Router.get().FromPubkeys([peerPubkey]).policy(addMaximalFallbacks).getUrls()

    await load({
      relays,
      filters: [{kinds: [PQ_KEY_PACKAGE_RELAYS_KIND], authors: [peerPubkey]}],
    })

    // After load, check the repository again
    return findPeerPqKeyInRepository(peerPubkey)
  } catch {
    return null
  }
}

/**
 * Look in the local event repository for cached kind 10051 events
 * from a given pubkey. Parse and validate, then select the preferred key.
 */
function findPeerPqKeyInRepository(peerPubkey: string): Uint8Array | null {
  const events = repository.query([{kinds: [PQ_KEY_PACKAGE_RELAYS_KIND], authors: [peerPubkey]}])

  const records: PqcKeyPublicationRecord[] = []

  for (const event of events) {
    try {
      const parsed = JSON.parse(event.content)
      const validation = validatePqcKeyPublicationRecord(parsed, {requireActive: true})
      if (validation.ok) {
        records.push(validation.value)
      }
    } catch {
      // Skip malformed events
    }
  }

  const preferred = selectPreferredActivePqcKey(records)
  if (!preferred) return null

  try {
    return base64ToBytes(preferred.pq_pub)
  } catch {
    return null
  }
}
