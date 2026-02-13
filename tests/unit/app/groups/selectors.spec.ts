import {describe, expect, it} from "vitest"
import {
  buildGroupDetailViewModel,
  getGroupRouteSection,
  GROUP_DETAIL_AUDIT_PREVIEW_LIMIT,
  GROUP_DETAIL_MEMBER_PREVIEW_LIMIT,
} from "src/app/groups/selectors"

describe("app/groups selectors", () => {
  it("builds detail view model with counts and previews", () => {
    const view = buildGroupDetailViewModel(
      {
        group: {
          id: "ops",
          title: "Ops Team",
          description: "Coordination",
          protocol: "nip29",
          transportMode: "baseline-nip29",
          createdAt: 100,
          updatedAt: 200,
        },
        members: {
          ["a".repeat(64)]: {
            groupId: "ops",
            pubkey: "a".repeat(64),
            role: "member",
            status: "pending",
            updatedAt: 201,
          },
          ["b".repeat(64)]: {
            groupId: "ops",
            pubkey: "b".repeat(64),
            role: "admin",
            status: "active",
            updatedAt: 202,
          },
        },
        audit: [
          {
            groupId: "ops",
            action: "kind:9008",
            actor: "c".repeat(64),
            createdAt: 203,
            reason: "spam",
          },
        ],
        sourceEvents: [],
      } as any,
      {now: 210},
    )

    expect(view.id).toBe("ops")
    expect(view.activeMemberCount).toBe(1)
    expect(view.pendingMemberCount).toBe(1)
    expect(view.memberPreview).toHaveLength(2)
    expect(view.memberPreview[0].role).toBe("admin")
    expect(view.auditPreview).toHaveLength(1)
    expect(view.stale).toBe(false)
  })

  it("enforces preview limits and computes staleness", () => {
    const members = Object.fromEntries(
      Array.from({length: GROUP_DETAIL_MEMBER_PREVIEW_LIMIT + 2}).map((_, i) => [
        `${i}`.repeat(64).slice(0, 64),
        {
          groupId: "ops",
          pubkey: `${i}`.repeat(64).slice(0, 64),
          role: "member",
          status: "active",
          updatedAt: 100 + i,
        },
      ]),
    )

    const audit = Array.from({length: GROUP_DETAIL_AUDIT_PREVIEW_LIMIT + 3}).map((_, i) => ({
      groupId: "ops",
      action: `kind:${i}`,
      actor: "d".repeat(64),
      createdAt: 100 + i,
    }))

    const view = buildGroupDetailViewModel(
      {
        group: {
          id: "ops",
          title: "",
          description: "",
          protocol: "nip29",
          transportMode: "baseline-nip29",
          createdAt: 100,
          updatedAt: 100,
        },
        members,
        audit,
        sourceEvents: [],
      } as any,
      {now: 100 + 60 * 60 * 24 + 10},
    )

    expect(view.memberPreview).toHaveLength(GROUP_DETAIL_MEMBER_PREVIEW_LIMIT)
    expect(view.auditPreview).toHaveLength(GROUP_DETAIL_AUDIT_PREVIEW_LIMIT)
    expect(view.stale).toBe(true)
  })

  it("derives detail section from route path", () => {
    expect(getGroupRouteSection("/groups/ops")).toBe("overview")
    expect(getGroupRouteSection("/groups/ops/members")).toBe("members")
    expect(getGroupRouteSection("/groups/ops/moderation")).toBe("moderation")
    expect(getGroupRouteSection("/groups/ops/settings")).toBe("settings")
  })
})
