import {describe, expect, it} from "vitest"
import {makeGroup, makeMembership, makeProjection} from "src/domain/group"
import {GROUP_KINDS} from "src/domain/group-kinds"
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

  it("hides secure groups that only have opaque encrypted events for other users", () => {
    const secure = makeProjection(
      makeGroup({
        id: "secure-hidden",
        protocol: "nip-ee",
        transportMode: "secure-nip-ee",
        updatedAt: 300,
      }),
    )

    secure.sourceEvents.push({
      id: "evt-secure-1",
      kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
      pubkey: "other-pubkey",
      content: "opaque-ciphertext",
      created_at: 300,
      tags: [["h", "secure-hidden"]],
      sig: "sig",
    } as any)

    const baseline = makeProjection(
      makeGroup({
        id: "baseline",
        protocol: "nip29",
        transportMode: "baseline-nip29",
        updatedAt: 200,
      }),
    )

    const byGroup = new Map([
      ["secure-hidden", secure],
      ["baseline", baseline],
    ])

    const items = selectGroupListItems(byGroup, {currentPubkey: "me"})

    expect(items.map(({id}) => id)).toEqual(["baseline"])
  })

  it("shows secure groups when current user has direct access signal", () => {
    const secure = makeProjection(
      makeGroup({
        id: "secure-visible",
        protocol: "nip-ee",
        transportMode: "secure-nip-ee",
        updatedAt: 400,
      }),
    )

    secure.sourceEvents.push({
      id: "evt-secure-2",
      kind: GROUP_KINDS.NIP_EE.WELCOME,
      pubkey: "admin-pubkey",
      content: "welcome-envelope",
      created_at: 400,
      tags: [
        ["h", "secure-visible"],
        ["p", "me"],
      ],
      sig: "sig",
    } as any)

    const byGroup = new Map([["secure-visible", secure]])

    const items = selectGroupListItems(byGroup, {currentPubkey: "me"})

    expect(items.map(({id}) => id)).toEqual(["secure-visible"])
  })

  it("selects a single projection by id", () => {
    const projection = makeProjection(makeGroup({id: "ops"}))
    const byGroup = new Map([["ops", projection]])

    expect(selectGroupProjection(byGroup, "ops")?.group.id).toBe("ops")
    expect(selectGroupProjection(byGroup, "missing")).toBeUndefined()
  })
})
