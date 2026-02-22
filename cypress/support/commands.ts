const testPubkey = "c853d879b7376dab1cdcd4faf235a05f680aae42ba620abdd95d619542a5a379"

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
