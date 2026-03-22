/**
 * Beta Tester Simulation — Edge Cases & Error Recovery
 *
 * Things a real beta tester would stumble into:
 * 1. 404 / unknown routes
 * 2. Corrupted localStorage
 * 3. Direct deep-link navigation
 * 4. Double-click / rapid navigation
 * 5. Back-button behavior
 */
describe("edge cases and error recovery", () => {
  it("unknown route does not crash the app", () => {
    cy.visitRoute("/this-route-does-not-exist-xyz")
    cy.get("#app").should("exist")
    // Should show something reasonable, not a blank page
    cy.get("body").should("not.be.empty")
  })

  it("corrupted navcom-theme in localStorage does not crash", () => {
    cy.window().then(win => {
      win.localStorage.setItem("ui/navcom-theme", "not-valid-json{{{")
    })
    cy.visitRoute("/")
    cy.get("#app").should("exist")
    cy.assertNoConsoleErrors()
  })

  it("corrupted navcom-mode in localStorage does not crash", () => {
    cy.window().then(win => {
      win.localStorage.setItem("ui/navcom-mode", '"invalid-mode"')
    })
    cy.visitRoute("/")
    cy.get("#app").should("exist")
    cy.assertNoConsoleErrors()
  })

  it("empty localStorage produces clean boot", () => {
    cy.clearLocalStorage()
    cy.visitRoute("/")
    cy.get("#app").should("exist")
    cy.assertNoConsoleErrors()
  })

  it("deep link to group chat without auth redirects gracefully", () => {
    cy.visitRoute("/groups/test-group-001/chat")
    cy.get("#app").should("exist")
    // Should not show a blank screen — either redirect or show error
    cy.get("body").should("not.be.empty")
    cy.assertNoConsoleErrors()
  })

  it("deep link to channel without auth handles gracefully", () => {
    cy.visitRoute("/channels/test-channel")
    cy.get("#app").should("exist")
    cy.get("body").should("not.be.empty")
  })

  it("invite route without params handles gracefully", () => {
    cy.visitRoute("/invite")
    cy.get("#app").should("exist")
    cy.get("body").should("not.be.empty")
  })

  it("rapid back-forward navigation", () => {
    cy.visitRoute("/")
    cy.visitRoute("/groups")
    cy.visitRoute("/settings/relays")
    cy.go("back")
    cy.waitForApp()
    cy.go("back")
    cy.waitForApp()
    cy.go("forward")
    cy.waitForApp()
    cy.assertNoConsoleErrors()
  })

  it("double-visit to same route is stable", () => {
    cy.visitRoute("/groups")
    cy.visitRoute("/groups")
    cy.assertNoConsoleErrors()
  })

  it("logout route does not crash", () => {
    cy.login()
    cy.visitRoute("/logout")
    cy.get("#app").should("exist")
  })
})
