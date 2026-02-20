import {describe, expect, it} from "vitest"
import {GROUP_KINDS} from "../../../src/domain/group-kinds"
import {
  collectGroupMembershipRemovalPubkeys,
  isGroupMembershipRemovalEvent,
} from "../../../src/engine/group-membership-events"

describe("engine/group-membership-events", () => {
  it("detects remove and leave membership events", () => {
    expect(
      isGroupMembershipRemovalEvent({
        kind: GROUP_KINDS.NIP29.REMOVE_USER,
        tags: [
          ["h", "ops"],
          ["p", "a"],
        ],
      }),
    ).toBe(true)

    expect(
      isGroupMembershipRemovalEvent({
        kind: GROUP_KINDS.NIP29.LEAVE_REQUEST,
        tags: [
          ["h", "ops"],
          ["p", "a"],
        ],
      }),
    ).toBe(true)
  })

  it("collects unique removed members scoped by group id", () => {
    const removed = collectGroupMembershipRemovalPubkeys({
      groupId: "ops",
      events: [
        {
          kind: GROUP_KINDS.NIP29.REMOVE_USER,
          tags: [
            ["h", "ops"],
            ["p", "pk-a"],
          ],
        },
        {
          kind: GROUP_KINDS.NIP29.LEAVE_REQUEST,
          tags: [
            ["h", "ops"],
            ["p", "pk-b"],
          ],
        },
        {
          kind: GROUP_KINDS.NIP29.REMOVE_USER,
          tags: [
            ["h", "intel"],
            ["p", "pk-c"],
          ],
        },
      ],
    })

    expect(removed).toEqual(["pk-a", "pk-b"])
  })
})
