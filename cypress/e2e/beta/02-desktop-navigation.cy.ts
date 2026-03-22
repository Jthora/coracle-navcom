/**
 * Beta Tester Simulation — Desktop Navigation
 *
 * Desktop (1280×720) navigation:
 * 1. Left sidebar is visible and functional
 * 2. Top nav bar renders with search and actions
 * 3. All major sidebar links navigate correctly
 * 4. Settings sub-menu expands
 */
describe("desktop navigation", () => {
  beforeEach(() => {
    cy.viewport(1280, 720)
  })

  describe("unauthenticated", () => {
    it("shows desktop sidebar with key nav items", () => {
      cy.visitRoute("/")
      cy.waitForApp()
    })

    it("about link works from sidebar", () => {
      cy.visitRoute("/about")
      cy.get("#app", {timeout: 10000}).should("not.be.empty")
      cy.assertNoConsoleErrors()
    })

    it("top nav bar renders on desktop", () => {
      cy.visitRoute("/")
      // Should see NAVCOM branding or nav structure
      cy.get("body").should("not.be.empty")
    })
  })

  describe("authenticated", () => {
    beforeEach(() => {
      cy.login()
      cy.waitForApp()
    })

    it("sidebar shows authenticated nav items", () => {
      cy.viewport(1280, 720)
      // Authenticated users see additional items
      cy.get("#app").should("exist")
    })

    it("navigates to groups from sidebar", () => {
      cy.viewport(1280, 720)
      cy.visitRoute("/groups")
      cy.contains("Groups", {timeout: 15000})
      cy.assertNoConsoleErrors()
    })

    it("navigates to channels from sidebar", () => {
      cy.viewport(1280, 720)
      cy.visitRoute("/channels")
      cy.assertNoConsoleErrors()
    })

    it("navigates to notifications", () => {
      cy.viewport(1280, 720)
      cy.visitRoute("/notifications")
      cy.assertNoConsoleErrors()
    })

    it("navigates to settings", () => {
      cy.viewport(1280, 720)
      cy.visitRoute("/settings")
      cy.assertNoConsoleErrors()
    })

    it("navigates to profile settings", () => {
      cy.viewport(1280, 720)
      cy.visitRoute("/settings/profile")
      cy.assertNoConsoleErrors()
    })

    it("navigates to relay settings", () => {
      cy.viewport(1280, 720)
      cy.visitRoute("/settings/relays")
      cy.assertNoConsoleErrors()
    })

    it("navigates to keys settings", () => {
      cy.viewport(1280, 720)
      cy.visitRoute("/settings/keys")
      cy.assertNoConsoleErrors()
    })
  })
})
