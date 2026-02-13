import {describe, expect, it} from "vitest"
import {makeGroup, makeMembership, makeProjection} from "src/domain/group"
import {
  selectGroupListItems,
  selectGroupProjection,
  selectGroupSummaryItem,
} from "src/domain/group-selectors"

describe("group-selectors", () => {
  it("builds a group summary item for list screens", () => {
    const projection = makeProjection(
      makeGroup({
        id: "ops",
        title: "Ops Team",
        protocol: "nip29",
        transportMode: "baseline-nip29",
        updatedAt: 500,
      }),
    )

    projection.members["a"] = makeMembership({groupId: "ops", pubkey: "a", status: "active"})
    projection.members["b"] = makeMembership({groupId: "ops", pubkey: "b", status: "removed"})

    const item = selectGroupSummaryItem(projection, {now: 510})

    expect(item.id).toBe("ops")
    expect(item.title).toBe("Ops Team")
    expect(item.memberCount).toBe(1)
    expect(item.stale).toBe(false)
  })

  it("sorts list items by recency", () => {
    const older = makeProjection(makeGroup({id: "intel", updatedAt: 100}))
    const newer = makeProjection(makeGroup({id: "ops", updatedAt: 200}))

    const byGroup = new Map([
      ["intel", older],
      ["ops", newer],
    ])

    const items = selectGroupListItems(byGroup, {now: 210})

    expect(items.map(({id}) => id)).toEqual(["ops", "intel"])
  })

  it("selects a single projection by id", () => {
    const projection = makeProjection(makeGroup({id: "ops"}))
    const byGroup = new Map([["ops", projection]])

    expect(selectGroupProjection(byGroup, "ops")?.group.id).toBe("ops")
    expect(selectGroupProjection(byGroup, "missing")).toBeUndefined()
  })
})
