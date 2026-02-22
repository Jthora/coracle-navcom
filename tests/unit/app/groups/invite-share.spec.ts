import {describe, expect, it} from "vitest"
import {
  getAbsoluteGroupJoinPrefillHref,
  getGroupInviteCreateHref,
  getGroupJoinPrefillHref,
} from "src/app/groups/invite-share"

describe("app/groups invite-share", () => {
  it("builds encoded invite create href", () => {
    expect(getGroupInviteCreateHref("relay.example'ops")).toBe(
      "/invite/create?initialGroupAddress=relay.example'ops",
    )
  })

  it("builds encoded join prefill href", () => {
    expect(getGroupJoinPrefillHref("relay.example'ops")).toBe(
      "/groups/create?groupId=relay.example'ops",
    )
  })

  it("returns an absolute join href when window is available", () => {
    expect(getAbsoluteGroupJoinPrefillHref("relay.example'ops")).toContain(
      "/groups/create?groupId=relay.example'ops",
    )
  })
})
