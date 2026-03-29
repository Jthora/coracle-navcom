import {describe, it, expect} from "vitest"
import axe from "axe-core"

/**
 * Automated accessibility checks using axe-core.
 * Renders static HTML snapshots of key NavCom UI patterns and asserts
 * zero critical violations.
 *
 * These are NOT component rendering tests (no Svelte runtime).
 * They verify that our HTML structure / ARIA patterns are sound.
 */

function runAxe(html: string) {
  const container = document.createElement("div")
  container.innerHTML = html
  document.body.appendChild(container)

  return axe
    .run(container, {
      rules: {
        region: {enabled: false}, // fragments won't have landmark regions
      },
      resultTypes: ["violations"],
    })
    .finally(() => {
      document.body.removeChild(container)
    })
}

function criticalViolations(results: Awaited<ReturnType<typeof axe.run>>) {
  return results.violations.filter(v => v.impact === "critical")
}

describe("Accessibility — zero critical violations", () => {
  it("mode tab bar pattern", async () => {
    const html = `
      <nav role="tablist" aria-label="Mode navigation">
        <button role="tab" aria-selected="true" aria-controls="panel-ops" id="tab-ops">Ops</button>
        <button role="tab" aria-selected="false" aria-controls="panel-map" id="tab-map">Map</button>
        <button role="tab" aria-selected="false" aria-controls="panel-comms" id="tab-comms">Comms</button>
      </nav>
      <div role="tabpanel" id="panel-ops" aria-labelledby="tab-ops">Content</div>
    `
    const results = await runAxe(html)
    expect(criticalViolations(results)).toEqual([])
  })

  it("channel sidebar pattern", async () => {
    const html = `
      <aside aria-label="Channels">
        <ul role="listbox" aria-label="Group channels">
          <li role="option" aria-selected="true">Alpha Squad</li>
          <li role="option" aria-selected="false">Bravo Unit</li>
          <li role="option" aria-selected="false">Intel Feed</li>
        </ul>
      </aside>
    `
    const results = await runAxe(html)
    expect(criticalViolations(results)).toEqual([])
  })

  it("status bar pattern", async () => {
    const html = `
      <footer role="status" aria-live="polite">
        <span>Connected: 3 relays</span>
        <span>Encryption: ML-KEM-768 + AES-GCM-256</span>
      </footer>
    `
    const results = await runAxe(html)
    expect(criticalViolations(results)).toEqual([])
  })

  it("button with icon has accessible name", async () => {
    const html = `
      <button aria-label="Open map view">
        <i class="fa fa-map" aria-hidden="true"></i>
      </button>
    `
    const results = await runAxe(html)
    expect(criticalViolations(results)).toEqual([])
  })

  it("form input has associated label", async () => {
    const html = `
      <div>
        <label for="message-input">Message</label>
        <input id="message-input" type="text" placeholder="Enter message..." />
      </div>
    `
    const results = await runAxe(html)
    expect(criticalViolations(results)).toEqual([])
  })
})
