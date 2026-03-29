/**
 * Service Worker Background Sync for Offline Message Queue (4.5.3.g)
 *
 * Registers a "sync" event with the Service Worker so that queued
 * messages can be drained even when the app is backgrounded (PWA).
 *
 * Falls back silently to the existing online/offline event watcher
 * if the Background Sync API is unavailable.
 */

const SYNC_TAG = "navcom-outbox-drain"

/**
 * Check if the Background Sync API is available.
 */
export function isBackgroundSyncSupported(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window
}

/**
 * Register a one-shot background sync.
 * When the browser regains connectivity, the SW will fire the "sync" event.
 * The SW handler (in the service worker file) should call drainQueue().
 */
export async function requestBackgroundSync(): Promise<boolean> {
  if (!isBackgroundSyncSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    await (registration as any).sync.register(SYNC_TAG)
    return true
  } catch {
    return false
  }
}

/**
 * Get the sync tag used for registration (for the SW handler).
 */
export function getSyncTag(): string {
  return SYNC_TAG
}

/**
 * Service Worker install snippet — paste into your SW file:
 *
 * ```js
 * import { getSyncTag } from 'src/engine/offline/sw-sync'
 *
 * self.addEventListener('sync', (event) => {
 *   if (event.tag === getSyncTag()) {
 *     event.waitUntil(drainQueue())
 *   }
 * })
 * ```
 *
 * Because the SW runs in a separate context, it needs its own
 * reference to the drain function. The recommended approach is
 * to import the outbox + queue-drain modules directly in the SW.
 */
