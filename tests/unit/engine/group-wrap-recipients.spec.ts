import {describe, expect, it} from "vitest"
import {makeGroup, makeMembership, makeProjection} from "../../../src/domain/group"
import {
  buildSecureGroupWrapTags,
  resolveEligibleSecureWrapRecipients,
} from "../../../src/engine/group-wrap-recipients"

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

describe("engine/group-wrap-recipients", () => {
  it("includes sender and excludes removed/pending members deterministically", () => {
    const projection = makeTestProjection("ops")
    const removed = "a".repeat(64)
    const pending = "b".repeat(64)
    const active = "c".repeat(64)
    const sender = "f".repeat(64)

    projection.members[removed] = makeMembership({
      groupId: "ops",
      pubkey: removed,
      status: "removed",
      updatedAt: 1739836800,
    })
    projection.members[pending] = makeMembership({
      groupId: "ops",
      pubkey: pending,
      status: "pending",
      updatedAt: 1739836800,
    })
    projection.members[active] = makeMembership({
      groupId: "ops",
      pubkey: active,
      status: "active",
      updatedAt: 1739836800,
    })

    const resolved = resolveEligibleSecureWrapRecipients({
      recipients: [removed, pending, active],
      senderPubkey: sender,
      projection,
    })

    expect(resolved.eligibleRecipients).toEqual([active, sender].sort())
    expect(resolved.excludedRecipients).toEqual([pending, removed].sort())
  })

  it("emits per-member wrap tags excluding sender", () => {
    const sender = "f".repeat(64)
    const recipients = ["a".repeat(64), sender, "b".repeat(64)]

    const tags = buildSecureGroupWrapTags({
      groupId: "ops",
      epochId: "epoch:ops:2:200",
      recipients,
      senderPubkey: sender,
    })

    expect(tags.filter(tag => tag[0] === "p")).toHaveLength(2)
    expect(tags.filter(tag => tag[0] === "wrap")).toHaveLength(2)
    expect(tags.some(tag => tag[0] === "p" && tag[1] === sender)).toBe(false)
  })
})
