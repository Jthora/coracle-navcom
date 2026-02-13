import {beforeEach, describe, expect, it} from "vitest"
import {
  buildSecureSubscribeFilters,
  parseSecureGroupSendInput,
  parseSecureGroupSubscribeInput,
  reconcileSecureGroupEvents,
} from "../../../src/engine/group-transport-secure-ops"
import {
  getSecureGroupKeyState,
  resetSecureGroupKeyLifecycle,
} from "../../../src/engine/group-key-lifecycle"

describe("engine/group-transport-secure-ops", () => {
  beforeEach(() => {
    resetSecureGroupKeyLifecycle()
  })

  it("parses secure send input deterministically", () => {
    expect(
      parseSecureGroupSendInput({
        groupId: "ops",
        content: "hello",
        recipients: ["a".repeat(64)],
        delay: 3,
      }),
    ).toEqual({
      groupId: "ops",
      content: "hello",
      recipients: ["a".repeat(64)],
      delay: 3,
    })

    expect(parseSecureGroupSendInput({groupId: "", content: "", recipients: []})).toBeNull()
  })

  it("parses subscribe input and builds filters", () => {
    expect(
      parseSecureGroupSubscribeInput({groupId: "ops", cursor: 100, relays: ["wss://r"]}),
    ).toEqual({
      groupId: "ops",
      cursor: 100,
      relays: ["wss://r"],
    })

    expect(buildSecureSubscribeFilters({groupId: "ops", cursor: 100})[0]).toMatchObject({
      "#h": ["ops"],
      since: 100,
    })
  })

  it("reconciles secure events into projection and validates mismatches", async () => {
    const projection = {
      group: {id: "ops"},
      members: {},
      audit: [],
      sourceEvents: [],
    }

    const invalid = await reconcileSecureGroupEvents({
      groupId: "intel",
      remoteEvents: [],
      localState: projection,
    })

    expect(invalid).toMatchObject({
      ok: false,
      code: "GROUP_TRANSPORT_VALIDATION_FAILED",
    })

    const valid = await reconcileSecureGroupEvents({
      groupId: "ops",
      remoteEvents: [],
      localState: projection,
    })

    expect(valid.ok).toBe(true)
    expect(getSecureGroupKeyState("ops")?.useCount).toBe(1)
    expect(getSecureGroupKeyState("ops")?.usageByAction.reconcile).toBe(1)
  })
})
