import {describe, expect, it} from "vitest"
import {GROUP_CONTRACT_REASON, validateGroupContractEvent} from "src/domain/group-contracts"
import {GROUP_KINDS} from "src/domain/group-kinds"

const baseEvent = {
  id: "evt-contract",
  pubkey: "a".repeat(64),
  created_at: 100,
  content: "",
  sig: "b".repeat(128),
}

describe("group-contracts", () => {
  it("accepts valid metadata event", () => {
    const result = validateGroupContractEvent({
      ...baseEvent,
      kind: GROUP_KINDS.NIP29.METADATA,
      tags: [["d", "ops"]],
    } as any)

    expect(result.ok).toBe(true)
  })

  it("rejects unknown kind", () => {
    const result = validateGroupContractEvent({
      ...baseEvent,
      kind: 1,
      tags: [["d", "ops"]],
    } as any)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.diagnostic.reason).toBe(GROUP_CONTRACT_REASON.UNKNOWN_KIND)
    }
  })

  it("rejects membership event without p tag", () => {
    const result = validateGroupContractEvent({
      ...baseEvent,
      kind: GROUP_KINDS.NIP29.PUT_USER,
      tags: [["h", "ops"]],
    } as any)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.diagnostic.reason).toBe(GROUP_CONTRACT_REASON.MISSING_MEMBER_TAG)
    }
  })
})
