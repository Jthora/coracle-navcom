import {beforeEach, describe, expect, it, vi} from "vitest"

const {dispatchGroupTransportAction, dispatchGroupTransportMessage} = vi.hoisted(() => ({
  dispatchGroupTransportAction: vi.fn(),
  dispatchGroupTransportMessage: vi.fn(),
}))

vi.mock("src/engine/group-transport", () => ({
  dispatchGroupTransportAction,
  dispatchGroupTransportMessage,
}))

vi.mock("@welshman/app", () => ({
  pubkey: {
    get: () => "self-pubkey",
  },
}))

import {
  publishGroupCreate,
  publishGroupCreateWithRecovery,
  publishGroupJoin,
  publishGroupLeave,
  publishGroupMetadataEdit,
  publishGroupPutMember,
  publishGroupRemoveMember,
} from "../../../src/engine/group-commands"

describe("engine/group-commands contract matrix", () => {
  beforeEach(() => {
    dispatchGroupTransportAction.mockReset()
    dispatchGroupTransportMessage.mockReset()
  })

  it("blocks restricted actions when actor role lacks permission", async () => {
    await expect(publishGroupCreate({groupId: "ops"}, "member")).rejects.toThrow(
      "Permission denied for action: create",
    )

    await expect(
      publishGroupPutMember({groupId: "ops", memberPubkey: "target"}, "member"),
    ).rejects.toThrow("Permission denied for action: put-member")

    await expect(
      publishGroupRemoveMember({groupId: "ops", memberPubkey: "target"}, "member"),
    ).rejects.toThrow("Permission denied for action: remove-member")

    await expect(publishGroupMetadataEdit({groupId: "ops"}, "member")).rejects.toThrow(
      "Permission denied for action: edit-metadata",
    )

    expect(dispatchGroupTransportAction).not.toHaveBeenCalled()
  })

  it("dispatches join with default member pubkey for member role", async () => {
    dispatchGroupTransportAction.mockResolvedValueOnce({relays: ["wss://relay-a"]})

    await publishGroupJoin({groupId: "ops"}, "member")

    expect(dispatchGroupTransportAction).toHaveBeenCalledWith(
      "join",
      expect.objectContaining({groupId: "ops", memberPubkey: "self-pubkey"}),
      expect.objectContaining({actorRole: "member"}),
    )
  })

  it("dispatches leave with default member pubkey for member role", async () => {
    dispatchGroupTransportAction.mockResolvedValueOnce({relays: ["wss://relay-a"]})

    await publishGroupLeave({groupId: "ops"}, "member")

    expect(dispatchGroupTransportAction).toHaveBeenCalledWith(
      "leave",
      expect.objectContaining({groupId: "ops", memberPubkey: "self-pubkey"}),
      expect.objectContaining({actorRole: "member"}),
    )
  })

  it("retries retryable create failures and returns normalized ack on recovery", async () => {
    dispatchGroupTransportAction
      .mockRejectedValueOnce(new Error("Relay publish failed"))
      .mockResolvedValueOnce({relays: ["wss://relay-a"]})

    const result = await publishGroupCreateWithRecovery({groupId: "ops"}, "admin", 1)

    expect(dispatchGroupTransportAction).toHaveBeenCalledTimes(2)
    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.ack.ok).toBe(true)
      expect(result.ack.ackCount).toBe(1)
    }
  })

  it("does not retry non-retryable mapped failures", async () => {
    dispatchGroupTransportAction.mockRejectedValueOnce(
      new Error("Permission denied by relay policy"),
    )

    const result = await publishGroupCreateWithRecovery({groupId: "ops"}, "admin", 3)

    expect(dispatchGroupTransportAction).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.reason).toBe("GROUP_COMMAND_PERMISSION_DENIED")
      expect(result.retryable).toBe(false)
    }
  })
})
