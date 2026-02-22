describe("groups routes smoke", () => {
  const waitForAppReady = () => {
    cy.get("body", {timeout: 20000}).should("not.contain.text", "Loading app…")
  }

  it("opens groups base routes", () => {
    cy.visit("/groups")
    waitForAppReady()
    cy.contains(/Groups|No groups available yet/, {timeout: 20000})

    cy.visit("/groups/create")
    waitForAppReady()
    cy.contains("Group Setup", {timeout: 20000})
  })

  it("keeps unsupported settings routes safe", () => {
    cy.visit("/groups/ops/settings")
    waitForAppReady()
    cy.url({timeout: 20000}).should("include", "/groups")
    cy.contains(
      /This group link is incomplete or invalid|Settings and moderation only work for relay-addressed groups/,
      {timeout: 20000},
    )
    cy.contains(/Open Join Flow|Open Group Chat/, {timeout: 20000})
  })

  it("keeps chat route recoverable even when group is missing", () => {
    cy.visit("/groups/ops/chat")
    waitForAppReady()
    cy.url({timeout: 20000}).should("include", "/groups/ops/chat")
    cy.contains(/Group Chat|Group not found/, {timeout: 20000})
  })
})
