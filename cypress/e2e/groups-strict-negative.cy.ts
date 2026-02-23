/// <reference types="cypress" />

describe("groups strict negative paths", () => {
  const testPubkey = "c853d879b7376dab1cdcd4faf235a05f680aae42ba620abdd95d619542a5a379"
  const relayA = "wss://relay.navcom.app"
  const relayB = "wss://relay.backup.example"

  const visitWithFixture = ({
    securePilotEnabled,
    fixture,
  }: {
    securePilotEnabled: boolean
    fixture: Record<string, Record<string, unknown>>
  }) => {
    cy.visit("/groups/create", {
      onBeforeLoad: (win: Window & typeof globalThis) => {
        ;(win as any).nostr = {
          getPublicKey: () => Promise.resolve(testPubkey),
          signEvent: (event: Record<string, unknown>) =>
            Promise.resolve({
              ...event,
              id: "fixture-id",
              sig: "fixture-sig",
              pubkey: testPubkey,
            }),
          nip04: {
            encrypt: (_pubkey: string, plaintext: string) => Promise.resolve(plaintext),
            decrypt: (_pubkey: string, ciphertext: string) => Promise.resolve(ciphertext),
          },
        }
        ;(win as any).__groupTelemetry = []
        ;(win as any).plausible = (event: string, opts?: {props?: Record<string, unknown>}) => {
          ;(win as any).__groupTelemetry.push({event, props: opts?.props || {}})
        }
        ;(win as any).__groupRelayCapabilityFixture = fixture

        win.localStorage.setItem(
          "group_secure_pilot_enabled",
          securePilotEnabled ? "true" : "false",
        )
      },
    })
  }

  const waitForAppReady = () => {
    cy.get("body", {timeout: 20000}).should("not.contain.text", "Loading app…")
  }

  const runCreateBlockedFlow = ({
    mode,
    selectedRelays,
  }: {
    mode: "auto" | "basic" | "secure" | "max"
    selectedRelays: string[]
  }) => {
    cy.contains("Create a room", {timeout: 20000}).click()
    cy.get("select", {timeout: 20000}).select(mode)
    cy.get('input[placeholder="Room name (e.g. ops)"]', {timeout: 20000})
      .clear()
      .type(`ops-${mode}`)
    cy.get('textarea[placeholder="One relay per line (invite relay will prefill when available)"]')
      .first()
      .clear()
      .type(selectedRelays.join("\n"))

    cy.contains("button", "Check relay capabilities", {timeout: 20000}).click()
    cy.contains("button", "Create Group", {timeout: 20000}).click()
  }

  const expectBlockedReason = ({
    reason,
    requestedTransportMode,
  }: {
    reason:
      | "STRICT_REQUIRES_SECURE_PILOT"
      | "RELAY_REQUIRES_VIABLE_PATH"
      | "RELAY_REQUIRES_RELAY_SPECIFIC_CREDENTIAL"
    requestedTransportMode: "baseline" | "secure-pilot"
  }) => {
    cy.window()
      .its("__groupTelemetry")
      .should((events: Array<{event: string; props: Record<string, unknown>}>) => {
        const blocked = events
          .filter(event => event.event === "group_setup_blocked_by_relay_requirements")
          .at(-1)

        expect(blocked, "blocked telemetry event").to.exist
        expect(blocked?.props.flow).to.eq("create")
        expect(blocked?.props.block_reason).to.eq(reason)
        expect(blocked?.props.result).to.eq("error")
        expect(blocked?.props.requested_transport_mode).to.eq(requestedTransportMode)
      })
  }

  const expectBlockedUiState = (message: string) => {
    cy.contains("div", message, {timeout: 20000}).should("be.visible")
    cy.get("div.border-warning.text-warning", {timeout: 20000}).should("contain.text", message)
    cy.url().should("include", "/groups/create")
  }

  it("blocks secure mode when secure pilot is disabled", () => {
    visitWithFixture({
      securePilotEnabled: false,
      fixture: {
        [relayA]: {
          status: "ready",
          supportsNipEeSignal: true,
          supportsNip104: true,
          supportsGroups: true,
          authRequired: false,
          challengeResponseAuth: false,
        },
      },
    })

    waitForAppReady()

    cy.get("body", {timeout: 20000}).then(($body: JQuery<HTMLElement>) => {
      const text = $body.text()

      if (!text.includes("Group Setup")) {
        expect(text).to.match(/Welcome!|Groups/)

        return
      }

      runCreateBlockedFlow({mode: "secure", selectedRelays: [relayA]})
      expectBlockedUiState(
        "Secure mode is unavailable in this runtime. Enable secure pilot before using Secure or Max.",
      )
      expectBlockedReason({
        reason: "STRICT_REQUIRES_SECURE_PILOT",
        requestedTransportMode: "secure-pilot",
      })
    })
  })

  it("blocks create when no viable relay path is available", () => {
    visitWithFixture({
      securePilotEnabled: true,
      fixture: {
        [relayA]: {
          status: "unreachable",
          supportsNipEeSignal: false,
          supportsNip104: false,
          supportsGroups: null,
          authRequired: null,
          challengeResponseAuth: null,
        },
      },
    })

    waitForAppReady()

    cy.get("body", {timeout: 20000}).then(($body: JQuery<HTMLElement>) => {
      const text = $body.text()

      if (!text.includes("Group Setup")) {
        expect(text).to.match(/Welcome!|Groups/)

        return
      }

      runCreateBlockedFlow({mode: "auto", selectedRelays: [relayA]})
      expectBlockedUiState(
        "No viable relay path is available. Run relay checks, authenticate required relays, or update the selected relay list.",
      )
      expectBlockedReason({
        reason: "RELAY_REQUIRES_VIABLE_PATH",
        requestedTransportMode: "baseline",
      })
    })
  })

  it("blocks create when relay requires relay-specific auth credentials", () => {
    visitWithFixture({
      securePilotEnabled: true,
      fixture: {
        [relayA]: {
          status: "ready",
          supportsNipEeSignal: true,
          supportsNip104: true,
          supportsGroups: true,
          authRequired: false,
          challengeResponseAuth: false,
        },
        [relayB]: {
          status: "auth-required",
          supportsNipEeSignal: true,
          supportsNip104: true,
          supportsGroups: true,
          authRequired: true,
          challengeResponseAuth: false,
        },
      },
    })

    waitForAppReady()

    cy.get("body", {timeout: 20000}).then(($body: JQuery<HTMLElement>) => {
      const text = $body.text()

      if (!text.includes("Group Setup")) {
        expect(text).to.match(/Welcome!|Groups/)

        return
      }

      runCreateBlockedFlow({mode: "auto", selectedRelays: [relayA, relayB]})
      expectBlockedUiState(
        "At least one relay requires a relay-specific authentication method that is not advertised. Provide relay credentials or switch relays.",
      )
      expectBlockedReason({
        reason: "RELAY_REQUIRES_RELAY_SPECIFIC_CREDENTIAL",
        requestedTransportMode: "baseline",
      })
    })
  })
})
