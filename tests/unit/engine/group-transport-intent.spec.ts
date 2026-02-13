import {describe, expect, it} from "vitest"
import {
  createGroupTransportIntent,
  GROUP_TRANSPORT_INTENT_REASON,
  validateGroupTransportIntent,
} from "src/engine/group-transport-intent"

describe("engine/group-transport-intent", () => {
  it("creates canonical transport intent payload", () => {
    const intent = createGroupTransportIntent(
      "create",
      {groupId: "relay.example'ops", title: "Ops"},
      {actorRole: "admin", requestedMode: "baseline-nip29", now: 100},
    )

    expect(intent).toEqual({
      action: "create",
      payload: {groupId: "relay.example'ops", title: "Ops"},
      actorRole: "admin",
      requestedMode: "baseline-nip29",
      createdAt: 100,
    })
  })

  it("rejects intents missing group id", () => {
    const result = validateGroupTransportIntent(
      createGroupTransportIntent("join", {groupId: ""}, {actorRole: "member", now: 100}),
    )

    expect(result).toEqual({
      ok: false,
      reason: GROUP_TRANSPORT_INTENT_REASON.INVALID_GROUP_ID,
      message: "Group transport intent requires a non-empty group ID.",
    })
  })

  it("rejects invalid member pubkey when action requires member target", () => {
    const result = validateGroupTransportIntent(
      createGroupTransportIntent(
        "put-member",
        {groupId: "ops", memberPubkey: "not-a-pubkey"},
        {actorRole: "admin", now: 100},
      ),
    )

    expect(result).toEqual({
      ok: false,
      reason: GROUP_TRANSPORT_INTENT_REASON.INVALID_MEMBER_PUBKEY,
      message: "Member pubkey must be a valid 64-char hex string.",
    })
  })
})
