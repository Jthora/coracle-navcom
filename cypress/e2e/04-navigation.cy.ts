describe("navigation", () => {
  const routes = [
    {path: "/", label: "home"},
    {path: "/notes", label: "notes"},
    {path: "/groups", label: "groups"},
    {path: "/login", label: "login"},
    {path: "/about", label: "about"},
    {path: "/settings/relays", label: "relays"},
  ]

  routes.forEach(({path, label}) => {
    it(`loads ${label} (${path}) without error`, () => {
      cy.visitRoute(path)
      cy.get("#app", {timeout: 15000}).should("exist")
      cy.get("body").should("not.contain.text", "Failed to load route")
    })
  })

  it("navigates between views on mobile viewport", () => {
    cy.viewport(375, 812)
    cy.visitRoute("/")
    cy.get("#app", {timeout: 15000}).should("exist")
    cy.visitRoute("/groups")
    cy.get("#app", {timeout: 15000}).should("exist")
    cy.visitRoute("/login")
    cy.get("#app", {timeout: 15000}).should("exist")
  })
})
