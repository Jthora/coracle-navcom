import {describe, expect, it} from "vitest"
import {GROUP_KINDS} from "../../../src/domain/group-kinds"
import {createProjectionFromEvent} from "../../../src/domain/group-projection"
import {applyGroupTransportProjectionEvents} from "../../../src/engine/group-transport-projection"

const base = {
  pubkey: "a".repeat(64),
  content: "",
  sig: "b".repeat(128),
}

describe("engine/group-transport-projection", () => {
  it("applies sorted group control events into projection", () => {
    const projection = createProjectionFromEvent({
      ...base,
      id: "evt-1",
      kind: GROUP_KINDS.NIP29.METADATA,
      created_at: 100,
      tags: [["d", "ops"]],
    } as any)

    expect(projection).toBeDefined()

    const updated = applyGroupTransportProjectionEvents(projection!, [
      {
        ...base,
        id: "evt-3",
        kind: GROUP_KINDS.NIP29.REMOVE_USER,
        created_at: 120,
        tags: [
          ["h", "ops"],
          ["p", "c".repeat(64)],
        ],
      },
      {
        ...base,
        id: "evt-2",
        kind: GROUP_KINDS.NIP29.PUT_USER,
        created_at: 110,
        tags: [
          ["h", "ops"],
          ["p", "c".repeat(64)],
          ["role", "admin"],
        ],
      },
    ] as any)

    expect(updated.members["c".repeat(64)]?.status).toBe("removed")
    expect(updated.members["c".repeat(64)]?.role).toBe("member")
  })

  it("ignores events for different groups during integration", () => {
    const projection = createProjectionFromEvent({
      ...base,
      id: "evt-10",
      kind: GROUP_KINDS.NIP29.METADATA,
      created_at: 100,
      tags: [["d", "ops"]],
    } as any)

    const updated = applyGroupTransportProjectionEvents(projection!, [
      {
        ...base,
        id: "evt-11",
        kind: GROUP_KINDS.NIP29.PUT_USER,
        created_at: 110,
        tags: [
          ["h", "intel"],
          ["p", "d".repeat(64)],
        ],
      },
    ] as any)

    expect(updated.members["d".repeat(64)]).toBeUndefined()
  })
})
