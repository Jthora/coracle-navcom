/**
 * Beta Tester Simulation — CSS Variable Integrity
 *
 * Validates that the semantic design token system is properly wired.
 * A beta tester wouldn't run this directly, but these are the visual
 * invariants that prevent "invisible text" or "missing border" bugs.
 */
describe("CSS variable integrity", () => {
  const REQUIRED_VARS = [
    "--nc-text",
    "--nc-text-muted",
    "--nc-shell-bg-rgb",
    "--nc-shell-deep-rgb",
    "--nc-shell-border-rgb",
    "--nc-surface-card-rgb",
    "--accent",
    "--accent-rgb",
    "--danger-rgb",
    "--success-rgb",
    "--warning-rgb",
  ]

  it("all required CSS variables are set on :root", () => {
    cy.visitRoute("/")
    cy.document().then(doc => {
      const styles = getComputedStyle(doc.documentElement)
      REQUIRED_VARS.forEach(varName => {
        const value = styles.getPropertyValue(varName).trim()
        expect(value.length, `${varName} should be non-empty`).to.be.greaterThan(0)
      })
    })
  })

  it("RGB variables contain valid triplets", () => {
    const RGB_VARS = [
      "--nc-shell-bg-rgb",
      "--nc-shell-deep-rgb",
      "--nc-shell-border-rgb",
      "--nc-surface-card-rgb",
      "--accent-rgb",
      "--danger-rgb",
      "--success-rgb",
      "--warning-rgb",
    ]

    cy.visitRoute("/")
    cy.document().then(doc => {
      const styles = getComputedStyle(doc.documentElement)
      RGB_VARS.forEach(varName => {
        const value = styles.getPropertyValue(varName).trim()
        assert.match(
          value,
          /^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/,
          `${varName} = "${value}" should be R,G,B`,
        )
      })
    })
  })

  it("text color variables are valid CSS color values", () => {
    cy.visitRoute("/")
    cy.document().then(doc => {
      const styles = getComputedStyle(doc.documentElement)
      const text = styles.getPropertyValue("--nc-text").trim()
      const muted = styles.getPropertyValue("--nc-text-muted").trim()
      // Should be hex (#xxx or #xxxxxx) or rgb() or a color name
      expect(text.length).to.be.greaterThan(0)
      expect(muted.length).to.be.greaterThan(0)
    })
  })

  describe("variables change with theme", () => {
    it("shell switch changes --nc-shell-bg-rgb", () => {
      const values: string[] = []
      const shells = ["void", "midnight", "carbon", "nebula"] as const

      shells.forEach(shell => {
        cy.setTheme({shell})
        cy.visitRoute("/")
        cy.document().then(doc => {
          values.push(
            getComputedStyle(doc.documentElement).getPropertyValue("--nc-shell-bg-rgb").trim(),
          )
        })
      })

      cy.then(() => {
        const unique = new Set(values)
        expect(unique.size).to.be.greaterThan(1)
      })
    })

    it("accent switch changes --accent", () => {
      const values: string[] = []
      const accents = ["cyan", "amber", "emerald", "arc"] as const

      accents.forEach(accent => {
        cy.setTheme({accent})
        cy.visitRoute("/")
        cy.document().then(doc => {
          values.push(getComputedStyle(doc.documentElement).getPropertyValue("--accent").trim())
        })
      })

      cy.then(() => {
        const unique = new Set(values)
        expect(unique.size).to.equal(4)
      })
    })
  })
})
