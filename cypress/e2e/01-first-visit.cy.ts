describe("first visit", () => {
  it("loads landing page with no session", () => {
    cy.visit("/")
    cy.get("#app", {timeout: 15000}).should("exist")
    cy.get("body").should("not.be.empty")
  })

  it("shows login page", () => {
    cy.visit("/login")
    cy.contains("Welcome!", {timeout: 15000})
  })

  it("shows signup page", () => {
    cy.visit("/signup")
    cy.get("#app", {timeout: 15000}).should("exist")
    // Should either show onboarding or redirect to login
    cy.location("pathname").should("match", /^\/(signup|login)$/)
  })
})
