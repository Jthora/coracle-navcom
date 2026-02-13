import {describe, expect, it} from "vitest"
import {
  applyGroupEvent,
  buildGroupProjection,
  createProjectionCheckpoint,
  createProjectionFromEvent,
  GROUP_PROJECTION_STALE_AFTER_SECONDS,
  isGroupProjectionStale,
  recoverStaleProjection,
  restoreProjectionCheckpoint,
} from "src/domain/group-projection"
import {GROUP_KINDS} from "src/domain/group-kinds"

const baseEvent = {
  id: "evt-1",
  pubkey: "a".repeat(64),
  created_at: 100,
  content: "",
  sig: "b".repeat(128),
}

describe("group-projection", () => {
  it("creates projection from metadata event", () => {
    const projection = createProjectionFromEvent({
      ...baseEvent,
      kind: GROUP_KINDS.NIP29.METADATA,
      tags: [
        ["d", "ops"],
        ["name", "Ops Team"],
      ],
    } as any)

    expect(projection?.group.id).toBe("ops")
    expect(projection?.group.protocol).toBe("nip29")
  })

  it("applies metadata and membership updates", () => {
    const projection = createProjectionFromEvent({
      ...baseEvent,
      kind: GROUP_KINDS.NIP29.METADATA,
      tags: [["d", "ops"]],
    } as any)

    expect(projection).toBeDefined()

    applyGroupEvent(projection!, {
      ...baseEvent,
      id: "evt-2",
      kind: GROUP_KINDS.NIP29.METADATA,
      created_at: 110,
      tags: [
        ["d", "ops"],
        ["name", "Ops Team"],
        ["about", "coordination"],
      ],
    } as any)

    expect(projection?.group.title).toBe("Ops Team")
    expect(projection?.group.description).toBe("coordination")

    applyGroupEvent(projection!, {
      ...baseEvent,
      id: "evt-3",
      kind: GROUP_KINDS.NIP29.PUT_USER,
      created_at: 120,
      tags: [
        ["h", "ops"],
        ["p", "c".repeat(64)],
        ["role", "admin"],
      ],
    } as any)

    expect(projection?.members["c".repeat(64)]?.role).toBe("admin")
    expect(projection?.members["c".repeat(64)]?.status).toBe("active")
  })

  it("records moderation audit entries", () => {
    const projection = createProjectionFromEvent({
      ...baseEvent,
      kind: GROUP_KINDS.NIP29.METADATA,
      tags: [["d", "ops"]],
    } as any)

    applyGroupEvent(projection!, {
      ...baseEvent,
      id: "evt-4",
      kind: GROUP_KINDS.NIP29.DELETE_EVENT,
      created_at: 130,
      tags: [["h", "ops"]],
      content: "remove spam",
    } as any)

    expect(projection?.audit).toHaveLength(1)
    expect(projection?.audit[0].action).toBe(`kind:${GROUP_KINDS.NIP29.DELETE_EVENT}`)
    expect(projection?.audit[0].reason).toBe("remove spam")
  })

  it("builds projections map by group id", () => {
    const projections = buildGroupProjection([
      {
        ...baseEvent,
        id: "evt-5",
        kind: GROUP_KINDS.NIP29.METADATA,
        tags: [
          ["d", "ops"],
          ["name", "Ops"],
        ],
      } as any,
      {
        ...baseEvent,
        id: "evt-6",
        kind: GROUP_KINDS.NIP29.METADATA,
        tags: [
          ["d", "intel"],
          ["name", "Intel"],
        ],
      } as any,
    ])

    expect(projections.get("ops")?.group.title).toBe("Ops")
    expect(projections.get("intel")?.group.title).toBe("Intel")
  })

  it("serializes and restores projection checkpoints", () => {
    const projection = createProjectionFromEvent({
      ...baseEvent,
      kind: GROUP_KINDS.NIP29.METADATA,
      tags: [
        ["d", "ops"],
        ["name", "Ops Team"],
      ],
    } as any)

    expect(projection).toBeDefined()

    const checkpoint = createProjectionCheckpoint(projection!, 200)
    const restored = restoreProjectionCheckpoint(checkpoint)

    expect(checkpoint.version).toBe(1)
    expect(checkpoint.savedAt).toBe(200)
    expect(restored?.group.id).toBe("ops")
  })

  it("returns null on corrupted checkpoints", () => {
    expect(restoreProjectionCheckpoint({version: 999})).toBeNull()
    expect(restoreProjectionCheckpoint({version: 1, group: null})).toBeNull()
  })

  it("detects stale projections and recovers when restoring checkpoint", () => {
    const projection = createProjectionFromEvent({
      ...baseEvent,
      kind: GROUP_KINDS.NIP29.METADATA,
      created_at: 10,
      tags: [["d", "ops"]],
    } as any)

    expect(projection).toBeDefined()

    const checkpoint = createProjectionCheckpoint(projection!, 20)
    const now = 20 + GROUP_PROJECTION_STALE_AFTER_SECONDS + 1

    const restored = restoreProjectionCheckpoint(checkpoint, {now})

    expect(restored?.group.updatedAt).toBe(now)
    expect(restored?.members).toEqual({})
    expect(restored?.audit[0]?.action).toBe("recovery:stale-checkpoint")
  })

  it("returns null for stale checkpoints when recovery disabled", () => {
    const projection = createProjectionFromEvent({
      ...baseEvent,
      kind: GROUP_KINDS.NIP29.METADATA,
      created_at: 10,
      tags: [["d", "ops"]],
    } as any)

    const checkpoint = createProjectionCheckpoint(projection!, 20)
    const now = 20 + GROUP_PROJECTION_STALE_AFTER_SECONDS + 1

    expect(restoreProjectionCheckpoint(checkpoint, {now, recoverStale: false})).toBeNull()
  })

  it("supports stale helper utilities", () => {
    const projection = createProjectionFromEvent({
      ...baseEvent,
      kind: GROUP_KINDS.NIP29.METADATA,
      created_at: 100,
      tags: [["d", "ops"]],
    } as any)

    expect(
      isGroupProjectionStale(projection!, 100 + GROUP_PROJECTION_STALE_AFTER_SECONDS + 1),
    ).toBe(true)

    const recovered = recoverStaleProjection(projection!, 500)

    expect(recovered.group.updatedAt).toBe(500)
    expect(recovered.audit[0].action).toBe("recovery:stale-checkpoint")
  })

  it("ignores duplicate events for idempotent projection updates", () => {
    const projection = createProjectionFromEvent({
      ...baseEvent,
      id: "evt-idem-1",
      kind: GROUP_KINDS.NIP29.METADATA,
      tags: [["d", "ops"]],
    } as any)

    const event = {
      ...baseEvent,
      id: "evt-idem-2",
      kind: GROUP_KINDS.NIP29.DELETE_EVENT,
      created_at: 150,
      tags: [["h", "ops"]],
      content: "remove spam",
    } as any

    applyGroupEvent(projection!, event)
    applyGroupEvent(projection!, event)

    expect(projection?.audit).toHaveLength(1)
    expect(projection?.sourceEvents.filter(e => e.id === "evt-idem-2")).toHaveLength(1)
  })

  it("keeps newer membership state during role conflicts", () => {
    const projection = createProjectionFromEvent({
      ...baseEvent,
      id: "evt-role-1",
      kind: GROUP_KINDS.NIP29.METADATA,
      tags: [["d", "ops"]],
    } as any)

    const member = "c".repeat(64)

    applyGroupEvent(projection!, {
      ...baseEvent,
      id: "evt-role-2",
      kind: GROUP_KINDS.NIP29.PUT_USER,
      created_at: 200,
      tags: [
        ["h", "ops"],
        ["p", member],
        ["role", "admin"],
      ],
    } as any)

    applyGroupEvent(projection!, {
      ...baseEvent,
      id: "evt-role-3",
      kind: GROUP_KINDS.NIP29.PUT_USER,
      created_at: 190,
      tags: [
        ["h", "ops"],
        ["p", member],
        ["role", "member"],
      ],
    } as any)

    expect(projection?.members[member].role).toBe("admin")
    expect(projection?.members[member].updatedAt).toBe(200)
  })
})
