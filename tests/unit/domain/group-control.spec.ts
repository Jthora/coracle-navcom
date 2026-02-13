import {describe, expect, it} from "vitest"
import {
  applyGroupControlEventsToProjection,
  buildGroupCreateTemplate,
  buildGroupJoinTemplate,
  buildGroupLeaveTemplate,
  buildGroupMetadataEditTemplate,
  buildGroupPutMemberTemplate,
  buildGroupRemoveMemberTemplate,
  canPerformGroupControlAction,
} from "src/domain/group-control"
import {GROUP_KINDS} from "src/domain/group-kinds"

describe("group-control", () => {
  it("builds create/join/leave templates", () => {
    const createTemplate = buildGroupCreateTemplate({groupId: "ops", title: "Ops"})
    const joinTemplate = buildGroupJoinTemplate({groupId: "ops", memberPubkey: "a".repeat(64)})
    const leaveTemplate = buildGroupLeaveTemplate({groupId: "ops", memberPubkey: "a".repeat(64)})

    expect(createTemplate.kind).toBe(GROUP_KINDS.NIP29.CREATE_GROUP)
    expect(createTemplate.tags).toContainEqual(["h", "ops"])
    expect(joinTemplate.kind).toBe(GROUP_KINDS.NIP29.JOIN_REQUEST)
    expect(leaveTemplate.kind).toBe(GROUP_KINDS.NIP29.LEAVE_REQUEST)
  })

  it("builds membership/admin control templates", () => {
    const putTemplate = buildGroupPutMemberTemplate({
      groupId: "ops",
      memberPubkey: "b".repeat(64),
      role: "moderator",
    })

    const removeTemplate = buildGroupRemoveMemberTemplate({
      groupId: "ops",
      memberPubkey: "b".repeat(64),
    })

    const editTemplate = buildGroupMetadataEditTemplate({
      groupId: "ops",
      title: "Ops Team",
      description: "coordination",
    })

    expect(putTemplate.kind).toBe(GROUP_KINDS.NIP29.PUT_USER)
    expect(removeTemplate.kind).toBe(GROUP_KINDS.NIP29.REMOVE_USER)
    expect(editTemplate.kind).toBe(GROUP_KINDS.NIP29.EDIT_METADATA)
  })

  it("checks permission guard integration", () => {
    expect(canPerformGroupControlAction("member", "join")).toBe(true)
    expect(canPerformGroupControlAction("member", "put-member")).toBe(false)
    expect(canPerformGroupControlAction("admin", "put-member")).toBe(true)
    expect(canPerformGroupControlAction("moderator", "remove-member")).toBe(true)
  })

  it("applies sorted and group-filtered sync updates", () => {
    const calls: string[] = []
    const projection = {group: {id: "ops"}}

    applyGroupControlEventsToProjection(
      projection,
      [
        {
          id: "evt-2",
          created_at: 200,
          tags: [["h", "ops"]],
        },
        {
          id: "evt-1",
          created_at: 100,
          tags: [["h", "ops"]],
        },
        {
          id: "evt-3",
          created_at: 300,
          tags: [["h", "intel"]],
        },
      ] as any,
      (state, event) => {
        calls.push(event.id)

        return state
      },
    )

    expect(calls).toEqual(["evt-1", "evt-2"])
  })
})
