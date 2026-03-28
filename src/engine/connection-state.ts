import {writable, derived, type Readable} from "svelte/store"
import {relayHealthTracker} from "src/engine/relay/relay-health"
import {drainQueue} from "src/engine/offline/queue-drain"

// ── Types ──────────────────────────────────────────────────

export type ConnectionMode = "connected" | "sovereign"

export type ConnectionState = {
  mode: ConnectionMode
  since: number // Unix timestamp (seconds) when current mode started
  queuedCount: number // Number of events in outbox
  lastConnectedAt: number // Unix timestamp (seconds) of last connected transition
}

// ── Constants ──────────────────────────────────────────────

export const SOVEREIGN_DEBOUNCE_MS = 3000

// ── Store ──────────────────────────────────────────────────

const now = () => Math.floor(Date.now() / 1000)

const isOnline =
  typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
    ? navigator.onLine
    : true

const initialState: ConnectionState = {
  mode: isOnline ? "connected" : "sovereign",
  since: now(),
  queuedCount: 0,
  lastConnectedAt: now(),
}

export const connectionState = writable<ConnectionState>(initialState)

// ── Derived convenience stores ─────────────────────────────

export const isSovereign: Readable<boolean> = derived(
  connectionState,
  $state => $state.mode === "sovereign",
)

export const connectionMode: Readable<ConnectionMode> = derived(
  connectionState,
  $state => $state.mode,
)

// ── Queue count updater ────────────────────────────────────

export const updateQueuedCount = (count: number) => {
  connectionState.update(s => ({...s, queuedCount: Math.max(0, count)}))
}

// ── Transition functions ───────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const transitionToSovereign = () => {
  relayHealthTracker.pause()
  connectionState.update(s => {
    if (s.mode === "sovereign") return s
    console.log("[ConnectionState] Transitioning to SOVEREIGN mode")
    return {
      ...s,
      mode: "sovereign" as ConnectionMode,
      since: now(),
    }
  })
}

const transitionToConnected = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  relayHealthTracker.resume()
  connectionState.update(s => {
    if (s.mode === "connected") return s
    console.log("[ConnectionState] Transitioning to CONNECTED mode")
    return {
      ...s,
      mode: "connected" as ConnectionMode,
      since: now(),
      lastConnectedAt: now(),
    }
  })
  // Drain queued events on reconnect
  drainQueue()
}

const evaluateConnection = () => {
  const online = typeof navigator !== "undefined" ? navigator.onLine : true

  if (!online) {
    // Browser says offline — debounce transition
    if (!debounceTimer) {
      debounceTimer = setTimeout(transitionToSovereign, SOVEREIGN_DEBOUNCE_MS)
    }
    return
  }

  // Browser says online — check relay health for captive portal detection
  const metrics = relayHealthTracker.getAllMetrics()
  if (metrics.length > 0 && metrics.every(m => m.demoted)) {
    if (!debounceTimer) {
      debounceTimer = setTimeout(transitionToSovereign, SOVEREIGN_DEBOUNCE_MS)
    }
    return
  }

  transitionToConnected()
}

// ── Lifecycle ──────────────────────────────────────────────

let cleanupFn: (() => void) | null = null

/**
 * Start monitoring connection state.
 * Call once at app startup. Returns a cleanup function.
 */
export const startConnectionMonitor = (): (() => void) => {
  if (cleanupFn) return cleanupFn

  if (typeof window === "undefined") {
    return () => {}
  }

  const onOnline = () => evaluateConnection()
  const onOffline = () => evaluateConnection()

  window.addEventListener("online", onOnline)
  window.addEventListener("offline", onOffline)

  // Hook into relay health demotion for captive portal detection
  relayHealthTracker.onDemotion(() => evaluateConnection())

  // Initial evaluation
  evaluateConnection()

  cleanupFn = () => {
    window.removeEventListener("online", onOnline)
    window.removeEventListener("offline", onOffline)
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    cleanupFn = null
  }

  return cleanupFn
}
