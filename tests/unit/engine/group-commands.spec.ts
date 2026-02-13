import {describe, expect, it} from "vitest"
import {getGroupCreateRecoveryMessage} from "src/engine/group-commands"

describe("engine/group-commands", () => {
  it("formats success messages with acknowledgements", () => {
    const message = getGroupCreateRecoveryMessage({
      ok: true,
      ack: {
        ok: true,
        ackCount: 2,
        relayCount: 2,
        ackedRelays: ["wss://a", "wss://b"],
      },
      value: {},
    })

    expect(message).toBe("Group created with 2 relay acknowledgements.")
  })

  it("formats fallback success when acks are pending", () => {
    const message = getGroupCreateRecoveryMessage({
      ok: true,
      ack: {
        ok: false,
        ackCount: 0,
        relayCount: 0,
        ackedRelays: [],
      },
      value: {},
    })

    expect(message).toBe("Group created, awaiting relay acknowledgements.")
  })

  it("formats deterministic error messages", () => {
    const message = getGroupCreateRecoveryMessage({
      ok: false,
      reason: "GROUP_COMMAND_PUBLISH_FAILED",
      message: "Relay publish failed",
      retryable: true,
    })

    expect(message).toBe("Failed to publish to relays. Retry when relay health improves.")
  })
})
