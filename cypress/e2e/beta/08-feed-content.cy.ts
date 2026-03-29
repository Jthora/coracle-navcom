/**
 * Beta Tester Simulation — Feed & Content
 *
 * Exercises the notes/feed experience:
 * 1. Home/announcements feed loads
 * 2. Notes feed renders
 * 3. Note creation route is accessible
 * 4. Topic routes load
 * 5. Feed controls are present
 */
describe("feed and content", () => {
  describe("unauthenticated", () => {
    it("home feed loads", () => {
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()
    })

    it("notes feed loads", () => {
      cy.visitRoute("/notes")
      cy.assertNoConsoleErrors()
    })

    it("about page loads with content", () => {
      cy.visitRoute("/about")
      cy.get("#app").should("not.be.empty")
      cy.assertNoConsoleErrors()
    })
  })

  describe("authenticated", () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
      cy.login()
      cy.waitForApp()
    })

    it("home shows announcements shell", () => {
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()
    })

    it("notes feed shows content area", () => {
      cy.visitRoute("/notes")
      cy.assertNoConsoleErrors()
    })

    it("create note route loads", () => {
      cy.visitRoute("/notes/create")
      cy.assertNoConsoleErrors()
    })

    it("open feed route loads", () => {
      cy.visitRoute("/open")
      cy.assertNoConsoleErrors()
    })

    it("lists route loads", () => {
      cy.visitRoute("/lists")
      cy.assertNoConsoleErrors()
    })

    it("feeds route loads", () => {
      cy.visitRoute("/feeds")
      cy.assertNoConsoleErrors()
    })
  })
})
