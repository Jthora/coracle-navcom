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
  // Svelte store race during hydration in e2e context
  if (err?.message?.includes("is not a store with a 'subscribe' method")) {
    return false
  }
  // DOM Event objects thrown as errors (e.g. WebSocket, network)
  if (err?.message?.includes("[object Event]") || err?.message?.includes('"isTrusted"')) {
    return false
  }
  // Nostr relay connection failures in isolated test environment
  if (err?.message?.includes("WebSocket") || err?.message?.includes("Failed to fetch")) {
    return false
  }
  // Svelte component destroy lifecycle errors during route transitions
  if (err?.message?.includes("Cannot read properties of undefined (reading 'd')")) {
    return false
  }
  // NIP-07 browser extension not available in headless Cypress
  if (err?.message?.includes("Nip07 is not enabled")) {
    return false
  }
  // IndexedDB connection race during route transitions
  if (err?.message?.includes("database connection is closing")) {
    return false
  }
})

// Alternatively you can use CommonJS syntax:
// require('./commands')
