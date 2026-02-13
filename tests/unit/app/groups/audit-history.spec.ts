import {describe, expect, it} from "vitest"
import {
  createDefaultGroupAuditFilter,
  createGroupAuditHistoryView,
} from "src/app/groups/audit-history"
import {makeProjection, makeGroup, makeMembership, makeAuditEvent} from "src/domain/group"

const createProjection = () => {
  const projection = makeProjection(
    makeGroup({
      id: "ops",
      title: "Ops",
    }),
  )

  projection.members["a".repeat(64)] = makeMembership({
    groupId: "ops",
    pubkey: "a".repeat(64),
    role: "owner",
    status: "active",
  })

  projection.members["b".repeat(64)] = makeMembership({
    groupId: "ops",
    pubkey: "b".repeat(64),
    role: "moderator",
    status: "active",
  })

  projection.audit = [
    makeAuditEvent({
      groupId: "ops",
      action: "kind:9000",
      actor: "a".repeat(64),
      createdAt: 100,
      reason: "metadata update",
      eventId: "evt-100",
    }),
    makeAuditEvent({
      groupId: "ops",
      action: "kind:9001",
      actor: "system",
      createdAt: 90,
      reason: "sync remediation",
      eventId: "evt-090",
    }),
    makeAuditEvent({
      groupId: "ops",
      action: "kind:9000",
      actor: "c".repeat(64),
      createdAt: 80,
      reason: "unknown actor",
      eventId: "evt-080",
    }),
    makeAuditEvent({
      groupId: "ops",
      action: "kind:9002",
      actor: "b".repeat(64),
      createdAt: 70,
      reason: "moderator action",
      eventId: "evt-070",
    }),
  ]

  return projection
}

describe("app/groups audit history", () => {
  it("builds a sorted projection view with actor labels", () => {
    const projection = createProjection()

    const view = createGroupAuditHistoryView(projection, {
      actorPubkey: "a".repeat(64),
      pageSize: 10,
    })

    expect(view.total).toBe(4)
    expect(view.items).toHaveLength(4)
    expect(view.items[0].createdAt).toBe(100)
    expect(view.items[0].actorLabel).toBe("You (owner)")
    expect(view.items[1].actorLabel).toBe("System")
    expect(view.items[3].actorLabel.startsWith("moderator · bbbbbbbb")).toBe(true)
  })

  it("applies action and actor filters", () => {
    const projection = createProjection()

    const filteredAction = createGroupAuditHistoryView(projection, {
      filter: {
        action: "kind:9000",
      },
      pageSize: 10,
    })

    expect(filteredAction.total).toBe(2)
    expect(filteredAction.items.every(entry => entry.action === "kind:9000")).toBe(true)

    const filteredActor = createGroupAuditHistoryView(projection, {
      actorPubkey: "a".repeat(64),
      filter: {
        actor: "self",
      },
      pageSize: 10,
    })

    expect(filteredActor.total).toBe(1)
    expect(filteredActor.items[0].actor).toBe("a".repeat(64))
  })

  it("supports cursor pagination for load-more UX", () => {
    const projection = createProjection()

    const firstPage = createGroupAuditHistoryView(projection, {
      pageSize: 2,
      cursor: 0,
    })

    expect(firstPage.items).toHaveLength(2)
    expect(firstPage.hasMore).toBe(true)
    expect(firstPage.nextCursor).toBe(2)

    const secondPage = createGroupAuditHistoryView(projection, {
      pageSize: 2,
      cursor: firstPage.nextCursor,
    })

    expect(secondPage.items).toHaveLength(2)
    expect(secondPage.hasMore).toBe(false)
    expect(secondPage.nextCursor).toBe(4)
  })

  it("exposes stable filter defaults and aggregate filter options", () => {
    const projection = createProjection()

    expect(createDefaultGroupAuditFilter()).toEqual({
      action: "all",
      actor: "all",
    })

    const view = createGroupAuditHistoryView(projection, {
      actorPubkey: "a".repeat(64),
      pageSize: 10,
    })

    expect(view.actions[0]).toEqual({value: "all", label: "All actions", count: 4})
    expect(view.actors[0]).toEqual({value: "all", label: "All actors", count: 4})
    expect(view.actors.find(option => option.value === "self")?.count).toBe(1)
    expect(view.actors.find(option => option.value === "system")?.count).toBe(1)
  })
})
