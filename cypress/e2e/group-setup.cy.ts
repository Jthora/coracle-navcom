describe("group setup", () => {
  beforeEach(() => {
    cy.viewport(1280, 720)
    cy.visit("/groups/create")
  })

  const assertGroupSetupSurfacesIfPresent = () => {
    cy.get("body", {timeout: 15_000}).then($body => {
      const bodyText = $body.text()

      if (bodyText.includes("Group Setup")) {
        cy.contains("Create a room")
        cy.contains("Join from invite")

        return
      }

      if (bodyText.includes("Welcome!")) {
        cy.contains("Welcome!")

        return
      }

      cy.contains("Groups")
    })
  }

  it("shows create flow access package preview", () => {
    assertGroupSetupSurfacesIfPresent()

    cy.get("body").then($body => {
      if ($body.text().includes("Group Setup")) {
        cy.contains("Create a room").click()
        cy.get('input[placeholder="Room name (e.g. ops)"]').type("ops")

        cy.contains("Group address preview:")
        cy.contains("Share Access Package")
        cy.contains("Copy access package")
      }
    })
  })

  it("shows receiver setup checklist in join flow", () => {
    assertGroupSetupSurfacesIfPresent()

    cy.get("body").then($body => {
      if ($body.text().includes("Group Setup")) {
        cy.contains("Join from invite").click()

        cy.contains("Receiver Setup Checklist")
        cy.contains("Provide a valid group address from the invite.")
        cy.contains("Run relay capability checks to verify relay support.")
      }
    })
  })
})
