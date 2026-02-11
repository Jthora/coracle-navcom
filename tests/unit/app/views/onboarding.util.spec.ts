import {describe, it, expect} from "vitest"
import {uniqueRelays} from "src/app/views/onboarding/util"

describe("uniqueRelays", () => {
  it("dedupes relays case-insensitively and preserves order", () => {
    const input = [
      ["r", "wss://one"],
      ["r", "wss://TWO"],
      ["r", "wss://two"],
      ["r", "wss://three"],
      ["r", "wss://ONE"],
    ]

    const result = uniqueRelays(input)

    expect(result).toEqual([
      ["r", "wss://one"],
      ["r", "wss://TWO"],
      ["r", "wss://three"],
    ])
  })
})
