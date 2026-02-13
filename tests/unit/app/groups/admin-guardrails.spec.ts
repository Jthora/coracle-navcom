import {describe, expect, it} from "vitest"
import {
  ADMIN_DESTRUCTIVE_ACTION,
  buildDestructiveConfirmationToken,
  canRunDestructiveAction,
} from "src/app/groups/admin-guardrails"

describe("app/groups admin guardrails", () => {
  it("builds deterministic destructive confirmation token", () => {
    expect(
      buildDestructiveConfirmationToken({
        action: ADMIN_DESTRUCTIVE_ACTION.REMOVE_MEMBER,
        groupId: "ops",
      }),
    ).toBe("remove-member:ops")
  })

  it("rejects destructive action when confirmation token does not match", () => {
    const result = canRunDestructiveAction({
      action: ADMIN_DESTRUCTIVE_ACTION.REMOVE_MEMBER,
      groupId: "ops",
      confirmationInput: "wrong",
      reason: "abuse",
    })

    expect(result.ok).toBe(false)
  })

  it("rejects destructive action without reason", () => {
    const result = canRunDestructiveAction({
      action: ADMIN_DESTRUCTIVE_ACTION.REMOVE_MEMBER,
      groupId: "ops",
      confirmationInput: "remove-member:ops",
      reason: "",
    })

    expect(result.ok).toBe(false)
  })

  it("allows destructive action when guardrails pass", () => {
    const result = canRunDestructiveAction({
      action: ADMIN_DESTRUCTIVE_ACTION.REMOVE_MEMBER,
      groupId: "ops",
      confirmationInput: "remove-member:ops",
      reason: "confirmed abuse",
    })

    expect(result.ok).toBe(true)
  })
})
