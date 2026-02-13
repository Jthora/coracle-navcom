describe("login", () => {
  it("shows login actions", () => {
    cy.visit("/login")
    cy.contains("Welcome!")
    cy.contains("Register (no signer yet)")
    cy.contains("Use Remote Signer")
  })
})
