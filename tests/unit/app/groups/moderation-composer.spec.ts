import {describe, expect, it} from "vitest"
import {
  buildModerationReasonText,
  createDefaultModerationDraft,
  getModerationActionOptions,
  getModerationReasonCodeOptions,
  GROUP_MODERATION_ACTION,
  validateModerationDraft,
} from "src/app/groups/moderation-composer"

describe("app/groups moderation-composer", () => {
  it("provides action picker options", () => {
    expect(getModerationActionOptions().map(option => option.value)).toEqual([
      GROUP_MODERATION_ACTION.REMOVE_MEMBER,
      GROUP_MODERATION_ACTION.METADATA_NOTE,
    ])
  })

  it("provides reason-code options", () => {
    expect(getModerationReasonCodeOptions().length).toBeGreaterThan(1)
    expect(
      getModerationReasonCodeOptions().some(option => option.value === "compromised-device"),
    ).toBe(true)
  })

  it("validates remove-member target pubkey and accepts moderation note action", () => {
    const invalid = validateModerationDraft({
      action: GROUP_MODERATION_ACTION.REMOVE_MEMBER,
      reasonCode: "abuse",
      note: "",
      targetPubkey: "bad",
    })

    expect(invalid.ok).toBe(false)

    const validNote = validateModerationDraft({
      action: GROUP_MODERATION_ACTION.METADATA_NOTE,
      reasonCode: "policy-violation",
      note: "requires review",
      targetPubkey: "",
    })

    expect(validNote.ok).toBe(true)
  })

  it("builds deterministic moderation reason text", () => {
    expect(
      buildModerationReasonText({
        action: GROUP_MODERATION_ACTION.REMOVE_MEMBER,
        reasonCode: "spam",
        note: "repeated flood",
      }),
    ).toBe("moderation:remove-member:spam; repeated flood")

    expect(createDefaultModerationDraft().action).toBe(GROUP_MODERATION_ACTION.REMOVE_MEMBER)
  })
})
