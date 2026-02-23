import {describe, expect, it, vi} from "vitest"
import {AuthStatus} from "@welshman/net"
import {
  attemptRelayChallengeAuth,
  checkRelayCapabilities,
  clearRelayCapabilityCache,
  evaluateRelayCapabilityFromInfo,
  getRelayAuthConfirmedMap,
  hasViableRelayPath,
  refreshRelayAuthSessions,
} from "src/app/groups/relay-capability"

describe("app/groups relay-capability", () => {
  it("reuses fresh cached probe results within ttl", async () => {
    clearRelayCapabilityCache()

    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({supported_nips: [29]}),
      } as Response
    }) as unknown as typeof fetch

    const [first] = await checkRelayCapabilities(["wss://relay.cache"], fetchMock, {
      nowMs: 1_000,
      cacheTtlMs: 1_000,
      cacheStaleAfterMs: 5_000,
    })
    const [second] = await checkRelayCapabilities(["wss://relay.cache"], fetchMock, {
      nowMs: 1_500,
      cacheTtlMs: 1_000,
      cacheStaleAfterMs: 5_000,
    })

    expect(first.status).toBe("ready")
    expect(second.status).toBe("ready")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("returns stale cached result when refresh fails and cache is not stale-expired", async () => {
    clearRelayCapabilityCache()

    const okFetch = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({supported_nips: [29]}),
      } as Response
    }) as unknown as typeof fetch

    await checkRelayCapabilities(["wss://relay.cache-fallback"], okFetch, {
      nowMs: 1_000,
      cacheTtlMs: 500,
      cacheStaleAfterMs: 3_000,
    })

    const failingFetch = vi.fn(async () => {
      throw new Error("network down")
    }) as unknown as typeof fetch

    const [fallback] = await checkRelayCapabilities(["wss://relay.cache-fallback"], failingFetch, {
      nowMs: 2_000,
      cacheTtlMs: 500,
      cacheStaleAfterMs: 3_000,
      maxRetries: 1,
      retryBackoffMs: 1,
    })

    expect(fallback.status).toBe("ready")
    expect(fallback.details).toContain("cached, refresh failed")
  })

  it("marks relay ready when it advertises groups", () => {
    const result = evaluateRelayCapabilityFromInfo({supported_nips: [1, 29]})

    expect(result.status).toBe("ready")
    expect(result.supportsGroups).toBe(true)
    expect(result.authRequired).toBe(false)
  })

  it("marks relay auth-required when limitation.auth_required is true", () => {
    const result = evaluateRelayCapabilityFromInfo({
      supported_nips: [1, 29, 42],
      limitation: {auth_required: true},
    })

    expect(result.status).toBe("auth-required")
    expect(result.challengeResponseAuth).toBe(true)
  })

  it("captures additional capability signals for navcom baseline visibility", () => {
    const result = evaluateRelayCapabilityFromInfo({
      supported_nips: [29, 42, 104],
      supported_group_modes: ["secure-nip-ee"],
    })

    expect(result.supportsNip29).toBe(true)
    expect(result.supportsNip42).toBe(true)
    expect(result.supportsNip104).toBe(true)
    expect(result.supportsNipEeSignal).toBe(true)
    expect(result.supportsNavcomBaseline).toBe(true)
    expect(result.advertisedNips).toEqual([29, 42, 104])
  })

  it("adds navcom default relay context in details", () => {
    const result = evaluateRelayCapabilityFromInfo(
      {
        supported_nips: [29],
      },
      "wss://relay.navcom.app",
    )

    expect(result.isNavcomDefaultRelay).toBe(true)
    expect(result.details).toContain("relay.navcom.app is the default Navcom relay")
  })

  it("marks relay not-advertised when NIP-29 is missing", () => {
    const result = evaluateRelayCapabilityFromInfo({supported_nips: [1, 42]})

    expect(result.status).toBe("not-advertised")
    expect(result.supportsGroups).toBe(false)
  })

  it("checks multiple relays with injected fetch", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const relay = String(input)

      if (relay.includes("relay.good")) {
        return {
          ok: true,
          json: async () => ({supported_nips: [29]}),
        } as Response
      }

      return {
        ok: true,
        json: async () => ({supported_nips: [1], limitation: {auth_required: true}}),
      } as Response
    }) as unknown as typeof fetch

    const results = await checkRelayCapabilities(
      ["wss://relay.good", "wss://relay.auth"],
      fetchMock,
    )

    expect(results).toHaveLength(2)
    expect(results[0].status).toBe("ready")
    expect(results[1].status).toBe("auth-required")
    expect(results[0].retries).toBe(0)
  })

  it("retries capability probe until success", async () => {
    let attempts = 0
    const fetchMock = vi.fn(async () => {
      attempts += 1

      if (attempts < 3) {
        throw new Error("temporary failure")
      }

      return {
        ok: true,
        json: async () => ({supported_nips: [29]}),
      } as Response
    }) as unknown as typeof fetch

    const [result] = await checkRelayCapabilities(["wss://relay.retry"], fetchMock, {
      maxRetries: 3,
      retryBackoffMs: 1,
      timeoutMs: 50,
    })

    expect(result.status).toBe("ready")
    expect(result.retries).toBe(2)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it("returns unreachable after exhausting retries", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("always fails")
    }) as unknown as typeof fetch

    const [result] = await checkRelayCapabilities(["wss://relay.fail"], fetchMock, {
      maxRetries: 2,
      retryBackoffMs: 1,
      timeoutMs: 50,
    })

    expect(result.status).toBe("unreachable")
    expect(result.retries).toBe(2)
    expect(result.details).toContain("after retries")
  })

  it("uses Cypress relay capability fixture override when provided", async () => {
    ;(window as any).Cypress = {}
    ;(window as any).__groupRelayCapabilityFixture = {
      "wss://relay.navcom.app": {
        status: "ready",
        supportsNip104: true,
        supportsNipEeSignal: true,
        supportsNavcomBaseline: true,
        isNavcomDefaultRelay: true,
        details: "fixture-ready",
      },
    }

    const fetchMock = vi.fn(async () => {
      throw new Error("should not be called when fixture is active")
    }) as unknown as typeof fetch

    const [result] = await checkRelayCapabilities(["wss://relay.navcom.app"], fetchMock)

    expect(result.status).toBe("ready")
    expect(result.supportsNip104).toBe(true)
    expect(result.supportsNipEeSignal).toBe(true)
    expect(result.isNavcomDefaultRelay).toBe(true)
    expect(result.details).toBe("fixture-ready")
    expect(fetchMock).not.toHaveBeenCalled()

    delete (window as any).__groupRelayCapabilityFixture
    delete (window as any).Cypress
  })

  it("ignores malformed Cypress fixture maps and falls back to probe path", async () => {
    clearRelayCapabilityCache()
    ;(window as any).Cypress = {}
    ;(window as any).__groupRelayCapabilityFixture = "invalid-fixture"

    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({supported_nips: [29]}),
      } as Response
    }) as unknown as typeof fetch

    const [result] = await checkRelayCapabilities(["wss://relay.probe"], fetchMock)

    expect(result.status).toBe("ready")
    expect(fetchMock).toHaveBeenCalledTimes(1)

    delete (window as any).__groupRelayCapabilityFixture
    delete (window as any).Cypress
  })

  it("uses default fixture shape when relay fixture entry is missing", async () => {
    clearRelayCapabilityCache()
    ;(window as any).Cypress = {}
    ;(window as any).__groupRelayCapabilityFixture = {
      "wss://relay.other": {
        status: "auth-required",
      },
    }

    const fetchMock = vi.fn(async () => {
      throw new Error("probe path should not run when Cypress fixture is active")
    }) as unknown as typeof fetch

    const [result] = await checkRelayCapabilities(["wss://relay.missing"], fetchMock)

    expect(result.relay).toBe("wss://relay.missing")
    expect(result.status).toBe("ready")
    expect(result.supportsGroups).toBe(true)
    expect(result.supportsNip29).toBe(true)
    expect(result.supportsNip104).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()

    delete (window as any).__groupRelayCapabilityFixture
    delete (window as any).Cypress
  })

  it("falls back to real probe path when fixture mode is disabled", async () => {
    clearRelayCapabilityCache()
    delete (window as any).Cypress
    ;(window as any).__groupRelayCapabilityFixture = {
      "wss://relay.disabled": {
        status: "auth-required",
      },
    }

    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({supported_nips: [1]}),
      } as Response
    }) as unknown as typeof fetch

    const [result] = await checkRelayCapabilities(["wss://relay.disabled"], fetchMock)

    expect(result.status).toBe("not-advertised")
    expect(fetchMock).toHaveBeenCalledTimes(1)

    delete (window as any).__groupRelayCapabilityFixture
  })

  it("attempts relay challenge auth and returns success when socket auth reaches ok", async () => {
    const attemptAuth = vi.fn(async () => {})
    const socket = {
      attemptToOpen: vi.fn(),
      send: vi.fn(),
      auth: {
        status: AuthStatus.Ok,
        details: "",
        attemptAuth,
      },
    }

    const result = await attemptRelayChallengeAuth({
      relay: "wss://relay.secure",
      sign: vi.fn(async event => ({...event, id: "id", sig: "sig", pubkey: "pub"})),
      getSocket: () => socket,
    })

    expect(socket.attemptToOpen).toHaveBeenCalled()
    expect(attemptAuth).toHaveBeenCalled()
    expect(result.ok).toBe(true)
    expect(result.authStatus).toBe(AuthStatus.Ok)
  })

  it("returns missing-signer when no signer callback is provided", async () => {
    const result = await attemptRelayChallengeAuth({
      relay: "wss://relay.secure",
      sign: null,
      getSocket: () => {
        throw new Error("should not be called")
      },
    })

    expect(result.ok).toBe(false)
    expect(result.authStatus).toBe("missing-signer")
  })

  it("determines viable relay path from checks and auth state", () => {
    expect(
      hasViableRelayPath({
        checks: [
          {
            relay: "wss://relay.auth",
            status: "auth-required",
            supportsGroups: true,
            authRequired: true,
            challengeResponseAuth: true,
            details: "auth",
          },
        ],
        authConfirmed: {"wss://relay.auth": true},
        selectedRelays: ["wss://relay.auth"],
      }),
    ).toBe(true)

    expect(
      hasViableRelayPath({
        checks: [
          {
            relay: "wss://relay.bad",
            status: "not-advertised",
            supportsGroups: false,
            authRequired: false,
            challengeResponseAuth: false,
            details: "bad",
          },
        ],
        authConfirmed: {},
        selectedRelays: ["wss://relay.bad"],
      }),
    ).toBe(true)
  })

  it("treats unreachable-only relay sets as non-viable", () => {
    expect(
      hasViableRelayPath({
        checks: [
          {
            relay: "wss://relay.down",
            status: "unreachable",
            supportsGroups: null,
            authRequired: null,
            challengeResponseAuth: null,
            details: "down",
          },
        ],
        authConfirmed: {},
        selectedRelays: ["wss://relay.down"],
      }),
    ).toBe(false)
  })

  it("marks authenticated sessions as expired when ttl has passed", () => {
    const sessions = refreshRelayAuthSessions({
      sessions: {
        "wss://relay.auth": {
          status: "authenticated",
          authenticatedAt: 100,
          expiresAt: 150,
        },
      },
      now: 200,
    })

    expect(sessions["wss://relay.auth"].status).toBe("expired")
  })

  it("derives confirmed map only for non-expired authenticated sessions", () => {
    const confirmed = getRelayAuthConfirmedMap({
      sessions: {
        "wss://relay.ok": {status: "authenticated", expiresAt: 10_000},
        "wss://relay.expired": {status: "authenticated", expiresAt: 100},
        "wss://relay.failed": {status: "failed"},
      },
      now: 500,
    })

    expect(confirmed["wss://relay.ok"]).toBe(true)
    expect(confirmed["wss://relay.expired"]).toBe(false)
    expect(confirmed["wss://relay.failed"]).toBe(false)
  })
})
