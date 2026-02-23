/// <reference types="cypress" />

describe("groups invite tier policy matrix", () => {
  const testPubkey = "c853d879b7376dab1cdcd4faf235a05f680aae42ba620abdd95d619542a5a379"
  const relay = "wss://relay.navcom.app"
  const groupAddress = "relay.navcom.app'ops-tier2"
  const tier2InvitePath = `/groups/create?groupId=${encodeURIComponent(groupAddress)}&missionTier=2&preferredMode=secure-nip-ee&label=Ops%20Tier%202`
  const tier2PolicyMessage =
    "This invite is mission tier 2 and requires Secure or Max mode. Switch security mode to continue."

  const visitWithTierFixture = () => {
    cy.visit(tier2InvitePath, {
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

  const runJoinAttemptForMode = (mode: "auto" | "basic" | "secure" | "max") => {
    cy.get("select", {timeout: 20000}).select(mode)
    cy.get('textarea[placeholder="One relay per line (invite relay will prefill when available)"]')
      .first()
      .clear()
      .type(relay)
    cy.contains("button", "Check relay capabilities", {timeout: 20000}).click()
    cy.contains("button", "Join Group", {timeout: 20000}).click()
  }

  ;(["auto", "basic"] as const).forEach(mode => {
    it(`blocks tier-2 invite join when mode is ${mode}`, () => {
      visitWithTierFixture()
      waitForAppReady()

      cy.get("body", {timeout: 20000}).then(($body: JQuery<HTMLElement>) => {
        const text = $body.text()

        if (!text.includes("Group Setup")) {
          expect(text).to.match(/Welcome!|Groups/)

          return
        }

        cy.contains("Invite mission tier hint: 2", {timeout: 20000})
        runJoinAttemptForMode(mode)

        cy.contains("div", tier2PolicyMessage, {timeout: 20000}).should("be.visible")
        cy.url().should("include", "/groups/create")

        cy.window()
          .its("__groupTelemetry")
          .should((events: Array<{event: string; props: Record<string, unknown>}>) => {
            const blocked = events
              .filter(event => event.event === "group_setup_blocked_by_relay_requirements")
              .at(-1)

            expect(blocked, "blocked telemetry event").to.exist
            expect(blocked?.props.flow).to.eq("join")
            expect(blocked?.props.block_reason).to.eq("INVITE_TIER2_REQUIRES_STRICT_MODE")
            expect(blocked?.props.mission_tier).to.eq(2)
          })
      })
    })
  })
  ;(["secure", "max"] as const).forEach(mode => {
    it(`allows tier-2 invite join when mode is ${mode}`, () => {
      visitWithTierFixture()
      waitForAppReady()

      cy.get("body", {timeout: 20000}).then(($body: JQuery<HTMLElement>) => {
        const text = $body.text()

        if (!text.includes("Group Setup")) {
          expect(text).to.match(/Welcome!|Groups/)

          return
        }

        runJoinAttemptForMode(mode)

        cy.contains("div", tier2PolicyMessage).should("not.exist")

        cy.window()
          .its("__groupTelemetry")
          .should((events: Array<{event: string; props: Record<string, unknown>}>) => {
            const blockedEvents = events.filter(
              event => event.event === "group_setup_blocked_by_relay_requirements",
            )

            const tierPolicyBlock = blockedEvents.find(
              event => event.props.block_reason === "INVITE_TIER2_REQUIRES_STRICT_MODE",
            )

            expect(tierPolicyBlock, "no tier-policy blocker in strict mode").to.not.exist
          })
      })
    })
  })
})
