import {describe, expect, it} from "vitest"
import {GROUP_KINDS} from "../../../src/domain/group-kinds"
import {makeGroup, makeMembership, makeProjection} from "../../../src/domain/group"
import {validateRemovedMemberWrapExclusion} from "../../../src/engine/group-wrap-exclusion"

const makeTestProjection = (groupId: string) =>
  makeProjection(
    makeGroup({
      id: groupId,
      protocol: "nip-ee",
      transportMode: "secure-nip-ee",
      createdAt: 1739836800,
      updatedAt: 1739836800,
    }),
  )

describe("engine/group-wrap-exclusion", () => {
  it("accepts secure events that exclude removed members", () => {
    const projection = makeTestProjection("ops")
    projection.members["a".repeat(64)] = makeMembership({
      groupId: "ops",
      pubkey: "a".repeat(64),
      status: "removed",
      updatedAt: 1739836800,
    })

    const result = validateRemovedMemberWrapExclusion({
      groupId: "ops",
      projection,
      events: [
        {
          id: "ok-1",
          pubkey: "f".repeat(64),
          kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
          created_at: 1739836801,
          tags: [
            ["h", "ops"],
            ["p", "b".repeat(64)],
          ],
          content: "{}",
          sig: "s".repeat(128),
        },
      ],
    })

    expect(result).toEqual({ok: true})
  })

  it("rejects secure events that include removed members in wraps", () => {
    const projection = makeTestProjection("ops")
    const removed = "a".repeat(64)
    projection.members[removed] = makeMembership({
      groupId: "ops",
      pubkey: removed,
      status: "removed",
      updatedAt: 1739836800,
    })

    const result = validateRemovedMemberWrapExclusion({
      groupId: "ops",
      projection,
      events: [
        {
          id: "bad-1",
          pubkey: "f".repeat(64),
          kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
          created_at: 1739836801,
          tags: [
            ["h", "ops"],
            ["p", removed],
          ],
          content: "{}",
          sig: "s".repeat(128),
        },
      ],
    })

    expect(result).toEqual({
      ok: false,
      reason: "REMOVED_MEMBER_INCLUDED",
      eventId: "bad-1",
      removedPubkey: removed,
    })
  })

  it("uses removal events in batch to enforce exclusion for subsequent secure wraps", () => {
    const projection = makeTestProjection("ops")
    const removed = "a".repeat(64)

    const result = validateRemovedMemberWrapExclusion({
      groupId: "ops",
      projection,
      events: [
        {
          id: "remove-1",
          pubkey: "f".repeat(64),
          kind: GROUP_KINDS.NIP29.REMOVE_USER,
          created_at: 1739836800,
          tags: [
            ["h", "ops"],
            ["p", removed],
          ],
          content: "",
          sig: "s".repeat(128),
        },
        {
          id: "bad-2",
          pubkey: "f".repeat(64),
          kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
          created_at: 1739836801,
          tags: [
            ["h", "ops"],
            ["p", removed],
          ],
          content: "{}",
          sig: "s".repeat(128),
        },
      ],
    })

    expect(result).toEqual({
      ok: false,
      reason: "REMOVED_MEMBER_INCLUDED",
      eventId: "bad-2",
      removedPubkey: removed,
    })
  })
})
