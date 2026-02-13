import {describe, expect, it} from "vitest"
import {makeMembership} from "src/domain/group"
import {
  applyMembershipTransition,
  GROUP_MEMBERSHIP_REASON,
  GROUP_MEMBERSHIP_STATES,
  GROUP_MEMBERSHIP_TRANSITIONS,
  isNewerMembershipTransitionEvent,
} from "src/domain/group-membership-state"

describe("group-membership-state", () => {
  const groupId = "ops"
  const pubkey = "a".repeat(64)

  it("enumerates valid states and transition triggers", () => {
    expect(GROUP_MEMBERSHIP_STATES).toEqual(["none", "pending", "active", "removed", "left"])
    expect(GROUP_MEMBERSHIP_TRANSITIONS.none["join-request"]).toBe("pending")
    expect(GROUP_MEMBERSHIP_TRANSITIONS.pending.approve).toBe("active")
    expect(GROUP_MEMBERSHIP_TRANSITIONS.active.leave).toBe("left")
  })

  it("applies valid transitions", () => {
    const pending = applyMembershipTransition({
      groupId,
      pubkey,
      action: "join-request",
      actorRole: "member",
      eventAt: 100,
      eventId: "evt-1",
    })

    expect(pending.ok).toBe(true)
    if (!pending.ok) return

    expect(pending.membership.status).toBe("pending")

    const active = applyMembershipTransition({
      groupId,
      pubkey,
      action: "approve",
      actorRole: "admin",
      eventAt: 110,
      eventId: "evt-2",
      current: pending.membership,
    })

    expect(active.ok).toBe(true)
    if (!active.ok) return

    expect(active.membership.status).toBe("active")
  })

  it("rejects invalid transitions", () => {
    const result = applyMembershipTransition({
      groupId,
      pubkey,
      action: "leave",
      actorRole: "member",
      eventAt: 100,
      eventId: "evt-1",
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe(GROUP_MEMBERSHIP_REASON.INVALID_TRANSITION)
    }
  })

  it("enforces role-based guardrails", () => {
    const current = makeMembership({
      groupId,
      pubkey,
      status: "active",
      role: "member",
      updatedAt: 100,
      eventId: "evt-1",
    })

    const denied = applyMembershipTransition({
      groupId,
      pubkey,
      action: "remove",
      actorRole: "member",
      eventAt: 110,
      eventId: "evt-2",
      current,
    })

    expect(denied.ok).toBe(false)
    if (!denied.ok) {
      expect(denied.reason).toBe(GROUP_MEMBERSHIP_REASON.PERMISSION_DENIED)
    }
  })

  it("prevents stale and duplicate replay events", () => {
    const current = makeMembership({
      groupId,
      pubkey,
      status: "active",
      role: "member",
      updatedAt: 100,
      eventId: "evt-100",
    })

    const stale = applyMembershipTransition({
      groupId,
      pubkey,
      action: "leave",
      actorRole: "member",
      eventAt: 99,
      eventId: "evt-99",
      current,
    })

    expect(stale.ok).toBe(false)
    if (!stale.ok) {
      expect(stale.reason).toBe(GROUP_MEMBERSHIP_REASON.STALE_EVENT)
    }

    const duplicate = applyMembershipTransition({
      groupId,
      pubkey,
      action: "leave",
      actorRole: "member",
      eventAt: 100,
      eventId: "evt-100",
      current,
    })

    expect(duplicate.ok).toBe(false)
    if (!duplicate.ok) {
      expect(duplicate.reason).toBe(GROUP_MEMBERSHIP_REASON.DUPLICATE_EVENT)
    }
  })

  it("resolves same-timestamp races deterministically by event id", () => {
    const current = makeMembership({
      groupId,
      pubkey,
      status: "pending",
      role: "member",
      updatedAt: 100,
      eventId: "evt-a",
    })

    expect(isNewerMembershipTransitionEvent(current, 100, "evt-z")).toEqual({
      ok: true,
      duplicate: false,
    })

    const loseRace = applyMembershipTransition({
      groupId,
      pubkey,
      action: "approve",
      actorRole: "admin",
      eventAt: 100,
      eventId: "evt-0",
      current,
    })

    expect(loseRace.ok).toBe(false)
    if (!loseRace.ok) {
      expect(loseRace.reason).toBe(GROUP_MEMBERSHIP_REASON.STALE_EVENT)
    }
  })
})
