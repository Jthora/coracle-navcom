import {describe, expect, it} from "vitest"
import {GROUP_ROUTE_GUARD_REASON, guardGroupRoute} from "src/app/groups/guards"

describe("app/groups guards", () => {
  it("rejects missing or invalid group identifiers", () => {
    expect(guardGroupRoute({path: "/groups/%20"})).toMatchObject({
      ok: false,
      reason: GROUP_ROUTE_GUARD_REASON.INVALID_GROUP_ID,
      redirectTo: "/groups",
      message:
        "This group link is incomplete or invalid, so we redirected you to Groups. Open a valid invite or group address to continue.",
    })

    expect(
      guardGroupRoute({
        path: "/groups/bad",
        groupId: "invalid group id",
      }),
    ).toMatchObject({
      ok: false,
      reason: GROUP_ROUTE_GUARD_REASON.INVALID_GROUP_ID,
      redirectTo: "/groups",
      message:
        "This group link is incomplete or invalid, so we redirected you to Groups. Open a valid invite or group address to continue.",
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
      message:
        "Settings and moderation only work for relay-addressed groups. We redirected you to a supported group view.",
    })

    expect(
      guardGroupRoute({
        path: "/groups/relay.example%27ops/settings",
        groupId: "relay.example'ops",
      }),
    ).toEqual({ok: true})
  })

  it("canonicalizes non-relay ids when redirecting elevated routes", () => {
    expect(
      guardGroupRoute({
        path: "/groups/TEAM_ONE/settings",
        groupId: "TEAM_ONE",
      }),
    ).toMatchObject({
      ok: false,
      reason: GROUP_ROUTE_GUARD_REASON.BASELINE_TIER_REQUIRED,
      redirectTo: "/groups/team_one",
    })
  })
})
