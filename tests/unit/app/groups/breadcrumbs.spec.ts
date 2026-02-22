import {describe, expect, it} from "vitest"
import {buildGroupBreadcrumbItems} from "../../../../src/app/groups/breadcrumbs"

describe("groups-breadcrumbs", () => {
  it("returns root-only breadcrumb for groups list", () => {
    expect(buildGroupBreadcrumbItems({section: "list"})).toEqual([{label: "Groups", current: true}])
  })

  it("returns create flow breadcrumbs", () => {
    expect(buildGroupBreadcrumbItems({section: "create-room"})).toEqual([
      {label: "Groups", href: "/groups"},
      {label: "Group Setup", href: "/groups/create"},
      {label: "Create Group", current: true},
    ])
  })

  it("returns group section breadcrumbs for chat", () => {
    expect(
      buildGroupBreadcrumbItems({
        section: "chat",
        groupId: "relay.example'ops",
        groupTitle: "Ops Team",
      }),
    ).toEqual([
      {label: "Groups", href: "/groups"},
      {label: "Ops Team", href: "/groups/relay.example'ops"},
      {label: "Chat", current: true},
    ])
  })
})
