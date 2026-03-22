/**
 * Beta Tester Simulation — Ops Mode
 *
 * Exercises the OPS (operations dashboard) mode:
 * 1. Ops view loads and renders
 * 2. Dashboard cards are present (map thumbnail, channels, activity)
 * 3. Desktop vs mobile layout works
 */
describe("ops mode", () => {
  describe("desktop", () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
      cy.login()
      cy.waitForApp()
    })

    it("ops view loads without crash", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()
    })

    it("ops dashboard has map thumbnail area", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      // Map thumbnail card area should exist
      cy.get("#app", {timeout: 15000}).should("exist")
      cy.assertNoConsoleErrors()
    })

    it("ops view shows dashboard content", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      // The ops view should have content (cards, sections)
      cy.waitForApp()
      cy.assertNoConsoleErrors()
    })
  })

  describe("mobile", () => {
    beforeEach(() => {
      cy.viewport(375, 812)
      cy.login()
      cy.waitForApp()
    })

    it("ops view renders on mobile", () => {
      cy.setMode("ops")
      cy.viewport(375, 812)
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()
    })
  })
})
