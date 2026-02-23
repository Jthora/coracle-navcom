import {describe, expect, it} from "vitest"
import {resolveRequestedTransportMode} from "src/app/groups/transport-mode"

describe("app/groups transport-mode", () => {
  it("maps guided create privacy to requested transport mode", () => {
    expect(resolveRequestedTransportMode({flow: "create", privacy: "secure"})).toEqual({
      requestedMode: "secure-nip-ee",
      source: "guided-privacy",
    })

    expect(resolveRequestedTransportMode({flow: "create", privacy: "basic"})).toEqual({
      requestedMode: "baseline-nip29",
      source: "guided-privacy",
    })

    expect(resolveRequestedTransportMode({flow: "create", privacy: "auto"})).toEqual({
      requestedMode: "baseline-nip29",
      source: "guided-privacy",
    })

    expect(resolveRequestedTransportMode({flow: "create", privacy: "max"})).toEqual({
      requestedMode: "secure-nip-ee",
      source: "guided-privacy",
    })
  })

  it("prefers invite transport mode for join flow when valid", () => {
    expect(
      resolveRequestedTransportMode({
        flow: "join",
        privacy: "basic",
        invitePreferredMode: "secure-nip-ee",
      }),
    ).toEqual({
      requestedMode: "secure-nip-ee",
      source: "invite",
    })

    expect(
      resolveRequestedTransportMode({
        flow: "join",
        privacy: "secure",
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
