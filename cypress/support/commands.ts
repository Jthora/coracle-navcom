const testPubkey = "c853d879b7376dab1cdcd4faf235a05f680aae42ba620abdd95d619542a5a379"

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
      visitRoute(path: string): Chainable<void>
    }
  }
}

Cypress.Commands.add("login", () => {
  cy.visit("/", {
    onBeforeLoad: win => {
      win.localStorage.setItem("pubkey", JSON.stringify(testPubkey))
      win.localStorage.setItem(
        "sessions",
        JSON.stringify({
          [testPubkey]: {
            method: "nip07",
            pubkey: testPubkey,
          },
        }),
      )
    },
  })

  cy.reload()
})

Cypress.Commands.add("visitRoute", (path: string) => {
  cy.visit(path)
  cy.get("#app", {timeout: 15000}).should("exist")
  cy.get("body", {timeout: 15000}).should("not.contain.text", "Loading app…")
})
