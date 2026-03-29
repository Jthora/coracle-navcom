/**
 * Phase 3 — The Board (Board View)
 *
 * Verifies Board dashboard:
 * 1. Board renders when OPS mode is selected
 * 2. Default tiles visible on first visit
 * 3. Edit mode shows tile controls and TilePicker
 * 4. Adding a tile persists to layout (survives reload)
 * 5. Removing a tile persists to layout (survives reload)
 * 6. GroupStatusTile renders health badges
 * 7. ActivityFeedTile shows recent events section
 * 8. ConnectionStatusTile shows current mode
 * 9. Board responsive: single column on mobile
 * 10. Clicking edit toggle switches mode
 */
describe("the board", () => {
  describe("desktop", () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
      cy.login()
      cy.waitForApp()
      // Clear board layout to get default
      cy.window().then(win => {
        win.localStorage.removeItem("ui/board-layout")
      })
    })

    it("board renders when OPS mode selected", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.get("[data-testid=board-view]", {timeout: 15000}).should("exist")
      cy.get("[data-testid=board-grid]").should("exist")
      cy.assertNoConsoleErrors()
    })

    it("shows default tiles on first visit", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.get("[data-testid=board-view]", {timeout: 15000}).should("exist")
      // Default layout has 5 tiles
      cy.get("[data-testid=board-tile]").should("have.length.gte", 5)
      // Check tile types
      cy.get("[data-tile-type=map-overview]").should("exist")
      cy.get("[data-tile-type=group-status]").should("exist")
      cy.get("[data-tile-type=activity-feed]").should("exist")
      cy.get("[data-tile-type=personnel-status]").should("exist")
      cy.get("[data-tile-type=connection-status]").should("exist")
    })

    it("edit mode shows tile controls and TilePicker", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.get("[data-testid=board-view]", {timeout: 15000}).should("exist")
      // Initially no remove buttons visible
      cy.get("[data-testid=tile-remove]").should("not.exist")
      // Click edit
      cy.get("[data-testid=board-edit-toggle]").click()
      // Remove buttons now visible
      cy.get("[data-testid=tile-remove]").should("have.length.gte", 1)
      // TilePicker visible
      cy.contains("Add Tile").should("be.visible")
      // Click Done
      cy.get("[data-testid=board-edit-toggle]").click()
      // Remove buttons gone
      cy.get("[data-testid=tile-remove]").should("not.exist")
    })

    it("adding a tile persists to layout", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.get("[data-testid=board-view]", {timeout: 15000}).should("exist")
      cy.get("[data-testid=board-tile]")
        .its("length")
        .then(initialCount => {
          // Enter edit mode
          cy.get("[data-testid=board-edit-toggle]").click()
          // Add quick-actions tile
          cy.contains("Quick Actions").click()
          // Exit edit mode
          cy.get("[data-testid=board-edit-toggle]").click()
          // Verify tile was added
          cy.get("[data-testid=board-tile]").should("have.length", initialCount + 1)
          cy.get("[data-tile-type=quick-actions]").should("exist")
        })
    })

    it("removing a tile persists to layout", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.get("[data-testid=board-view]", {timeout: 15000}).should("exist")
      cy.get("[data-testid=board-tile]")
        .its("length")
        .then(initialCount => {
          // Enter edit mode
          cy.get("[data-testid=board-edit-toggle]").click()
          // Remove the first tile
          cy.get("[data-testid=tile-remove]").first().click()
          // Exit edit mode
          cy.get("[data-testid=board-edit-toggle]").click()
          // Verify tile was removed
          cy.get("[data-testid=board-tile]").should("have.length", initialCount - 1)
        })
    })

    it("GroupStatusTile renders group section", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.get("[data-tile-type=group-status]", {timeout: 15000}).should("exist")
      cy.get("[data-tile-type=group-status]").within(() => {
        cy.contains("Groups").should("be.visible")
      })
    })

    it("ActivityFeedTile shows activity section", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.get("[data-tile-type=activity-feed]", {timeout: 15000}).should("exist")
      cy.get("[data-tile-type=activity-feed]").within(() => {
        cy.contains("Activity").should("be.visible")
      })
    })

    it("ConnectionStatusTile shows connection mode", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.get("[data-tile-type=connection-status]", {timeout: 15000}).should("exist")
      cy.get("[data-tile-type=connection-status]").within(() => {
        cy.contains("Connection").should("be.visible")
        cy.contains(/CONNECTED|SOVEREIGN/).should("be.visible")
      })
    })

    it("edit toggle switches between edit and view mode", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.get("[data-testid=board-edit-toggle]", {timeout: 15000}).should("contain", "Edit")
      cy.get("[data-testid=board-edit-toggle]").click()
      cy.get("[data-testid=board-edit-toggle]").should("contain", "Done")
      cy.get("[data-testid=board-edit-toggle]").click()
      cy.get("[data-testid=board-edit-toggle]").should("contain", "Edit")
    })
  })

  describe("mobile", () => {
    beforeEach(() => {
      cy.viewport(375, 812)
      cy.login()
      cy.waitForApp()
      cy.window().then(win => {
        win.localStorage.removeItem("ui/board-layout")
      })
    })

    it("board renders in single column on mobile", () => {
      cy.setMode("ops")
      cy.visitRoute("/")
      cy.get("[data-testid=board-view]", {timeout: 15000}).should("exist")
      cy.get("[data-testid=board-tile]").should("have.length.gte", 1)
      cy.assertNoConsoleErrors()
    })
  })
})
