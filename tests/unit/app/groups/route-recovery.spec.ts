import {describe, expect, it} from "vitest"
import {buildRouteRecoveryRedirectContext} from "src/app/groups/route-recovery"

describe("app/groups route-recovery", () => {
  it("builds redirect context with reason metadata", () => {
    const context = buildRouteRecoveryRedirectContext({
      fromPath: "/groups/%20/chat",
      message: "Missing required route data",
      reason: "ROUTE_REQUIRED_PARAM_MISSING:groupId",
      props: {},
    })

    expect(context).toMatchObject({
      guardMessage: "Missing required route data",
      guardFrom: "/groups/%20/chat",
      guardReason: "ROUTE_REQUIRED_PARAM_MISSING:groupId",
    })
  })

  it("preserves invite recovery errors through redirect context", () => {
    const context = buildRouteRecoveryRedirectContext({
      fromPath: "/groups/create?groups=bad",
      message: "Invite decode had recoverable errors",
      reason: "ROUTE_REQUIRED_PARAM_MISSING:groupId",
      props: {
        groupInviteRecoveryErrors: [
          {
            reason: "GROUP_INVITE_DECODE_ENTRY_URI_MALFORMED",
            value: "relay.bad'ops|bad%ZZ|1|Broken",
          },
        ],
      },
    })

    expect(context.groupInviteRecoveryErrors).toEqual([
      {
        reason: "GROUP_INVITE_DECODE_ENTRY_URI_MALFORMED",
        value: "relay.bad'ops|bad%ZZ|1|Broken",
      },
    ])
  })
})
