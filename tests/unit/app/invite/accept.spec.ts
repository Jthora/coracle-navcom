import {describe, expect, it} from "vitest"
import {
  buildGroupChatPath,
  buildGroupJoinPrefillPath,
  getGroupInviteEntryMeta,
  resolveGroupInviteDestinationPath,
  resolveAutoJoinGroupInvite,
  resolveGroupInviteAcceptPayloads,
} from "src/app/invite/accept"

describe("app/invite accept helpers", () => {
  it("resolves valid invite groups and counts invalid entries", () => {
    const resolution = resolveGroupInviteAcceptPayloads([
      {
        groupId: "Relay.EXAMPLE'OPS",
        preferredMode: "secure-nip-ee",
        missionTier: 2,
        label: "Ops",
      },
      {
        groupId: "invalid group id",
      },
      null,
    ])

    expect(resolution.groups).toEqual([
      {
        groupId: "relay.example'ops",
        preferredMode: "secure-nip-ee",
        missionTier: 2,
        label: "Ops",
      },
    ])
    expect(resolution.invalidCount).toBe(2)
  })

  it("deduplicates repeated group entries by canonical group id", () => {
    const resolution = resolveGroupInviteAcceptPayloads([
      {groupId: "relay.example'ops"},
      {groupId: "Relay.Example'Ops", preferredMode: "baseline-nip29"},
    ])

    expect(resolution.groups).toHaveLength(1)
    expect(resolution.groups[0].groupId).toBe("relay.example'ops")
  })

  it("builds prefilled join route path", () => {
    const href = buildGroupJoinPrefillPath({
      groupId: "relay.example'ops",
      preferredMode: "secure-nip-ee",
      missionTier: 2,
      label: "Ops Team",
    })

    expect(href).toBe(
      "/groups/create?groupId=relay.example%27ops&preferredMode=secure-nip-ee&missionTier=2&label=Ops+Team",
    )
  })

  it("builds group chat route path", () => {
    expect(buildGroupChatPath("relay.example'ops")).toBe("/groups/relay.example'ops/chat")
  })

  it("resolves invite destination to chat when active membership exists", () => {
    expect(
      resolveGroupInviteDestinationPath({
        group: {groupId: "relay.example'ops"},
        hasActiveMembership: true,
      }),
    ).toBe("/groups/relay.example'ops/chat")
  })

  it("resolves invite destination to join flow when membership is not active", () => {
    expect(
      resolveGroupInviteDestinationPath({
        group: {groupId: "relay.example'ops", preferredMode: "baseline-nip29", missionTier: 1},
        hasActiveMembership: false,
      }),
    ).toBe("/groups/create?groupId=relay.example%27ops&preferredMode=baseline-nip29&missionTier=1")
  })

  it("returns formatted metadata line for invite entry", () => {
    expect(
      getGroupInviteEntryMeta({
        groupId: "relay.example'ops",
        preferredMode: "baseline-nip29",
        missionTier: 1,
      }),
    ).toBe("baseline-nip29 · tier 1")
  })

  it("resolves auto-join target for single valid group-only invite", () => {
    const target = resolveAutoJoinGroupInvite({
      hasSession: true,
      groups: [{groupId: "relay.example'ops"}],
      invalidCount: 0,
      peopleCount: 0,
      relayCount: 0,
    })

    expect(target).toEqual({groupId: "relay.example'ops"})
  })

  it("does not auto-join when invite has people/relays/invalid entries or no session", () => {
    expect(
      resolveAutoJoinGroupInvite({
        hasSession: false,
        groups: [{groupId: "relay.example'ops"}],
        invalidCount: 0,
      }),
    ).toBeNull()

    expect(
      resolveAutoJoinGroupInvite({
        hasSession: true,
        groups: [{groupId: "relay.example'ops"}],
        invalidCount: 1,
      }),
    ).toBeNull()

    expect(
      resolveAutoJoinGroupInvite({
        hasSession: true,
        groups: [{groupId: "relay.example'ops"}],
        invalidCount: 0,
        peopleCount: 1,
      }),
    ).toBeNull()

    expect(
      resolveAutoJoinGroupInvite({
        hasSession: true,
        groups: [{groupId: "relay.example'ops"}],
        invalidCount: 0,
        relayCount: 1,
      }),
    ).toBeNull()
  })
})
