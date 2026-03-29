/**
 * Beta Tester Simulation — Theme Matrix QA
 *
 * Tests a representative sample of the full 4×4×4 theme matrix
 * against key app surfaces. Covers the Shell×Surface cross-product
 * on the home route, plus accent sweep on the groups route.
 *
 * Full matrix = 64 combos × N routes → expensive.
 * This suite tests 16 Shell×Surface combos + 4 accent sweeps = 20 cases.
 */

const SHELLS = ["midnight", "void", "carbon", "nebula"] as const
const SURFACES = ["steel", "obsidian", "graphite", "abyss"] as const
const ACCENTS = ["cyan", "amber", "emerald", "arc"] as const

describe("theme matrix QA", () => {
  describe("shell × surface cross-product (home route)", () => {
    SHELLS.forEach(shell => {
      SURFACES.forEach(surface => {
        it(`${shell}/${surface} — app boots and renders`, () => {
          cy.setTheme({shell, surface, accent: "cyan"})
          cy.visitRoute("/")
          cy.assertShellApplied()
          cy.assertNoConsoleErrors()
        })
      })
    })
  })

  describe("accent sweep on groups route", () => {
    ACCENTS.forEach(accent => {
      it(`accent=${accent} — groups page renders`, () => {
        cy.setTheme({shell: "void", surface: "obsidian", accent})
        cy.visitRoute("/groups")
        cy.assertAccentApplied()
        cy.assertNoConsoleErrors()
      })
    })
  })

  describe("extreme combos on critical routes", () => {
    const extremes = [
      {shell: "midnight", surface: "steel", accent: "arc"},
      {shell: "nebula", surface: "abyss", accent: "amber"},
      {shell: "carbon", surface: "graphite", accent: "emerald"},
      {shell: "void", surface: "obsidian", accent: "cyan"},
    ] as const

    const routes = ["/", "/groups", "/settings", "/notes"]

    extremes.forEach(theme => {
      routes.forEach(route => {
        it(`${theme.shell}/${theme.surface}/${theme.accent} on ${route}`, () => {
          cy.setTheme(theme)
          cy.visitRoute(route)
          cy.assertNoConsoleErrors()
        })
      })
    })
  })
})
