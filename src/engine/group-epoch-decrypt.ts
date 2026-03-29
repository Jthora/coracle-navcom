import {GROUP_KINDS} from "src/domain/group-kinds"
import {decodeSecureGroupEpochContent} from "src/engine/group-epoch-content"

export type SecureGroupEpochDecryptResult =
  | {ok: true; plaintext?: string}
  | {
      ok: false
      reason: "GROUP_EPOCH_CONTENT_PARSE_FAILED" | "GROUP_EPOCH_CONTENT_EPOCH_MISMATCH"
      eventId: string
    }

export const validateAndDecryptSecureGroupEventContent = async ({
  event,
  expectedEpochId,
  epochKeyBytes,
}: {
  event: {id: string; kind: number; content: string}
  expectedEpochId: string
  epochKeyBytes: Uint8Array
}): Promise<SecureGroupEpochDecryptResult> => {
  if (event.kind !== GROUP_KINDS.NIP_EE.GROUP_EVENT) {
    return {ok: true}
  }

  const decoded = await decodeSecureGroupEpochContent(event.content, epochKeyBytes)

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
