/**
 * Service Worker version check — detects stale SW cache and forces reload.
 *
 * Compares the running app version (injected at build time) with the version
 * stored by the previous SW activation. If they mismatch, the app was updated
 * but the SW served a stale cached shell — force reload to pick up the new version.
 */

const SW_VERSION_KEY = "navcom-sw-app-version"

/**
 * Check if the current app version matches the SW-cached version.
 * On mismatch, clears the stale version and reloads the page.
 * Call this once during app initialization.
 */
export function checkSwVersionMismatch(): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return
  if (!("serviceWorker" in navigator)) return

  try {
    const cachedVersion = localStorage.getItem(SW_VERSION_KEY)
    const currentVersion = __APP_VERSION__

    if (cachedVersion && cachedVersion !== currentVersion) {
      console.warn(
        `[SecurityAudit] SW version mismatch: cached=${cachedVersion}, current=${currentVersion}. Reloading.`,
      )
      localStorage.setItem(SW_VERSION_KEY, currentVersion)
      window.location.reload()
      return
    }

    // Store current version for next check
    localStorage.setItem(SW_VERSION_KEY, currentVersion)
  } catch {
    // localStorage unavailable — skip check
  }
}
