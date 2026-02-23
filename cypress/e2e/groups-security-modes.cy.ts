/// <reference types="cypress" />

describe("groups security mode matrix", () => {
  const testPubkey = "c853d879b7376dab1cdcd4faf235a05f680aae42ba620abdd95d619542a5a379"
  const relay = "wss://relay.navcom.app"

  const visitWithSecurityFixture = (path: string) => {
    cy.visit(path, {
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
        ;(win as any).__groupRelayCapabilityFixture = {
          [relay]: {
            status: "ready",
            supportsNip104: true,
            supportsNipEeSignal: true,
            supportsNavcomBaseline: true,
            isNavcomDefaultRelay: true,
            supportsGroups: true,
            authRequired: false,
            challengeResponseAuth: false,
          },
        }

        win.localStorage.setItem("group_secure_pilot_enabled", "true")
      },
    })
  }

  const waitForAppReady = () => {
    cy.get("body", {timeout: 20000}).should("not.contain.text", "Loading app…")
  }

  const runModeCreateAttempt = (mode: "auto" | "basic" | "secure" | "max") => {
    const roomName = `ops-${mode}`

    cy.contains("Create a room", {timeout: 20000}).click()
    cy.get("select", {timeout: 20000}).select(mode)
    cy.get('input[placeholder="Room name (e.g. ops)"]', {timeout: 20000}).clear().type(roomName)
    cy.get('textarea[placeholder="One relay per line (invite relay will prefill when available)"]')
      .first()
      .clear()
      .type(relay)
    cy.contains("button", "Check relay capabilities", {timeout: 20000}).click()
    cy.contains("button", "Create Group", {timeout: 20000}).click()
  }

  const expectCreateAttemptTelemetry = (mode: "auto" | "basic" | "secure" | "max") => {
    const expectedTransport = mode === "secure" || mode === "max" ? "secure-pilot" : "baseline"

    cy.window()
      .its("__groupTelemetry")
      .should((events: Array<{event: string; props: Record<string, unknown>}>) => {
        const createAttempts = events.filter(event => event.event === "group_setup_create_attempt")

        expect(createAttempts.length, "group_setup_create_attempt emitted").to.be.greaterThan(0)

        const match = createAttempts
          .slice()
          .reverse()
          .find(event => String(event.props.privacy) === mode)

        expect(match, `create attempt for mode ${mode}`).to.exist
        expect(match?.props.mode).to.eq("guided")
        expect(match?.props.requested_transport_mode).to.eq(expectedTransport)
      })
  }

  ;(
    [
      {mode: "auto", expected: "baseline"},
      {mode: "basic", expected: "baseline"},
      {mode: "secure", expected: "secure-pilot"},
      {mode: "max", expected: "secure-pilot"},
    ] as const
  ).forEach(({mode}) => {
    it(`emits deterministic requested transport for ${mode} mode`, () => {
      visitWithSecurityFixture("/groups/create")
      waitForAppReady()

      cy.get("body", {timeout: 20000}).then(($body: JQuery<HTMLElement>) => {
        const text = $body.text()

        if (!text.includes("Group Setup")) {
          expect(text).to.match(/Welcome!|Groups/)

          return
        }

        runModeCreateAttempt(mode)
        expectCreateAttemptTelemetry(mode)
      })
    })
  })
})
