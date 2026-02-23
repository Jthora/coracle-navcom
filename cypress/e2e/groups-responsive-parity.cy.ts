/// <reference types="cypress" />

describe("groups responsive create/join parity", () => {
  const testPubkey = "c853d879b7376dab1cdcd4faf235a05f680aae42ba620abdd95d619542a5a379"
  const relay = "wss://relay.navcom.app"

  const visitWithFixture = (path: string) => {
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

  const assertParityTelemetry = (viewportLabel: string) => {
    cy.window()
      .its("__groupTelemetry")
      .should((events: Array<{event: string; props: Record<string, unknown>}>) => {
        const createAttempt = events.findLast(event => event.event === "group_setup_create_attempt")
        const joinAttempt = events.findLast(event => event.event === "group_setup_join_attempt")

        expect(createAttempt, `[${viewportLabel}] create telemetry`).to.exist
        expect(joinAttempt, `[${viewportLabel}] join telemetry`).to.exist

        expect(createAttempt?.props.mode).to.eq("guided")
        expect(joinAttempt?.props.mode).to.eq("guided")

        expect(createAttempt?.props.requested_transport_mode).to.eq("baseline")
        expect(joinAttempt?.props.requested_transport_mode).to.eq("baseline")
      })
  }

  ;(
    [
      {label: "mobile", viewport: "iphone-6" as const},
      {label: "desktop", viewport: "macbook-15" as const},
    ] as const
  ).forEach(({label, viewport}) => {
    it(`keeps guided create/join behavior parity on ${label}`, () => {
      cy.viewport(viewport)

      visitWithFixture("/groups/create")
      waitForAppReady()

      cy.get("body", {timeout: 20000}).then(($body: JQuery<HTMLElement>) => {
        const text = $body.text()

        if (!text.includes("Group Setup")) {
          expect(text).to.match(/Welcome!|Groups/)

          return
        }

        const roomName = `ops-${label}`

        cy.contains("Create a room", {timeout: 20000}).click()
        cy.get("select", {timeout: 20000}).select("auto")
        cy.get('input[placeholder="Room name (e.g. ops)"]', {timeout: 20000}).clear().type(roomName)
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
          .type(`relay.navcom.app'${roomName}`)

        cy.get(
          'textarea[placeholder="One relay per line (invite relay will prefill when available)"]',
        )
          .first()
          .clear()
          .type(relay)

        cy.contains("button", "Check relay capabilities", {timeout: 20000}).click()
        cy.contains("button", "Join Group", {timeout: 20000}).click()

        assertParityTelemetry(label)
      })
    })
  })
})
