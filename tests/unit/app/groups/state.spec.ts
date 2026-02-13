import {describe, expect, it, beforeEach} from "vitest"
import {get} from "svelte/store"
import {GROUP_KINDS} from "src/domain/group-kinds"
import {checked} from "src/engine/state"
import {
  hasUnreadGroupMessages,
  groupSummaries,
  groupsHydrated,
  hydrateGroupsFromEvents,
  resetGroupsState,
  setGroupProjections,
  totalUnreadGroupMessages,
  unreadGroupMessageCounts,
} from "src/app/groups/state"

describe("app/groups state", () => {
  beforeEach(() => {
    resetGroupsState()
    checked.set({})
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

  it("computes unread group message counts from read-receipt state", () => {
    setGroupProjections(
      new Map([
        [
          "relay.example'ops",
          {
            group: {
              id: "relay.example'ops",
              title: "Ops",
              description: "",
              protocol: "nip-ee",
              transportMode: "secure-nip-ee",
              createdAt: 100,
              updatedAt: 140,
            },
            members: {},
            audit: [],
            sourceEvents: [
              {
                id: "msg-1",
                pubkey: "b".repeat(64),
                kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
                created_at: 120,
                tags: [["h", "relay.example'ops"]],
                content: "hello",
                sig: "c".repeat(128),
              },
              {
                id: "msg-2",
                pubkey: "d".repeat(64),
                kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
                created_at: 140,
                tags: [["h", "relay.example'ops"]],
                content: "world",
                sig: "e".repeat(128),
              },
            ],
          },
        ],
      ]) as any,
    )

    expect(get(unreadGroupMessageCounts).get("relay.example'ops")).toBe(2)
    expect(get(totalUnreadGroupMessages)).toBe(2)
    expect(get(hasUnreadGroupMessages)).toBe(true)

    checked.set({"groups/relay.example'ops": 130})

    expect(get(unreadGroupMessageCounts).get("relay.example'ops")).toBe(1)
    expect(get(totalUnreadGroupMessages)).toBe(1)

    checked.set({"groups/*": 999})

    expect(get(unreadGroupMessageCounts).get("relay.example'ops")).toBe(0)
    expect(get(totalUnreadGroupMessages)).toBe(0)
    expect(get(hasUnreadGroupMessages)).toBe(false)
  })
})
