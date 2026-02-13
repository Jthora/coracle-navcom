import {describe, expect, it} from "vitest"
import {
  fromLegacyGroupAlias,
  GROUP_LEGACY_REASON,
  isLegacyChannelId,
  isLegacyGroupAlias,
  LEGACY_CHANNEL_MEMBER_LIMIT,
  toLegacyGroupAlias,
} from "src/domain/group-legacy"

describe("group-legacy", () => {
  const a = "a".repeat(64)
  const b = "b".repeat(64)

  it("maps a legacy channel id to rollback-safe alias and back", () => {
    const channelId = [a, b].sort().join(",")
    const alias = toLegacyGroupAlias(channelId)

    expect(alias.ok).toBe(true)
    if (!alias.ok) return

    expect(alias.value).toBe(`legacy:channel:${channelId}`)

    const parsed = fromLegacyGroupAlias(alias.value)

    expect(parsed).toEqual({ok: true, value: channelId})
  })

  it("validates canonical legacy channel ids", () => {
    expect(isLegacyChannelId([a, b].sort().join(","))).toBe(true)
    expect(isLegacyChannelId(`${a},not-a-pubkey`)).toBe(false)
  })

  it("rejects channels above member limit", () => {
    const pubkeys = Array.from({length: LEGACY_CHANNEL_MEMBER_LIMIT + 1}, (_, i) =>
      i.toString(16).padStart(64, "0"),
    )

    const result = toLegacyGroupAlias(pubkeys.join(","))

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe(GROUP_LEGACY_REASON.TOO_MANY_MEMBERS)
    }
  })

  it("detects legacy aliases", () => {
    const alias = `legacy:channel:${[a, b].sort().join(",")}`

    expect(isLegacyGroupAlias(alias)).toBe(true)
    expect(isLegacyGroupAlias("ops")).toBe(false)
  })
})
