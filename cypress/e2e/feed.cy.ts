describe("feed shell", () => {
  beforeEach(() => {
    cy.viewport(1280, 720)
    cy.visit("/")
  })

  it("loads announcements shell", () => {
    cy.contains("Starcom Announcements")
    cy.contains("Announcements")
    cy.contains("Ops Feed")
  })

  it("opens about route from shell", () => {
    cy.contains("About").click()
    cy.url().should("include", "/about")
  })
})
