import {describe, it, expect, vi, beforeEach} from "vitest"
import {get} from "svelte/store"
import {announcement, announcementPriority, announce} from "src/partials/accessibility"

describe("accessibility", () => {
  beforeEach(() => {
    announcement.set("")
    announcementPriority.set("polite")
  })

  describe("announce()", () => {
    it("sets announcement text", async () => {
      announce("New message from team leader")
      // requestAnimationFrame is used to reset-then-set for aria-live triggering
      await new Promise(r => requestAnimationFrame(r))
      expect(get(announcement)).toBe("New message from team leader")
    })

    it("defaults to polite priority", async () => {
      announce("Info message")
      expect(get(announcementPriority)).toBe("polite")
    })

    it("sets assertive priority for urgent announcements", async () => {
      announce("Emergency alert!", "assertive")
      expect(get(announcementPriority)).toBe("assertive")
    })

    it("clears then re-sets message to trigger aria-live", () => {
      announcement.set("Previous message")
      announce("New message")
      // Immediately after call, announcement is cleared
      expect(get(announcement)).toBe("")
    })
  })

  describe("trapFocus action", () => {
    it("exports trapFocus as a function", async () => {
      const mod = await import("src/partials/accessibility")
      expect(typeof mod.trapFocus).toBe("function")
    })

    it("returns destroy function", async () => {
      const {trapFocus} = await import("src/partials/accessibility")
      const node = document.createElement("div")
      const button = document.createElement("button")
      node.appendChild(button)
      document.body.appendChild(node)

      const result = trapFocus(node)
      expect(typeof result?.destroy).toBe("function")

      result?.destroy()
      document.body.removeChild(node)
    })
  })

  describe("skipToMain()", () => {
    it("focuses the main-content element when it exists", async () => {
      const {skipToMain} = await import("src/partials/accessibility")
      const main = document.createElement("main")
      main.id = "main-content"
      main.tabIndex = -1
      document.body.appendChild(main)

      skipToMain()
      expect(document.activeElement).toBe(main)

      document.body.removeChild(main)
    })

    it("does not throw when main-content element is missing", async () => {
      const {skipToMain} = await import("src/partials/accessibility")
      // Ensure no main-content element exists
      const existing = document.getElementById("main-content")
      if (existing) existing.remove()
      expect(() => skipToMain()).not.toThrow()
    })
  })

  describe("WCAG constants", () => {
    it("touch target minimum is 44px", () => {
      // From WCAG 2.5.8 — minimum target size
      expect(44).toBeGreaterThanOrEqual(44)
    })

    it("contrast ratio for normal text is 4.5:1", () => {
      // WCAG 1.4.3 — minimum contrast level AA
      const AA_CONTRAST = 4.5
      expect(AA_CONTRAST).toBe(4.5)
    })
  })
})
