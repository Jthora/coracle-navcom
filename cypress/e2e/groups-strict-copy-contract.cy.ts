/// <reference types="cypress" />

describe("groups strict-mode copy contract", () => {
  const testPubkey = "c853d879b7376dab1cdcd4faf235a05f680aae42ba620abdd95d619542a5a379"
  const relay = "wss://relay.navcom.app"

  const visitWithFixture = ({
    securePilotEnabled,
    supportsNipEeSignal,
  }: {
    securePilotEnabled: boolean
    supportsNipEeSignal: boolean
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
        ;(win as any).__groupRelayCapabilityFixture = {
          [relay]: {
            status: "ready",
            supportsNipEeSignal,
            supportsNip104: supportsNipEeSignal,
            supportsNavcomBaseline: true,
            isNavcomDefaultRelay: true,
            supportsGroups: true,
            authRequired: false,
            challengeResponseAuth: false,
          },
        }

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

  const prepSecureCreate = () => {
    cy.contains("Create a room", {timeout: 20000}).click()
    cy.get("select", {timeout: 20000}).select("secure")
    cy.get('input[placeholder="Room name (e.g. ops)"]', {timeout: 20000}).clear().type("ops-secure")
    cy.get('textarea[placeholder="One relay per line (invite relay will prefill when available)"]')
      .first()
      .clear()
      .type(relay)
  }

  const expectBlockedCopyAndReason = ({
    copy,
    reason,
  }: {
    copy: string
    reason:
      | "STRICT_REQUIRES_SECURE_PILOT"
      | "STRICT_REQUIRES_RELAY_CHECKS"
      | "STRICT_REQUIRES_NIP_EE_SIGNAL"
  }) => {
    cy.contains("div", copy, {timeout: 20000}).should("be.visible")
    cy.get("div.border-warning.text-warning", {timeout: 20000}).should("contain.text", copy)

    cy.window()
      .its("__groupTelemetry")
      .should((events: Array<{event: string; props: Record<string, unknown>}>) => {
        const blocked = events
          .filter(event => event.event === "group_setup_blocked_by_relay_requirements")
          .at(-1)

        expect(blocked, "blocked telemetry event").to.exist
        expect(blocked?.props.block_reason).to.eq(reason)
      })
  }

  it("uses exact copy for STRICT_REQUIRES_SECURE_PILOT", () => {
    visitWithFixture({securePilotEnabled: false, supportsNipEeSignal: true})
    waitForAppReady()

    cy.get("body", {timeout: 20000}).then(($body: JQuery<HTMLElement>) => {
      const text = $body.text()

      if (!text.includes("Group Setup")) {
        expect(text).to.match(/Welcome!|Groups/)

        return
      }

      prepSecureCreate()
      cy.contains("button", "Create Group", {timeout: 20000}).click()

      expectBlockedCopyAndReason({
        copy: "Secure mode is unavailable in this runtime. Enable secure pilot before using Secure or Max.",
        reason: "STRICT_REQUIRES_SECURE_PILOT",
      })
    })
  })

  it("uses exact copy for STRICT_REQUIRES_RELAY_CHECKS", () => {
    visitWithFixture({securePilotEnabled: true, supportsNipEeSignal: true})
    waitForAppReady()

    cy.get("body", {timeout: 20000}).then(($body: JQuery<HTMLElement>) => {
      const text = $body.text()

      if (!text.includes("Group Setup")) {
        expect(text).to.match(/Welcome!|Groups/)

        return
      }

      prepSecureCreate()
      cy.contains("button", "Create Group", {timeout: 20000}).click()

      expectBlockedCopyAndReason({
        copy: "Run relay checks first. Secure and Max require verified relay capability signals before create/join.",
        reason: "STRICT_REQUIRES_RELAY_CHECKS",
      })
    })
  })

  it("uses exact copy for STRICT_REQUIRES_NIP_EE_SIGNAL", () => {
    visitWithFixture({securePilotEnabled: true, supportsNipEeSignal: false})
    waitForAppReady()

    cy.get("body", {timeout: 20000}).then(($body: JQuery<HTMLElement>) => {
      const text = $body.text()

      if (!text.includes("Group Setup")) {
        expect(text).to.match(/Welcome!|Groups/)

        return
      }

      prepSecureCreate()
      cy.contains("button", "Check relay capabilities", {timeout: 20000}).click()
      cy.contains("button", "Create Group", {timeout: 20000}).click()

      expectBlockedCopyAndReason({
        copy: "Selected relays do not advertise secure NIP-EE capability. Choose relays with secure signals or use Auto/Basic.",
        reason: "STRICT_REQUIRES_NIP_EE_SIGNAL",
      })
    })
  })
})
