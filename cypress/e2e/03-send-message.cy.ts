describe("send message", () => {
  beforeEach(() => {
    cy.login()
  })

  it("groups page loads when logged in", () => {
    cy.visitRoute("/groups")
    cy.get("#app", {timeout: 15000}).should("exist")
    cy.contains(/Groups|Create/, {timeout: 15000})
  })

  it("group create page loads", () => {
    cy.visitRoute("/groups/create")
    cy.get("#app", {timeout: 15000}).should("exist")
  })
})
