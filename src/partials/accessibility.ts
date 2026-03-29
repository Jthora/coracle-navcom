/**
 * accessibility.ts — Centralized accessibility utilities for NavCom.
 *
 * Provides:
 * - Screen reader announcement store (`announce`)
 * - Focus trap Svelte action (`trapFocus`)
 * - Focus return utility (`focusReturn`)
 */

import {writable} from "svelte/store"
import type {Action} from "svelte/action"

// ─── Live Region Announcements ──────────────────────────────────────────

/** The current screen reader announcement text. Rendered in a global aria-live region. */
export const announcement = writable("")

/**
 * Announce a message to screen readers via the global live region.
 * Clears then re-sets the message to ensure aria-live fires even if text is identical.
 * @param message — Text to announce
 * @param priority — "polite" (default) or "assertive" for urgent alerts
 */
export function announce(message: string, priority: "polite" | "assertive" = "polite") {
  // Store the priority alongside the message for the live region component
  announcementPriority.set(priority)
  announcement.set("")
  requestAnimationFrame(() => announcement.set(message))
}

/** Current announcement priority — drives aria-live attribute on the region. */
export const announcementPriority = writable<"polite" | "assertive">("polite")

// ─── Focus Trap ─────────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ")

/**
 * Svelte action that traps keyboard focus within a DOM node.
 * - Tab/Shift+Tab cycle within the node
 * - Escape fires an optional `on:escape` event
 * - Focus moves to the first focusable element on mount
 */
export const trapFocus: Action<HTMLElement, void> = (node: HTMLElement) => {
  const previouslyFocused = document.activeElement as HTMLElement | null

  function getFocusableElements(): HTMLElement[] {
    return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Tab") {
      const focusable = getFocusableElements()
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    if (e.key === "Escape") {
      node.dispatchEvent(new CustomEvent("escape"))
    }
  }

  // Focus first element on mount
  requestAnimationFrame(() => {
    const focusable = getFocusableElements()
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  })

  node.addEventListener("keydown", handleKeydown)

  return {
    destroy() {
      node.removeEventListener("keydown", handleKeydown)
      // Return focus to the previously focused element
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus()
      }
    },
  }
}

// ─── Skip Navigation ────────────────────────────────────────────────────

/**
 * Focus the main content area. Called by the skip-to-content link.
 */
export function skipToMain() {
  const main = document.getElementById("main-content")
  if (main) {
    main.focus()
    if (typeof main.scrollIntoView === "function") {
      main.scrollIntoView({block: "start"})
    }
  }
}
