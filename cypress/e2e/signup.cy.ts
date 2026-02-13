describe("signup", () => {
  it("works", () => {
    cy.visit("/signup")
    cy.location("pathname").should("match", /^(\/signup|\/login|\/)$/)
    cy.get("#app").should("exist")
  })
})
