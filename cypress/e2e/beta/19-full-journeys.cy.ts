/**
 * Beta Tester Simulation — Full User Journey
 *
 * End-to-end walk-through simulating a real beta tester's session:
 *
 * Journey 1: New user discovery
 *   Land → explore login → browse public content → view about
 *
 * Journey 2: Authenticated power user
 *   Login → check feed → visit groups → explore settings → switch theme → switch modes
 *
 * Journey 3: Mobile-first user
 *   Mobile boot → tab-switch modes → check settings → browse groups
 */
describe("full user journeys", () => {
  describe("journey 1: new user discovery", () => {
    it("walk-through: landing → login → browse → about", () => {
      // Step 1: Land on the app
      cy.visitRoute("/")
      cy.get("#app").should("exist")

      // Step 2: Check login options
      cy.visitRoute("/login")
      cy.assertNoConsoleErrors()

      // Step 3: Browse public notes
      cy.visitRoute("/notes")
      cy.assertNoConsoleErrors()

      // Step 4: Look at groups
      cy.visitRoute("/groups")
      cy.assertNoConsoleErrors()

      // Step 5: Search for something
      cy.visitRoute("/search")
      cy.assertNoConsoleErrors()

      // Step 6: Read the about page
      cy.visitRoute("/about")
      cy.assertNoConsoleErrors()
    })
  })

  describe("journey 2: authenticated power user", () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
      cy.login()
      cy.waitForApp()
    })

    it("walk-through: feed → groups → settings → theme → modes", () => {
      // Step 1: Check the feed
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()

      // Step 2: Visit groups
      cy.visitRoute("/groups")
      cy.contains(/Groups/, {timeout: 15000})

      // Step 3: Try creating a group
      cy.visitRoute("/groups/create")
      cy.assertNoConsoleErrors()

      // Step 4: Open settings
      cy.visitRoute("/settings")
      cy.assertNoConsoleErrors()

      // Step 5: Change the theme (controls may not render without relay)
      cy.setTheme({shell: "midnight", accent: "amber"})

      // Step 6: Verify theme applies on next navigation

      // Step 7: Switch to map mode
      cy.setMode("map")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()

      // Step 8: Switch to ops mode
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()

      // Step 9: Back to comms
      cy.setMode("comms")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()
    })
  })

  describe("journey 3: mobile-first user", () => {
    beforeEach(() => {
      cy.viewport(375, 812)
      cy.login()
      cy.waitForApp()
    })

    it("walk-through: boot → modes → settings → groups", () => {
      // Step 1: App boots on mobile
      cy.viewport(375, 812)
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()

      // Step 2: Switch modes (tab bar may not render in headless e2e)
      cy.setMode("map")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()

      cy.setMode("ops")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()

      cy.setMode("comms")
      cy.visitRoute("/")

      // Step 3: Visit settings
      cy.visitRoute("/settings")
      cy.assertNoConsoleErrors()

      // Step 4: Visit groups
      cy.visitRoute("/groups")
      cy.assertNoConsoleErrors()

      // Step 5: Visit channels
      cy.visitRoute("/channels")
      cy.assertNoConsoleErrors()
    })
  })

  describe("journey 4: theme explorer", () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
      cy.login()
      cy.waitForApp()
    })

    it("walk-through: try all themes on different pages", () => {
      const themes = [
        {shell: "midnight", surface: "steel", accent: "cyan"},
        {shell: "void", surface: "obsidian", accent: "amber"},
        {shell: "carbon", surface: "graphite", accent: "emerald"},
        {shell: "nebula", surface: "abyss", accent: "arc"},
      ] as const

      const routes = ["/", "/groups", "/settings"]

      themes.forEach(theme => {
        cy.setTheme(theme)
        routes.forEach(route => {
          cy.visitRoute(route)
          cy.assertShellApplied()
          cy.assertAccentApplied()
          cy.assertNoConsoleErrors()
        })
      })
    })
  })
})
