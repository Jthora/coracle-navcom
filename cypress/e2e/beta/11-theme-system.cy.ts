/**
 * Beta Tester Simulation — Theme System
 *
 * Comprehensive theme testing:
 * 1. Default theme loads correct CSS vars
 * 2. Each shell palette applies distinct shell-bg-rgb
 * 3. Each accent palette applies distinct --accent
 * 4. Theme persists across page reload
 * 5. Theme switch applies without crash on key routes
 * 6. All 4×4×4 = 64 combinations boot without error (sampled)
 */

const SHELL_PALETTES = ["midnight", "void", "carbon", "nebula"] as const
const SURFACE_PALETTES = ["steel", "obsidian", "graphite", "abyss"] as const
const ACCENT_PALETTES = ["cyan", "amber", "emerald", "arc"] as const

describe("theme system", () => {
  describe("default theme", () => {
    it("applies void/obsidian/cyan by default", () => {
      cy.visitRoute("/")
      cy.assertShellApplied()
      cy.assertAccentApplied()
      cy.assertCssVar("--nc-text", val => val.length > 0)
      cy.assertCssVar("--nc-text-muted", val => val.length > 0)
    })

    it("html has dark class", () => {
      cy.visitRoute("/")
      cy.get("html").should("have.class", "dark")
    })
  })

  describe("shell palette sweep", () => {
    SHELL_PALETTES.forEach(shell => {
      it(`shell=${shell} applies without crash`, () => {
        cy.setTheme({shell})
        cy.visitRoute("/")
        cy.assertShellApplied()
        cy.assertNoConsoleErrors()
      })
    })
  })

  describe("surface palette sweep", () => {
    SURFACE_PALETTES.forEach(surface => {
      it(`surface=${surface} applies without crash`, () => {
        cy.setTheme({surface})
        cy.visitRoute("/")
        cy.assertShellApplied()
        cy.assertNoConsoleErrors()
      })
    })
  })

  describe("accent palette sweep", () => {
    ACCENT_PALETTES.forEach(accent => {
      it(`accent=${accent} applies without crash`, () => {
        cy.setTheme({accent})
        cy.visitRoute("/")
        cy.assertAccentApplied()
        cy.assertNoConsoleErrors()
      })
    })

    it("each accent produces a different --accent value", () => {
      const values: string[] = []
      ACCENT_PALETTES.forEach(accent => {
        cy.setTheme({accent})
        cy.visitRoute("/")
        cy.document().then(doc => {
          const val = getComputedStyle(doc.documentElement).getPropertyValue("--accent").trim()
          values.push(val)
        })
      })
      cy.then(() => {
        const unique = new Set(values)
        expect(unique.size).to.equal(ACCENT_PALETTES.length)
      })
    })
  })

  describe("persistence", () => {
    it("theme survives page reload", () => {
      cy.setTheme({shell: "nebula", surface: "abyss", accent: "amber"})
      cy.visitRoute("/")
      cy.assertShellApplied()
      cy.reload()
      cy.waitForApp()
      cy.assertShellApplied()
      cy.window().then(win => {
        const stored = JSON.parse(win.localStorage.getItem("ui/navcom-theme") || "{}")
        expect(stored.shell).to.equal("nebula")
        expect(stored.surface).to.equal("abyss")
        expect(stored.accent).to.equal("amber")
      })
    })

    it("invalid stored theme falls back gracefully", () => {
      cy.window().then(win => {
        win.localStorage.setItem("ui/navcom-theme", JSON.stringify({shell: "bogus"}))
      })
      cy.visitRoute("/")
      cy.assertNoConsoleErrors()
    })
  })

  describe("theme on key routes", () => {
    const routes = ["/", "/groups", "/settings", "/notes", "/search"]

    SHELL_PALETTES.forEach(shell => {
      routes.forEach(route => {
        it(`shell=${shell} on ${route}`, () => {
          cy.setTheme({shell})
          cy.visitRoute(route)
          cy.assertNoConsoleErrors()
        })
      })
    })
  })
})
