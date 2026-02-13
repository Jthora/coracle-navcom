import {describe, expect, it} from "vitest"
import {
  GROUP_COMMAND_REASON,
  mapGroupCommandError,
  normalizeGroupCommandAck,
  toGroupCommandUiMessage,
  withGroupCommandRetry,
} from "src/domain/group-command-feedback"

describe("group-command-feedback", () => {
  it("normalizes command ack payloads", () => {
    const ack = normalizeGroupCommandAck({publishedTo: ["wss://a", "wss://b"]})

    expect(ack.ok).toBe(true)
    expect(ack.ackCount).toBe(2)
  })

  it("maps permission and publish errors to deterministic reasons", () => {
    const denied = mapGroupCommandError(new Error("Permission denied for action"))
    const publish = mapGroupCommandError(new Error("Relay publish failed"))
    const capability = mapGroupCommandError(
      new Error("Capability gate blocked requested mode 'secure-nip-ee': unavailable"),
    )
    const policy = mapGroupCommandError(
      new Error("Tier policy blocked: Tier 1 secure downgrade requires explicit confirmation."),
    )

    expect(denied.ok).toBe(false)
    if (!denied.ok) {
      expect(denied.reason).toBe(GROUP_COMMAND_REASON.PERMISSION_DENIED)
      expect(denied.retryable).toBe(false)
    }

    expect(publish.ok).toBe(false)
    if (!publish.ok) {
      expect(publish.reason).toBe(GROUP_COMMAND_REASON.PUBLISH_FAILED)
      expect(publish.retryable).toBe(true)
    }

    expect(capability.ok).toBe(false)
    if (!capability.ok) {
      expect(capability.reason).toBe(GROUP_COMMAND_REASON.CAPABILITY_BLOCKED)
      expect(capability.retryable).toBe(false)
    }

    expect(policy.ok).toBe(false)
    if (!policy.ok) {
      expect(policy.reason).toBe(GROUP_COMMAND_REASON.POLICY_BLOCKED)
      expect(policy.retryable).toBe(false)
    }
  })

  it("maps reasons to UI text", () => {
    expect(toGroupCommandUiMessage(GROUP_COMMAND_REASON.INVALID_INPUT)).toBe(
      "Group input is invalid. Review fields and try again.",
    )
  })

  it("retries retryable outcomes", async () => {
    let attempts = 0

    const result = await withGroupCommandRetry(async () => {
      attempts += 1

      if (attempts < 2) {
        return {
          ok: false as const,
          reason: GROUP_COMMAND_REASON.PUBLISH_FAILED,
          message: "Relay publish failed",
          retryable: true,
        }
      }

      return {
        ok: true as const,
        ack: {ok: true, ackCount: 1, relayCount: 1, ackedRelays: ["wss://relay"]},
        value: {eventId: "evt-1"},
      }
    }, 2)

    expect(result.ok).toBe(true)
    expect(attempts).toBe(2)
  })
})
