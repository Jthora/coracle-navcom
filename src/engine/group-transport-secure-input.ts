import {GROUP_KINDS} from "src/domain/group-kinds"
import type {GroupMissionTier} from "src/engine/group-tier-policy"
import {isHex} from "src/util/nostr"

export type SecureGroupSendInput = {
  groupId: string
  content: string
  recipients: string[]
  delay?: number
  localState?: unknown
  missionTier?: GroupMissionTier
  actorRole?: string
  requestedMode?: string
  resolvedMode?: string
  downgradeConfirmed?: boolean
  allowTier2Override?: boolean
  epochKeyBytes?: Uint8Array
  extraTags?: string[][]
}

export type SecureGroupSubscribeInput = {
  groupId: string
  cursor?: string | number
  relays?: string[]
}

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter(v => typeof v === "string") : []

export const GROUP_SECURE_SEND_INPUT_REASON = {
  INVALID_SHAPE: "GROUP_SECURE_SEND_INVALID_SHAPE",
  GROUP_ID_REQUIRED: "GROUP_SECURE_SEND_GROUP_ID_REQUIRED",
  CONTENT_REQUIRED: "GROUP_SECURE_SEND_CONTENT_REQUIRED",
  RECIPIENTS_REQUIRED: "GROUP_SECURE_SEND_RECIPIENTS_REQUIRED",
  RECIPIENT_PUBKEY_INVALID: "GROUP_SECURE_SEND_RECIPIENT_PUBKEY_INVALID",
} as const

export type GroupSecureSendInputReason =
  (typeof GROUP_SECURE_SEND_INPUT_REASON)[keyof typeof GROUP_SECURE_SEND_INPUT_REASON]

export type ParseSecureGroupSendInputResult =
  | {
      ok: true
      value: SecureGroupSendInput
    }
  | {
      ok: false
      reason: GroupSecureSendInputReason
      message: string
    }

export const parseSecureGroupSendInputResult = (
  input: unknown,
): ParseSecureGroupSendInputResult => {
  if (!input || typeof input !== "object") {
    return {
      ok: false,
      reason: GROUP_SECURE_SEND_INPUT_REASON.INVALID_SHAPE,
      message: "Invalid secure send payload shape.",
    }
  }

  const candidate = input as Record<string, unknown>
  const groupId = typeof candidate.groupId === "string" ? candidate.groupId.trim() : ""
  const content = typeof candidate.content === "string" ? candidate.content.trim() : ""
  const recipients = asStringArray(candidate.recipients)
    .map(recipient => recipient.trim().toLowerCase())
    .filter(Boolean)
  const delay = typeof candidate.delay === "number" ? candidate.delay : 0
  const missionTier =
    candidate.missionTier === 0 || candidate.missionTier === 1 || candidate.missionTier === 2
      ? candidate.missionTier
      : undefined
  const actorRole = typeof candidate.actorRole === "string" ? candidate.actorRole : undefined
  const requestedMode =
    typeof candidate.requestedMode === "string" ? candidate.requestedMode : undefined
  const resolvedMode =
    typeof candidate.resolvedMode === "string" ? candidate.resolvedMode : undefined
  const downgradeConfirmed =
    typeof candidate.downgradeConfirmed === "boolean" ? candidate.downgradeConfirmed : undefined
  const allowTier2Override =
    typeof candidate.allowTier2Override === "boolean" ? candidate.allowTier2Override : undefined

  if (!groupId) {
    return {
      ok: false,
      reason: GROUP_SECURE_SEND_INPUT_REASON.GROUP_ID_REQUIRED,
      message: "Secure send requires a non-empty group ID.",
    }
  }

  if (!content) {
    return {
      ok: false,
      reason: GROUP_SECURE_SEND_INPUT_REASON.CONTENT_REQUIRED,
      message: "Secure send requires non-empty message content.",
    }
  }

  if (recipients.length === 0) {
    return {
      ok: false,
      reason: GROUP_SECURE_SEND_INPUT_REASON.RECIPIENTS_REQUIRED,
      message: "Secure send requires at least one recipient.",
    }
  }

  const invalidRecipient = recipients.find(recipient => !isHex(recipient))

  if (invalidRecipient) {
    return {
      ok: false,
      reason: GROUP_SECURE_SEND_INPUT_REASON.RECIPIENT_PUBKEY_INVALID,
      message: "Secure send recipient pubkeys must be valid 64-character hex strings.",
    }
  }

  const epochKeyBytes =
    candidate.epochKeyBytes instanceof Uint8Array ? candidate.epochKeyBytes : undefined
  const extraTags = Array.isArray(candidate.extraTags)
    ? (candidate.extraTags as string[][])
    : undefined

  return {
    ok: true,
    value: {
      groupId,
      content,
      recipients,
      delay,
      localState: candidate.localState,
      missionTier,
      actorRole,
      requestedMode,
      resolvedMode,
      downgradeConfirmed,
      allowTier2Override,
      epochKeyBytes,
      extraTags,
    },
  }
}

export const parseSecureGroupSendInput = (input: unknown): SecureGroupSendInput | null => {
  const parsed = parseSecureGroupSendInputResult(input)

  return parsed.ok ? parsed.value : null
}

export const parseSecureGroupSubscribeInput = (
  input: unknown,
): SecureGroupSubscribeInput | null => {
  if (!input || typeof input !== "object") return null

  const candidate = input as Record<string, unknown>
  const groupId = typeof candidate.groupId === "string" ? candidate.groupId.trim() : ""

  if (!groupId) return null

  return {
    groupId,
    cursor:
      typeof candidate.cursor === "number" || typeof candidate.cursor === "string"
        ? candidate.cursor
        : undefined,
    relays: asStringArray(candidate.relays),
  }
}

export const buildSecureSubscribeFilters = ({
  groupId,
  cursor,
}: {
  groupId: string
  cursor?: string | number
}) => [
  {
    kinds: [
      GROUP_KINDS.NIP_EE.GROUP_EVENT,
      GROUP_KINDS.NIP_EE.WELCOME,
      GROUP_KINDS.NIP_EE.EPOCH_KEY_SHARE,
    ],
    "#h": [groupId],
    ...(typeof cursor === "number" ? {since: cursor} : {}),
  },
]
