describe("invite join", () => {
  it("invite route loads without error", () => {
    cy.visitRoute("/invite")
    cy.get("#app", {timeout: 15000}).should("exist")
    // Invite page should render something (may redirect to login for auth)
    cy.get("body").should("not.be.empty")
  })

  it("groups list loads", () => {
    cy.visitRoute("/groups")
    cy.get("#app", {timeout: 15000}).should("exist")
  })
})
