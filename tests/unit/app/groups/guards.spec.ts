import {describe, expect, it} from "vitest"
import {GROUP_ROUTE_GUARD_REASON, guardGroupRoute} from "src/app/groups/guards"

describe("app/groups guards", () => {
  it("rejects missing or invalid group identifiers", () => {
    expect(guardGroupRoute({path: "/groups/%20"})).toMatchObject({
      ok: false,
      reason: GROUP_ROUTE_GUARD_REASON.INVALID_GROUP_ID,
      redirectTo: "/groups",
    })

    expect(guardGroupRoute({path: "/groups/bad", groupId: "invalid group id"})).toMatchObject({
      ok: false,
      reason: GROUP_ROUTE_GUARD_REASON.INVALID_GROUP_ID,
      redirectTo: "/groups",
    })
  })

  it("allows baseline routes for valid canonical group ids", () => {
    expect(
      guardGroupRoute({
        path: "/groups/relay.example%27ops",
        groupId: "relay.example'ops",
      }),
    ).toEqual({ok: true})

    expect(
      guardGroupRoute({
        path: "/groups/ops/members",
        groupId: "ops",
      }),
    ).toEqual({ok: true})
  })

  it("enforces relay baseline tier for elevated moderation/settings routes", () => {
    expect(
      guardGroupRoute({
        path: "/groups/ops/moderation",
        groupId: "ops",
      }),
    ).toMatchObject({
      ok: false,
      reason: GROUP_ROUTE_GUARD_REASON.BASELINE_TIER_REQUIRED,
      redirectTo: "/groups/ops",
    })

    expect(
      guardGroupRoute({
        path: "/groups/relay.example%27ops/settings",
        groupId: "relay.example'ops",
      }),
    ).toEqual({ok: true})
  })
})
