import type {TrustedEvent} from "@welshman/util"
import {recordPqcDmFallback} from "src/engine/pqc/dm-fallback-history"
import {resolveDmReceiveContent} from "src/engine/pqc/dm-receive-envelope"

export const resolveMessagePlaintext = ({
  event,
  decryptedContent,
  policyMode,
  allowLegacyFallback,
  enableFallbackHistory,
  localPubkey,
}: {
  event: TrustedEvent
  decryptedContent: string
  policyMode: "strict" | "compatibility"
  allowLegacyFallback: boolean
  enableFallbackHistory?: boolean
  localPubkey?: string
}) => {
  const expectedRecipientPubkey = event.tags.find(tag => tag[0] === "p")?.[1]

  const resolved = resolveDmReceiveContent({
    tags: event.tags,
    decryptedContent,
    policyMode,
    allowLegacyFallback,
    expectedSenderPubkey: event.pubkey,
    expectedRecipientPubkey,
  })

  if (resolved.reason && resolved.reason !== "DM_ENVELOPE_PARSE_OK") {
    console.debug("[pqc-dm-receive] envelope parse diagnostic", {
      id: event.id,
      reason: resolved.reason,
      fallback: resolved.usedLegacyFallback,
    })

    if (resolved.usedLegacyFallback && enableFallbackHistory) {
      const peerPubkey =
        localPubkey && event.pubkey === localPubkey ? expectedRecipientPubkey : event.pubkey

      recordPqcDmFallback({
        direction: "receive",
        mode: "legacy-fallback",
        reason: resolved.reason,
        timestamp: event.created_at,
        messageId: event.id,
        peerPubkey,
      })
    }
  }

  return resolved.content
}
