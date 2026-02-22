import {describe, expect, it} from "vitest"
import {resolveRequestedTransportMode} from "src/app/groups/transport-mode"

describe("app/groups transport-mode", () => {
  it("maps guided create privacy to requested transport mode", () => {
    expect(resolveRequestedTransportMode({flow: "create", privacy: "private"})).toEqual({
      requestedMode: "secure-nip-ee",
      source: "guided-privacy",
    })

    expect(resolveRequestedTransportMode({flow: "create", privacy: "standard"})).toEqual({
      requestedMode: "baseline-nip29",
      source: "guided-privacy",
    })

    expect(resolveRequestedTransportMode({flow: "create", privacy: "fallback-friendly"})).toEqual({
      requestedMode: "baseline-nip29",
      source: "guided-privacy",
    })
  })

  it("prefers invite transport mode for join flow when valid", () => {
    expect(
      resolveRequestedTransportMode({
        flow: "join",
        privacy: "standard",
        invitePreferredMode: "secure-nip-ee",
      }),
    ).toEqual({
      requestedMode: "secure-nip-ee",
      source: "invite",
    })

    expect(
      resolveRequestedTransportMode({
        flow: "join",
        privacy: "private",
        invitePreferredMode: "baseline-nip29",
      }),
    ).toEqual({
      requestedMode: "baseline-nip29",
      source: "invite",
    })
  })

  it("falls back to default baseline mode when join invite mode is absent/invalid", () => {
    expect(resolveRequestedTransportMode({flow: "join", invitePreferredMode: ""})).toEqual({
      requestedMode: "baseline-nip29",
      source: "default",
    })

    expect(
      resolveRequestedTransportMode({
        flow: "join",
        invitePreferredMode: "invalid-mode",
      }),
    ).toEqual({
      requestedMode: "baseline-nip29",
      source: "default",
    })
  })
})
