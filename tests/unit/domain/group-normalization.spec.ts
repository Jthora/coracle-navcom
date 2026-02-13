import {describe, expect, it} from "vitest"
import {normalizeGroupEvent, normalizeGroupTags} from "src/domain/group-normalization"

describe("group-normalization", () => {
  it("normalizes keys and values and removes duplicate tags", () => {
    const tags = normalizeGroupTags([
      [" H ", " ops "],
      ["h", "ops"],
      ["P", " abc "],
    ])

    expect(tags).toEqual([
      ["h", "ops"],
      ["p", "abc"],
    ])
  })

  it("sorts tags deterministically", () => {
    const tags = normalizeGroupTags([
      ["p", "b"],
      ["h", "ops"],
      ["p", "a"],
    ])

    expect(tags).toEqual([
      ["h", "ops"],
      ["p", "a"],
      ["p", "b"],
    ])
  })

  it("normalizes event tags without mutating metadata", () => {
    const event: any = {
      id: "evt-norm",
      pubkey: "a".repeat(64),
      created_at: 100,
      kind: 39000,
      content: "",
      sig: "b".repeat(128),
      tags: [
        ["D", "ops"],
        [" name ", " Ops Team "],
      ],
    }

    const normalized = normalizeGroupEvent(event)

    expect(normalized.id).toBe(event.id)
    expect(normalized.tags).toEqual([
      ["d", "ops"],
      ["name", "Ops Team"],
    ])
  })
})
