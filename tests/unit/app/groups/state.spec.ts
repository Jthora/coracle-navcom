import {describe, expect, it, beforeEach} from "vitest"
import {get} from "svelte/store"
import {GROUP_KINDS} from "src/domain/group-kinds"
import {
  groupSummaries,
  groupsHydrated,
  hydrateGroupsFromEvents,
  resetGroupsState,
  setGroupProjections,
} from "src/app/groups/state"

describe("app/groups state", () => {
  beforeEach(() => {
    resetGroupsState()
  })

  it("hydrates summaries from events", () => {
    hydrateGroupsFromEvents([
      {
        id: "evt-1",
        pubkey: "a".repeat(64),
        kind: GROUP_KINDS.NIP29.METADATA,
        created_at: 100,
        tags: [
          ["d", "ops"],
          ["name", "Ops Team"],
          ["about", "Coordination"],
        ],
        content: "",
        sig: "b".repeat(128),
      } as any,
    ])

    expect(get(groupsHydrated)).toBe(true)
    expect(get(groupSummaries)).toHaveLength(1)
    expect(get(groupSummaries)[0].title).toBe("Ops Team")
  })

  it("supports direct projection map injection", () => {
    setGroupProjections(
      new Map([
        [
          "ops",
          {
            group: {
              id: "ops",
              protocol: "nip29",
              transportMode: "relay-managed",
              title: "Ops",
              description: "",
              picture: "",
              policy: null,
              updatedAt: 100,
            },
            members: {},
            audit: [],
            seenEventIds: {},
            cursor: 100,
          },
        ],
      ]) as any,
    )

    expect(get(groupsHydrated)).toBe(true)
    expect(get(groupSummaries)[0].id).toBe("ops")
  })
})
