// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands"

Cypress.on("window:before:load", win => {
  win.addEventListener("unhandledrejection", event => {
    if (event.reason instanceof Event) {
      event.preventDefault()
      console.warn("Suppressed unhandledrejection Event during e2e", event.reason.type)
    }
  })
})

Cypress.on("uncaught:exception", err => {
  if (err?.message?.includes("An unknown error has occurred: [object Event]")) {
    return false
  }
})

// Alternatively you can use CommonJS syntax:
// require('./commands')
