import {describe, expect, it} from "vitest"
import {asInviteGroups} from "src/app/util/router"

describe("app/util router invite serializer", () => {
  it("decodes groups payload into structured entries", () => {
    const encoded = "relay.example'ops%7Csecure-nip-ee%7C2%7COps"
    const decoded = asInviteGroups.decode(encoded) as {groups: unknown[]}

    expect(decoded.groups).toEqual([
      {
        groupId: "relay.example'ops",
        preferredMode: "secure-nip-ee",
        missionTier: 2,
        label: "Ops",
      },
    ])
  })

  it("preserves backward compatibility with legacy csv addresses", () => {
    const decoded = asInviteGroups.decode("relay.one'ops,relay.two'coord") as {groups: unknown[]}

    expect(decoded.groups).toEqual([{groupId: "relay.one'ops"}, {groupId: "relay.two'coord"}])
  })
})
