import {describe, expect, it} from "vitest"
import {
  buildInviteQueryParams,
  createDefaultInviteGroupDraft,
  getGroupInviteHints,
  toGroupInvitePayload,
} from "src/app/invite/create"

describe("app/invite create helpers", () => {
  it("creates stable default group invite draft", () => {
    expect(createDefaultInviteGroupDraft("relay.example'ops")).toEqual({
      groupId: "relay.example'ops",
      preferredMode: "baseline-nip29",
      missionTier: 0,
      label: "",
    })
  })

  it("builds mode/tier hint copy", () => {
    const hints = getGroupInviteHints({
      groupId: "relay.example'ops",
      preferredMode: "secure-nip-ee",
      missionTier: 2,
      label: "Ops",
    })

    expect(hints[0]).toContain("Secure NIP-EE")
    expect(hints[1]).toContain("Tier 2")
  })

  it("parses draft into canonical invite payload", () => {
    const payload = toGroupInvitePayload({
      groupId: "Relay.EXAMPLE'OPS",
      preferredMode: "secure-nip-ee",
      missionTier: 2,
      label: "Ops",
    })

    expect(payload).toEqual({
      groupId: "relay.example'ops",
      preferredMode: "secure-nip-ee",
      missionTier: 2,
      label: "Ops",
    })
  })

  it("builds invite query params with encoded group payload", () => {
    const params = buildInviteQueryParams({
      people: ["a".repeat(64)],
      relays: [{url: "wss://relay.example", claim: "token"}],
      group: {
        groupId: "relay.example'ops",
        preferredMode: "baseline-nip29",
        missionTier: 1,
        label: "Ops",
      },
    })

    expect(params.get("people")).toBe("a".repeat(64))
    expect(params.get("relays")).toBe("wss://relay.example|token")
    expect(params.get("groups")).toBe("relay.example'ops|baseline-nip29|1|Ops")
  })

  it("omits groups parameter when draft is invalid", () => {
    const params = buildInviteQueryParams({
      people: [],
      relays: [],
      group: {
        groupId: "bad address",
        preferredMode: "baseline-nip29",
        missionTier: 0,
        label: "",
      },
    })

    expect(params.get("groups")).toBe(null)
  })
})
