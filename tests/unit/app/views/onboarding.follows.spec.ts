import {describe, it, expect} from "vitest"
import {uniqueFollowTags} from "src/app/views/onboarding/util"

const tagPubkey = (pk: string) => ["p", pk]

describe("uniqueFollowTags", () => {
  it("dedupes pubkeys case-insensitively and preserves order", () => {
    const input = ["npub1one", "npub1TWO", "npub1two", "npub1three", "NPUB1ONE"]

    const result = uniqueFollowTags(input, tagPubkey)

    expect(result).toEqual([
      ["p", "npub1one"],
      ["p", "npub1TWO"],
      ["p", "npub1three"],
    ])
  })
})
