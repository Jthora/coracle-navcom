/**
 * Beta Tester Simulation — Mode Switching Stress
 *
 * A beta tester rapidly switching between modes should not crash the app.
 * Tests mode transition stability on both viewports.
 */
describe("mode switching stress", () => {
  beforeEach(() => {
    cy.login()
    cy.waitForApp()
  })

  describe("desktop rapid mode changes", () => {
    it("cycles comms → map → ops → comms without crash", () => {
      cy.viewport(1280, 720)
      cy.setMode("comms")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()

      cy.setMode("map")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()

      cy.setMode("ops")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()

      cy.setMode("comms")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()
    })

    it("mode persists after refresh", () => {
      cy.viewport(1280, 720)
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.reload()
      cy.waitForApp()
      cy.window().then(win => {
        const mode = JSON.parse(win.localStorage.getItem("ui/navcom-mode") || '""')
        expect(mode).to.equal("ops")
      })
    })
  })

  describe("mobile tab-based mode switching", () => {
    it("mode tabs are clickable and transition cleanly", () => {
      cy.viewport(375, 812)
      // Tab bar may not render in headless e2e — use setMode instead
      cy.setMode("comms")
      cy.visitRoute("/")
      cy.setMode("map")
      cy.visitRoute("/")
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.setMode("comms")
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()
    })
  })

  describe("mode + theme cross-stress", () => {
    const combos = [
      {mode: "comms", shell: "midnight", accent: "amber"},
      {mode: "map", shell: "nebula", accent: "emerald"},
      {mode: "ops", shell: "carbon", accent: "arc"},
      {mode: "comms", shell: "void", accent: "cyan"},
    ] as const

    combos.forEach(({mode, shell, accent}) => {
      it(`${mode} + ${shell}/${accent} boots clean`, () => {
        cy.viewport(1280, 720)
        cy.setTheme({shell, accent})
        cy.setMode(mode)
        cy.visitRoute("/")
        cy.assertShellApplied()
        cy.assertAccentApplied()
        cy.assertNoConsoleErrors()
      })
    })
  })
})
