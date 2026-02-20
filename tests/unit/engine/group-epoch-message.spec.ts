import {describe, expect, it} from "vitest"
import {GROUP_KINDS} from "../../../src/domain/group-kinds"
import {
  getGroupMessageEpochId,
  validateGroupMessageEpochForReceive,
  withGroupMessageEpochTag,
} from "../../../src/engine/group-epoch-message"

describe("engine/group-epoch-message", () => {
  it("attaches and resolves epoch tags on group message tags", () => {
    const tags = withGroupMessageEpochTag({
      tags: [["h", "ops"]],
      epochId: "epoch:ops:1:100",
    })

    expect(getGroupMessageEpochId({tags} as any)).toBe("epoch:ops:1:100")
  })

  it("replaces existing epoch tag with current epoch", () => {
    const tags = withGroupMessageEpochTag({
      tags: [
        ["h", "ops"],
        ["epoch", "epoch:ops:1:100"],
      ],
      epochId: "epoch:ops:2:200",
    })

    expect(tags.filter(tag => tag[0] === "epoch")).toHaveLength(1)
    expect(getGroupMessageEpochId({tags} as any)).toBe("epoch:ops:2:200")
  })

  it("returns validation failure for missing epoch tags", () => {
    const result = validateGroupMessageEpochForReceive({
      event: {
        id: "event-1",
        kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
        tags: [["h", "ops"]],
      } as any,
      expectedEpochId: "epoch:ops:1:100",
    })

    expect(result).toMatchObject({
      ok: false,
      reason: "GROUP_EPOCH_MISSING",
      eventId: "event-1",
    })
  })

  it("returns validation failure for mismatched epoch tags", () => {
    const result = validateGroupMessageEpochForReceive({
      event: {
        id: "event-2",
        kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
        tags: [
          ["h", "ops"],
          ["epoch", "epoch:ops:1:100"],
        ],
      } as any,
      expectedEpochId: "epoch:ops:2:200",
    })

    expect(result).toMatchObject({
      ok: false,
      reason: "GROUP_EPOCH_MISMATCH",
      eventId: "event-2",
    })
  })

  it("passes validation for matching epoch tags", () => {
    const result = validateGroupMessageEpochForReceive({
      event: {
        id: "event-3",
        kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
        tags: [
          ["h", "ops"],
          ["epoch", "epoch:ops:2:200"],
        ],
      } as any,
      expectedEpochId: "epoch:ops:2:200",
    })

    expect(result).toEqual({ok: true})
  })
})
