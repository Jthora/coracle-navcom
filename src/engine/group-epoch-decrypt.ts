import {GROUP_KINDS} from "src/domain/group-kinds"
import {decodeSecureGroupEpochContent} from "src/engine/group-epoch-content"

export type SecureGroupEpochDecryptResult =
  | {ok: true; plaintext?: string}
  | {
      ok: false
      reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED" | "GROUP_EPOCH_CONTENT_EPOCH_MISMATCH"
      eventId: string
    }

export const validateAndDecryptSecureGroupEventContent = ({
  event,
  expectedEpochId,
}: {
  event: {id: string; kind: number; content: string}
  expectedEpochId: string
}): SecureGroupEpochDecryptResult => {
  if (event.kind !== GROUP_KINDS.NIP_EE.GROUP_EVENT) {
    return {ok: true}
  }

  const decoded = decodeSecureGroupEpochContent(event.content)

  if (!decoded.ok) {
    return {
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED",
      eventId: event.id,
    }
  }

  if (decoded.envelope.epoch_id !== expectedEpochId) {
    return {
      ok: false,
      reason: "GROUP_EPOCH_CONTENT_EPOCH_MISMATCH",
      eventId: event.id,
    }
  }

  return {
    ok: true,
    plaintext: decoded.plaintext,
  }
}
