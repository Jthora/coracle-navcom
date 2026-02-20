import {describe, expect, it} from "vitest"
import {
  clearSecureGroupEpochState,
  ensureSecureGroupEpochState,
} from "../../../src/engine/group-epoch-state"
import {repairSecureGroupEpochStateFromEvents} from "../../../src/engine/group-epoch-reconcile"
import {GROUP_KINDS} from "../../../src/domain/group-kinds"

describe("engine/group-epoch-reconcile", () => {
  it("keeps current state when no higher received epoch exists", () => {
    clearSecureGroupEpochState("ops")
    const current = ensureSecureGroupEpochState("ops", {at: 1739836800})

    const repaired = repairSecureGroupEpochStateFromEvents({
      groupId: "ops",
      currentState: current,
      events: [],
    })

    expect(repaired.repaired).toBe(false)
    expect(repaired.state.epochId).toBe(current.epochId)
  })

  it("advances state to match highest received epoch sequence", () => {
    clearSecureGroupEpochState("ops")
    const current = ensureSecureGroupEpochState("ops", {at: 1739836800})

    const repaired = repairSecureGroupEpochStateFromEvents({
      groupId: "ops",
      currentState: current,
      events: [
        {
          kind: GROUP_KINDS.NIP_EE.GROUP_EVENT,
          tags: [
            ["h", "ops"],
            ["epoch", "epoch:ops:3:1739836802"],
          ],
        },
      ],
    })

    expect(repaired.repaired).toBe(true)
    expect(repaired.state.sequence).toBe(3)
    expect(repaired.state.epochId).toBe("epoch:ops:3:1739836802")
  })
})
