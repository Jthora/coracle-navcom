import {uniq} from "@welshman/lib"
import type {GroupProjection} from "src/domain/group"

export type SecureWrapRecipientResolution = {
  eligibleRecipients: string[]
  excludedRecipients: string[]
}

const encodeWrapReference = ({
  groupId,
  epochId,
  recipient,
}: {
  groupId: string
  epochId: string
  recipient: string
}) => {
  const value = `${groupId}:${epochId}:${recipient}`

  if (typeof btoa === "function") {
    return btoa(value)
  }

  return Buffer.from(value, "utf8").toString("base64")
}

const asSortedUnique = (pubkeys: string[]) => uniq(pubkeys.filter(Boolean)).sort()

export const resolveEligibleSecureWrapRecipients = ({
  recipients,
  senderPubkey,
  projection,
}: {
  recipients: string[]
  senderPubkey: string
  projection?: GroupProjection | null
}): SecureWrapRecipientResolution => {
  const candidates = asSortedUnique(recipients)

  if (!projection) {
    return {
      eligibleRecipients: asSortedUnique(candidates.concat(senderPubkey)),
      excludedRecipients: [],
    }
  }

  const excluded = new Set<string>()
  const eligible = new Set<string>()

  for (const recipient of candidates) {
    const membership = projection.members[recipient]

    if (!membership || membership.status === "active") {
      eligible.add(recipient)
      continue
    }

    excluded.add(recipient)
  }

  eligible.add(senderPubkey)

  return {
    eligibleRecipients: asSortedUnique(Array.from(eligible)),
    excludedRecipients: asSortedUnique(Array.from(excluded)),
  }
}

export const buildSecureGroupWrapTags = ({
  groupId,
  epochId,
  recipients,
  senderPubkey,
}: {
  groupId: string
  epochId: string
  recipients: string[]
  senderPubkey: string
}) =>
  recipients
    .filter(recipient => recipient !== senderPubkey)
    .flatMap(recipient => [
      ["p", recipient],
      [
        "wrap",
        recipient,
        encodeWrapReference({
          groupId,
          epochId,
          recipient,
        }),
      ],
    ])
