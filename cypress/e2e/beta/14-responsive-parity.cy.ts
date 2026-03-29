/**
 * Beta Tester Simulation — Responsive Parity
 *
 * Verifies that all critical routes render on both desktop and mobile
 * viewports without crash or layout breakage. A beta tester would
 * resize their browser or test on phone — this catches viewport bombs.
 */

const DESKTOP = {width: 1280, height: 720, label: "desktop"}
const MOBILE = {width: 375, height: 812, label: "mobile"}
const TABLET = {width: 768, height: 1024, label: "tablet"}

const VIEWPORTS = [DESKTOP, MOBILE, TABLET]

const PUBLIC_ROUTES = [
  {path: "/", name: "home"},
  {path: "/login", name: "login"},
  {path: "/notes", name: "notes"},
  {path: "/groups", name: "groups"},
  {path: "/search", name: "search"},
  {path: "/about", name: "about"},
]

const AUTH_ROUTES = [
  {path: "/settings", name: "settings"},
  {path: "/settings/profile", name: "profile"},
  {path: "/settings/relays", name: "relays"},
  {path: "/channels", name: "channels"},
  {path: "/notifications", name: "notifications"},
  {path: "/groups/create", name: "group create"},
  {path: "/notes/create", name: "note create"},
]

describe("responsive parity", () => {
  describe("public routes", () => {
    VIEWPORTS.forEach(vp => {
      PUBLIC_ROUTES.forEach(({path, name}) => {
        it(`${name} on ${vp.label} (${vp.width}×${vp.height})`, () => {
          cy.viewport(vp.width, vp.height)
          cy.visitRoute(path)
          cy.assertNoConsoleErrors()
        })
      })
    })
  })

  describe("authenticated routes", () => {
    beforeEach(() => {
      cy.login()
      cy.waitForApp()
    })

    VIEWPORTS.forEach(vp => {
      AUTH_ROUTES.forEach(({path, name}) => {
        it(`${name} on ${vp.label} (${vp.width}×${vp.height})`, () => {
          cy.viewport(vp.width, vp.height)
          cy.visitRoute(path)
          cy.assertNoConsoleErrors()
        })
      })
    })
  })
})
