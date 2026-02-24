import {describe, expect, it} from "vitest"
import {
  evaluateMaxPreconditions,
  toMaxPreconditionBlockMessage,
} from "src/app/groups/max-preconditions"

describe("app/groups max-preconditions", () => {
  it("does not block when nip104 + secure signal is missing", () => {
    const reason = evaluateMaxPreconditions({
      relayChecks: [
        {
          relay: "wss://relay.example",
          status: "ready",
          supportsGroups: true,
          supportsNipEeSignal: true,
          supportsNip104: false,
          authRequired: false,
          challengeResponseAuth: false,
          details: "ok",
        },
      ],
    })

    expect(reason).toBeNull()
  })

  it("does not require navcom default relay inclusion", () => {
    const reason = evaluateMaxPreconditions({
      relayChecks: [
        {
          relay: "wss://relay.example",
          status: "ready",
          supportsGroups: true,
          supportsNipEeSignal: true,
          supportsNip104: true,
          supportsNavcomBaseline: true,
          isNavcomDefaultRelay: false,
          authRequired: false,
          challengeResponseAuth: false,
          details: "ok",
        },
      ],
    })

    expect(reason).toBeNull()
  })

  it("does not block mixed relay sets", () => {
    const reason = evaluateMaxPreconditions({
      relayChecks: [
        {
          relay: "wss://relay.navcom.app",
          status: "ready",
          supportsGroups: true,
          supportsNipEeSignal: true,
          supportsNip104: true,
          supportsNavcomBaseline: true,
          isNavcomDefaultRelay: true,
          authRequired: false,
          challengeResponseAuth: false,
          details: "ok",
        },
        {
          relay: "wss://relay.public.one",
          status: "ready",
          supportsGroups: true,
          supportsNipEeSignal: true,
          supportsNip104: true,
          supportsNavcomBaseline: true,
          isNavcomDefaultRelay: false,
          authRequired: false,
          challengeResponseAuth: false,
          details: "ok",
        },
      ],
    })

    expect(reason).toBeNull()
  })

  it("passes when navcom-only max prerequisites are satisfied", () => {
    const reason = evaluateMaxPreconditions({
      relayChecks: [
        {
          relay: "wss://relay.navcom.app",
          status: "ready",
          supportsGroups: true,
          supportsNipEeSignal: true,
          supportsNip104: true,
          supportsNavcomBaseline: true,
          isNavcomDefaultRelay: true,
          authRequired: false,
          challengeResponseAuth: false,
          details: "ok",
        },
      ],
    })

    expect(reason).toBeNull()
  })

  it("returns deterministic max block messages", () => {
    expect(toMaxPreconditionBlockMessage("MAX_REQUIRES_NAVCOM_DEFAULT_RELAY")).toContain(
      "relay.navcom.app",
    )
    expect(toMaxPreconditionBlockMessage("MAX_REQUIRES_NAVCOM_ONLY_RELAYS")).toContain(
      "Navcom-only",
    )
    expect(toMaxPreconditionBlockMessage("MAX_REQUIRES_NAVCOM_BASELINE_SIGNAL")).toContain(
      "Navcom baseline signals",
    )
  })
})
