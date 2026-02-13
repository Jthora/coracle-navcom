import {describe, expect, it} from "vitest"
import {
  createGroupAdminUiVisibilityMap,
  GROUP_ADMIN_UI_CONTROL,
  hasAnyVisibleAdminAction,
} from "src/app/groups/admin-visibility"

describe("app/groups admin visibility", () => {
  it("limits member role to audit history and hides privileged controls", () => {
    const visibility = createGroupAdminUiVisibilityMap("member")

    expect(visibility[GROUP_ADMIN_UI_CONTROL.AUDIT_HISTORY]).toEqual({
      visible: true,
      enabled: true,
      disabledReason: undefined,
    })
    expect(visibility[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].visible).toBe(false)
    expect(visibility[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].visible).toBe(false)
    expect(visibility[GROUP_ADMIN_UI_CONTROL.PUT_MEMBER].visible).toBe(false)
    expect(visibility[GROUP_ADMIN_UI_CONTROL.REMOVE_MEMBER].visible).toBe(false)
    expect(hasAnyVisibleAdminAction(visibility)).toBe(false)
  })

  it("shows policy editor for moderators with disabled affordance", () => {
    const visibility = createGroupAdminUiVisibilityMap("moderator")

    expect(visibility[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR]).toMatchObject({
      visible: true,
      enabled: false,
      disabledReason: "Admin role required to edit policy and metadata.",
    })
    expect(visibility[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].enabled).toBe(true)
    expect(visibility[GROUP_ADMIN_UI_CONTROL.REMOVE_MEMBER].enabled).toBe(true)
    expect(visibility[GROUP_ADMIN_UI_CONTROL.PUT_MEMBER].visible).toBe(false)
    expect(hasAnyVisibleAdminAction(visibility)).toBe(true)
  })

  it("enables all controls for admin and owner roles", () => {
    const adminVisibility = createGroupAdminUiVisibilityMap("admin")
    const ownerVisibility = createGroupAdminUiVisibilityMap("owner")

    for (const control of [
      GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR,
      GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER,
      GROUP_ADMIN_UI_CONTROL.PUT_MEMBER,
      GROUP_ADMIN_UI_CONTROL.REMOVE_MEMBER,
      GROUP_ADMIN_UI_CONTROL.AUDIT_HISTORY,
    ]) {
      expect(adminVisibility[control].visible).toBe(true)
      expect(adminVisibility[control].enabled).toBe(true)
      expect(ownerVisibility[control].visible).toBe(true)
      expect(ownerVisibility[control].enabled).toBe(true)
    }
  })
})
