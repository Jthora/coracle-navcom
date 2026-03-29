describe("theme toggle", () => {
  it("defaults to dark theme", () => {
    cy.visit("/")
    cy.get("html", {timeout: 15000}).should("have.class", "dark")
  })

  it("persists theme in localStorage", () => {
    cy.visit("/", {
      onBeforeLoad: win => {
        win.localStorage.setItem("ui/theme", JSON.stringify("light"))
      },
    })
    cy.get("html", {timeout: 15000}).should("not.have.class", "dark")
  })

  it("dark theme restores after reload", () => {
    cy.visit("/", {
      onBeforeLoad: win => {
        win.localStorage.setItem("ui/theme", JSON.stringify("dark"))
      },
    })
    cy.get("html", {timeout: 15000}).should("have.class", "dark")
    cy.reload()
    cy.get("html", {timeout: 15000}).should("have.class", "dark")
  })
})
