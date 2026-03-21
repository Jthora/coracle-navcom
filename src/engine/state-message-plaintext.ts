import type {TrustedEvent} from "@welshman/util"
import {recordPqcDmFallback} from "src/engine/pqc/dm-fallback-history"
import {resolveDmReceiveContent} from "src/engine/pqc/dm-receive-envelope"

const normalizePubkey = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : ""

export const deriveExpectedRecipientPubkeys = ({
  tags,
  localPubkey,
}: {
  tags: string[][]
  localPubkey?: string
}) => {
  const recipients = Array.from(
    new Set(
      tags
        .filter(tag => tag[0] === "p")
        .map(tag => normalizePubkey(tag[1]))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right))

  const normalizedLocal = normalizePubkey(localPubkey)

  if (normalizedLocal && recipients.includes(normalizedLocal)) {
    return [normalizedLocal, ...recipients.filter(pubkey => pubkey !== normalizedLocal)]
  }

  return recipients
}

export const resolveMessagePlaintext = async ({
  event,
  decryptedContent,
  policyMode,
  allowLegacyFallback,
  enableFallbackHistory,
  localPubkey,
  recipientSecretKey,
  recipientPubkey,
  senderPubkey,
}: {
  event: TrustedEvent
  decryptedContent: string
  policyMode: "strict" | "compatibility"
  allowLegacyFallback: boolean
  enableFallbackHistory?: boolean
  localPubkey?: string
  recipientSecretKey?: Uint8Array
  recipientPubkey?: string
  senderPubkey?: string
}) => {
  const expectedRecipientPubkeys = deriveExpectedRecipientPubkeys({
    tags: event.tags,
    localPubkey,
  })
  const expectedRecipientPubkey = expectedRecipientPubkeys[0]

  const resolved = await resolveDmReceiveContent({
    tags: event.tags,
    decryptedContent,
    policyMode,
    allowLegacyFallback,
    recipientSecretKey: recipientSecretKey || new Uint8Array(0),
    recipientPubkey: recipientPubkey || "",
    senderPubkey: senderPubkey || "",
    expectedSenderPubkey: normalizePubkey(event.pubkey),
    expectedRecipientPubkey,
    expectedRecipientPubkeys,
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
