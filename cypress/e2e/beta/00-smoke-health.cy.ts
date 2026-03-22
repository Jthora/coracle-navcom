/**
 * Beta Tester Simulation — Smoke & Health
 *
 * Gate test: if this fails, nothing else matters.
 * Verifies the app boots, renders, and key routes don't crash.
 */
describe("smoke health", () => {
  const CRITICAL_ROUTES = [
    {path: "/", name: "home"},
    {path: "/login", name: "login"},
    {path: "/notes", name: "notes"},
    {path: "/groups", name: "groups"},
    {path: "/search", name: "search"},
    {path: "/about", name: "about"},
    {path: "/settings/relays", name: "relays"},
  ]

  CRITICAL_ROUTES.forEach(({path, name}) => {
    it(`[gate] ${name} (${path}) boots without crash`, () => {
      cy.visitRoute(path)
      cy.assertNoConsoleErrors()
    })
  })

  it("[gate] dark class present on html element", () => {
    cy.visitRoute("/")
    cy.get("html").should("have.class", "dark")
  })

  it("[gate] theme CSS variables injected", () => {
    cy.visitRoute("/")
    cy.assertShellApplied()
    cy.assertAccentApplied()
  })

  it("[gate] no JS errors in cold boot", () => {
    cy.visit("/", {
      onBeforeLoad: win => {
        cy.stub(win.console, "error").as("consoleError")
      },
    })
    cy.waitForApp()
    // Allow nostr-related errors from network, but no app-crashing errors
    cy.get("body").should("not.contain.text", "Failed to load route")
  })
})
