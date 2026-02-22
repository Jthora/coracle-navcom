describe("groups invite smoke", () => {
  const testPubkey = "c853d879b7376dab1cdcd4faf235a05f680aae42ba620abdd95d619542a5a379"

  const visitInvite = (path: string) => {
    cy.visit(path, {
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
  }

  const waitForAppReady = () => {
    cy.get("body", {timeout: 20000}).should("not.contain.text", "Loading app…")
  }

  it("routes invite payload to join flow with prefilled group id", () => {
    const payload = encodeURIComponent(JSON.stringify([{groupId: "relay.example'ops"}]))

    visitInvite(`/invite?groups=${payload}&people=${testPubkey}`)
    waitForAppReady()
    cy.contains("Open Join Flow", {timeout: 20000}).click()
    cy.url({timeout: 20000}).should("include", "/groups/create")
    cy.url().should("include", "groupId=relay.example%27ops")
    cy.contains("Join Group", {timeout: 20000})
  })

  it("shows join prefill field for group invite", () => {
    visitInvite("/groups/create?groupId=relay.example%27ops")
    waitForAppReady()
    cy.contains("Join Group", {timeout: 20000})
    cy.get("input").first().should("have.value", "relay.example'ops")
  })
})
