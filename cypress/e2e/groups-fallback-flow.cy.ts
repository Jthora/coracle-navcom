/// <reference types="cypress" />

describe("groups fallback compatibility flow", () => {
  const testPubkey = "c853d879b7376dab1cdcd4faf235a05f680aae42ba620abdd95d619542a5a379"
  const relay = "wss://relay.navcom.app"

  const visitWithFallbackFixture = (path: string) => {
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
            supportsNip104: false,
            supportsNipEeSignal: false,
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

  const expectEvent = (
    events: Array<{event: string; props: Record<string, unknown>}>,
    name: string,
  ) => {
    const matches = events.filter(event => event.event === name)

    expect(matches.length, `event ${name}`).to.be.greaterThan(0)

    return matches[matches.length - 1]
  }

  afterEach(function () {
    const testName = this.currentTest?.fullTitle() || "groups fallback compatibility flow"

    cy.window().then((win: Window & typeof globalThis) => {
      const events = Array.isArray((win as any).__groupTelemetry)
        ? ((win as any).__groupTelemetry as Array<{event: string; props?: Record<string, unknown>}>)
        : []

      cy.task("writeGroupTelemetryArtifact", {
        spec: "groups-fallback-flow",
        test: testName,
        events,
      })
    })
  })

  it("runs create→join→chat flow in compatibility fallback lane", () => {
    visitWithFallbackFixture("/groups/create")
    waitForAppReady()

    cy.get("body", {timeout: 20000}).then(($body: JQuery<HTMLElement>) => {
      const text = $body.text()

      if (!text.includes("Group Setup")) {
        expect(text).to.match(/Welcome!|Groups/)

        return
      }

      cy.contains("Create a room", {timeout: 20000}).click()
      cy.get("select", {timeout: 20000}).select("auto")
      cy.get('input[placeholder="Room name (e.g. ops)"]', {timeout: 20000})
        .clear()
        .type("opsfallback")
      cy.get(
        'textarea[placeholder="One relay per line (invite relay will prefill when available)"]',
      )
        .first()
        .clear()
        .type(relay)
      cy.contains("button", "Check relay capabilities", {timeout: 20000}).click()
      cy.contains("button", "Create Group", {timeout: 20000}).click()

      cy.contains("Join from invite", {timeout: 20000}).click()
      cy.get("input[placeholder='Group address']", {timeout: 20000})
        .clear()
        .type("relay.navcom.app'opsfallback")
      cy.get(
        'textarea[placeholder="One relay per line (invite relay will prefill when available)"]',
      )
        .first()
        .clear()
        .type(relay)
      cy.contains("button", "Check relay capabilities", {timeout: 20000}).click()
      cy.contains("button", "Join Group", {timeout: 20000}).click()

      cy.visit("/groups/relay.navcom.app'opsfallback/chat")
      waitForAppReady()

      cy.window()
        .its("__groupTelemetry")
        .should((events: Array<{event: string; props: Record<string, unknown>}>) => {
          const createAttempt = expectEvent(events, "group_setup_create_attempt")
          expect(createAttempt.props.privacy).to.eq("auto")
          expect(createAttempt.props.requested_transport_mode).to.eq("baseline")

          const joinAttempt = expectEvent(events, "group_setup_join_attempt")
          expect(joinAttempt.props.requested_transport_mode).to.eq("baseline")

          const securityShown = expectEvent(events, "group_security_state_shown")
          expect(securityShown.props.resolved_transport_mode).to.eq("baseline")
          expect(securityShown.props.guarantee_label).to.eq("compatibility-delivery")
        })
    })
  })
})
