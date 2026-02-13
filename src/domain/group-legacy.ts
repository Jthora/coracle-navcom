const HEX_64_RE = /^[0-9a-f]{64}$/i
const LEGACY_ALIAS_PREFIX = "legacy:channel:"

export const GROUP_LEGACY_REASON = {
  INVALID_CHANNEL_ID: "GROUP_LEGACY_INVALID_CHANNEL_ID",
  TOO_MANY_MEMBERS: "GROUP_LEGACY_TOO_MANY_MEMBERS",
  INVALID_ALIAS: "GROUP_LEGACY_INVALID_ALIAS",
} as const

export type GroupLegacyReasonCode = (typeof GROUP_LEGACY_REASON)[keyof typeof GROUP_LEGACY_REASON]

export type GroupLegacyResult<T> =
  | {
      ok: true
      value: T
    }
  | {
      ok: false
      reason: GroupLegacyReasonCode
      input: string
    }

export const LEGACY_CHANNEL_MEMBER_LIMIT = 64

export const normalizeLegacyChannelMembers = (pubkeys: string[]) =>
  Array.from(
    new Set(
      pubkeys.map(pubkey => pubkey.trim().toLowerCase()).filter(pubkey => HEX_64_RE.test(pubkey)),
    ),
  ).sort()

export const isLegacyChannelId = (channelId: string) => {
  const members = normalizeLegacyChannelMembers((channelId || "").split(","))

  return members.length > 1 && members.join(",") === (channelId || "").trim().toLowerCase()
}

export const toLegacyGroupAlias = (channelId: string): GroupLegacyResult<string> => {
  const normalized = normalizeLegacyChannelMembers((channelId || "").split(","))

  if (normalized.length < 2) {
    return {ok: false, reason: GROUP_LEGACY_REASON.INVALID_CHANNEL_ID, input: channelId}
  }

  if (normalized.length > LEGACY_CHANNEL_MEMBER_LIMIT) {
    return {ok: false, reason: GROUP_LEGACY_REASON.TOO_MANY_MEMBERS, input: channelId}
  }

  return {
    ok: true,
    value: `${LEGACY_ALIAS_PREFIX}${normalized.join(",")}`,
  }
}

export const fromLegacyGroupAlias = (groupId: string): GroupLegacyResult<string> => {
  const normalized = (groupId || "").trim().toLowerCase()

  if (!normalized.startsWith(LEGACY_ALIAS_PREFIX)) {
    return {ok: false, reason: GROUP_LEGACY_REASON.INVALID_ALIAS, input: groupId}
  }

  const channelId = normalized.slice(LEGACY_ALIAS_PREFIX.length)
  const parsed = toLegacyGroupAlias(channelId)

  if (!parsed.ok) {
    return {ok: false, reason: GROUP_LEGACY_REASON.INVALID_ALIAS, input: groupId}
  }

  return {ok: true, value: channelId}
}

export const isLegacyGroupAlias = (groupId: string) => fromLegacyGroupAlias(groupId).ok
