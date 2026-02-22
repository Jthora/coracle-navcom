describe("groups smoke", () => {
  const waitForAppReady = () => {
    cy.get("body", {timeout: 20000}).should("not.contain.text", "Loading app…")
  }

  it("loads groups list and create route", () => {
    cy.visit("/groups")
    waitForAppReady()
    cy.contains("Groups", {timeout: 20000})
    cy.contains("Create", {timeout: 20000}).click()
    cy.url({timeout: 20000}).should("include", "/groups/create")
    cy.contains("Group Setup", {timeout: 20000})
  })

  it("shows guided create security copy", () => {
    cy.visit("/groups/create")
    waitForAppReady()
    cy.contains("Create a room", {timeout: 20000}).click()
    cy.contains("Privacy level", {timeout: 20000})
    cy.contains(/PQC-preferred|Compatibility first/, {timeout: 20000})
    cy.contains(/post-quantum-capable transport|compatibility fallback/, {timeout: 20000})
  })

  it("redirects unsupported route with recovery guidance", () => {
    cy.visit("/groups/ops/settings")
    waitForAppReady()
    cy.url({timeout: 20000}).should("include", "/groups")
    cy.contains(
      /This group link is incomplete or invalid|Settings and moderation only work for relay-addressed groups/,
      {timeout: 20000},
    )
    cy.contains(/Open Join Flow|Open Group Chat/, {timeout: 20000})
  })
})
