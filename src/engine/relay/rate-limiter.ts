/**
 * Client-side relay event rate limiter.
 *
 * Tracks events-per-second per relay URL using a sliding window.
 * When a relay exceeds the threshold, events are dropped until the
 * window clears. Critical event kinds (key rotation, group admin)
 * bypass rate limiting via priority lanes.
 */

const DEFAULT_WINDOW_MS = 1_000
const DEFAULT_THRESHOLD = 100 // events per window per relay
const ADAPTIVE_RAMP_FACTOR = 1.5 // how much to increase threshold for steady traffic
const ADAPTIVE_MAX_THRESHOLD = 500 // absolute ceiling even for adaptive relays
const STEADY_WINDOWS_FOR_RAMP = 5 // consecutive non-limited windows before ramping

/** Event kinds that bypass rate limiting (priority lane). */
const CRITICAL_KINDS = new Set([
  0, // metadata
  3, // contacts
  10002, // relay list
  27, // group admin
  9735, // zap receipt
  30078, // app-specific data (key rotation)
])

type RelayWindow = {
  count: number
  windowStart: number
  totalDropped: number
  /** Per-relay adaptive threshold (ramps up for steady high-traffic relays). */
  adaptiveThreshold: number
  /** Count of consecutive windows that hit >50% of threshold without being limited. */
  steadyWindows: number
}

export class RelayRateLimiter {
  private windows = new Map<string, RelayWindow>()
  private windowMs: number
  private threshold: number

  constructor(threshold = DEFAULT_THRESHOLD, windowMs = DEFAULT_WINDOW_MS) {
    this.threshold = threshold
    this.windowMs = windowMs
  }

  /**
   * Check whether an event from a relay should be accepted.
   * Returns true if accepted, false if rate-limited (dropped).
   */
  allow(relayUrl: string, eventKind?: number): boolean {
    // Critical events always pass
    if (eventKind !== undefined && CRITICAL_KINDS.has(eventKind)) {
      return true
    }

    const now = Date.now()
    const window = this.windows.get(relayUrl)

    if (!window || now - window.windowStart >= this.windowMs) {
      // New or expired window — adapt threshold based on previous steady traffic
      const prevWindow = window
      let adaptiveThreshold = this.threshold
      let steadyWindows = 0

      if (prevWindow) {
        adaptiveThreshold = prevWindow.adaptiveThreshold
        // If previous window had high but sub-threshold traffic (>50%), count as steady
        const wasHighTraffic = prevWindow.count > prevWindow.adaptiveThreshold * 0.5
        const wasNotLimited = prevWindow.count <= prevWindow.adaptiveThreshold
        if (wasHighTraffic && wasNotLimited) {
          steadyWindows = prevWindow.steadyWindows + 1
          // Ramp up threshold after sustained steady traffic
          if (steadyWindows >= STEADY_WINDOWS_FOR_RAMP) {
            adaptiveThreshold = Math.min(
              Math.floor(adaptiveThreshold * ADAPTIVE_RAMP_FACTOR),
              ADAPTIVE_MAX_THRESHOLD,
            )
            steadyWindows = 0
          }
        } else {
          // Reset steady counter (traffic dropped or was limited)
          steadyWindows = 0
          // Decay back toward default if traffic was low
          if (prevWindow.count <= this.threshold * 0.3) {
            adaptiveThreshold = Math.max(this.threshold, Math.floor(adaptiveThreshold * 0.8))
          }
        }
      }

      this.windows.set(relayUrl, {
        count: 1,
        windowStart: now,
        totalDropped: prevWindow?.totalDropped || 0,
        adaptiveThreshold,
        steadyWindows,
      })
      return true
    }

    window.count++

    if (window.count > window.adaptiveThreshold) {
      window.totalDropped++
      if (window.totalDropped % 100 === 1) {
        console.warn(
          `[RateLimiter] Relay ${relayUrl} rate-limited: ${window.totalDropped} total events dropped (threshold: ${window.adaptiveThreshold}/s)`,
        )
      }
      return false
    }

    return true
  }

  /** Get drop statistics for a relay. */
  getStats(relayUrl: string): {totalDropped: number; currentRate: number} {
    const window = this.windows.get(relayUrl)
    if (!window) return {totalDropped: 0, currentRate: 0}

    const elapsed = Math.max(1, Date.now() - window.windowStart)
    const currentRate = Math.round((window.count / elapsed) * 1000)
    return {totalDropped: window.totalDropped, currentRate}
  }

  /** Check if a relay is currently being rate-limited. */
  isLimited(relayUrl: string): boolean {
    const window = this.windows.get(relayUrl)
    if (!window) return false
    if (Date.now() - window.windowStart >= this.windowMs) return false
    return window.count > window.adaptiveThreshold
  }

  /** Reset all rate limiter state. */
  reset(): void {
    this.windows.clear()
  }

  /** Get the current adaptive threshold for a relay (may differ from default). */
  getAdaptiveThreshold(relayUrl: string): number {
    return this.windows.get(relayUrl)?.adaptiveThreshold ?? this.threshold
  }
}

/** Shared instance for relay event ingestion rate limiting. */
export const relayRateLimiter = new RelayRateLimiter()
