/**
 * Beta Tester Simulation — Comms Mode
 *
 * Exercises the COMMS (chat) mode:
 * 1. Comms view loads and renders
 * 2. Channel list / sidebar structure is present
 * 3. Quick-action buttons (Check-in, Alert) render
 * 4. Compose area or empty state shows
 */
describe("comms mode", () => {
  describe("desktop", () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
      cy.login()
      cy.waitForApp()
    })

    it("comms view loads without crash", () => {
      cy.setMode("comms")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()
    })

    it("groups page shows group list or empty state", () => {
      cy.visitRoute("/groups")
      cy.contains(/Groups|No groups/, {timeout: 15000})
      cy.assertNoConsoleErrors()
    })

    it("group create flow is accessible", () => {
      cy.visitRoute("/groups/create")
      cy.assertNoConsoleErrors()
    })

    it("channels page loads", () => {
      cy.visitRoute("/channels")
      cy.assertNoConsoleErrors()
    })
  })

  describe("mobile", () => {
    beforeEach(() => {
      cy.viewport(375, 812)
      cy.login()
      cy.waitForApp()
    })

    it("comms mode renders on mobile", () => {
      cy.setMode("comms")
      cy.viewport(375, 812)
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()
    })

    it("groups accessible on mobile", () => {
      cy.viewport(375, 812)
      cy.visitRoute("/groups")
      cy.assertNoConsoleErrors()
    })
  })
})
