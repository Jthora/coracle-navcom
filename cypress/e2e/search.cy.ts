describe("search", () => {
  it("works", () => {
    cy.visit("/search")
    cy.get("input").first().type("hodlbod")
    cy.get(".fa-qrcode").should("exist")
  })
})
