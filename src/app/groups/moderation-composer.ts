const PUBKEY_RE = /^[a-f0-9]{64}$/i

export const GROUP_MODERATION_ACTION = {
  REMOVE_MEMBER: "remove-member",
  METADATA_NOTE: "metadata-note",
} as const

export type GroupModerationAction =
  (typeof GROUP_MODERATION_ACTION)[keyof typeof GROUP_MODERATION_ACTION]

export const GROUP_MODERATION_REASON_CODES = [
  "spam",
  "abuse",
  "impersonation",
  "compromised-device",
  "policy-violation",
  "other",
] as const

export type GroupModerationReasonCode = (typeof GROUP_MODERATION_REASON_CODES)[number]

export type GroupModerationDraft = {
  action: GroupModerationAction
  reasonCode: GroupModerationReasonCode
  note: string
  targetPubkey: string
}

export const createDefaultModerationDraft = (): GroupModerationDraft => ({
  action: GROUP_MODERATION_ACTION.REMOVE_MEMBER,
  reasonCode: "spam",
  note: "",
  targetPubkey: "",
})

export const getModerationActionOptions = () => [
  {
    value: GROUP_MODERATION_ACTION.REMOVE_MEMBER,
    label: "Remove member",
  },
  {
    value: GROUP_MODERATION_ACTION.METADATA_NOTE,
    label: "Add moderation note",
  },
]

export const getModerationReasonCodeOptions = () =>
  GROUP_MODERATION_REASON_CODES.map(value => ({
    value,
    label: value,
  }))

export const buildModerationReasonText = ({
  action,
  reasonCode,
  note,
}: {
  action: GroupModerationAction
  reasonCode: GroupModerationReasonCode
  note?: string
}) => {
  const prefix = `moderation:${action}:${reasonCode}`
  const normalizedNote = (note || "").trim()

  return normalizedNote ? `${prefix}; ${normalizedNote}` : prefix
}

export const validateModerationDraft = (draft: GroupModerationDraft) => {
  if (!draft.reasonCode) {
    return {ok: false, message: "Select a moderation reason code."}
  }

  if (draft.action === GROUP_MODERATION_ACTION.REMOVE_MEMBER) {
    const target = draft.targetPubkey.trim()

    if (!target) {
      return {ok: false, message: "Provide a target member pubkey."}
    }

    if (!PUBKEY_RE.test(target)) {
      return {ok: false, message: "Target member pubkey must be a 64-char hex value."}
    }
  }

  return {ok: true, message: ""}
}
