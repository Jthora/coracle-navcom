/**
 * Relay trust tiers and health monitoring.
 *
 * Tracks relay connection success/failure rates and assigns trust tiers.
 * Relays with consistently high failure rates are auto-demoted.
 * At least one relay per group is always kept active (circuit-breaker).
 */

export type RelayTrustTier = "verified" | "known" | "unknown"

export type RelayHealthEntry = {
  url: string
  tier: RelayTrustTier
  /** Total successful connections */
  successes: number
  /** Total failed connections */
  failures: number
  /** Timestamp of last successful connection */
  lastSuccess: number
  /** Timestamp of last failure */
  lastFailure: number
  /** Whether this relay has been auto-demoted due to high failure rate */
  demoted: boolean
}

/** Failure rate threshold for auto-demotion (80% failure). */
const DEMOTION_FAILURE_RATE = 0.8
/** Minimum total connections before demotion can trigger. */
const DEMOTION_MIN_CONNECTIONS = 5

/**
 * Curated list of verified relay URLs.
 * These are relays operated by known entities with track records.
 */
const VERIFIED_RELAYS = new Set([
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://relay.primal.net",
])

export class RelayHealthTracker {
  private entries = new Map<string, RelayHealthEntry>()
  private onDemotionCallback: ((url: string) => void) | null = null
  private paused = false

  /** Pause health tracking (e.g., during sovereign mode). */
  pause(): void {
    this.paused = true
  }

  /** Resume health tracking. */
  resume(): void {
    this.paused = false
  }

  /** Register a callback that fires when a relay is auto-demoted. */
  onDemotion(callback: (url: string) => void): void {
    this.onDemotionCallback = callback
  }

  /** Get or create a health entry for a relay URL. */
  private getEntry(url: string): RelayHealthEntry {
    let entry = this.entries.get(url)
    if (!entry) {
      entry = {
        url,
        tier: this.classifyTier(url),
        successes: 0,
        failures: 0,
        lastSuccess: 0,
        lastFailure: 0,
        demoted: false,
      }
      this.entries.set(url, entry)
    }
    return entry
  }

  /** Classify the trust tier for a relay URL. */
  private classifyTier(url: string): RelayTrustTier {
    if (VERIFIED_RELAYS.has(url)) return "verified"
    // Relays the user has explicitly added are "known"
    // New discovery relays are "unknown"
    return "unknown"
  }

  /** Record a successful connection to a relay. */
  recordSuccess(url: string): void {
    if (this.paused) return
    const entry = this.getEntry(url)
    entry.successes++
    entry.lastSuccess = Date.now()
    // Successful connection can lift demotion
    if (entry.demoted && this.getFailureRate(entry) < DEMOTION_FAILURE_RATE * 0.5) {
      entry.demoted = false
    }
  }

  /** Record a failed connection to a relay. */
  recordFailure(url: string): void {
    if (this.paused) return
    const entry = this.getEntry(url)
    entry.failures++
    entry.lastFailure = Date.now()
    this.checkDemotion(entry)
  }

  /** Get the failure rate for a relay (0-1). */
  private getFailureRate(entry: RelayHealthEntry): number {
    const total = entry.successes + entry.failures
    if (total === 0) return 0
    return entry.failures / total
  }

  /** Check if a relay should be auto-demoted. */
  private checkDemotion(entry: RelayHealthEntry): void {
    const total = entry.successes + entry.failures
    if (total < DEMOTION_MIN_CONNECTIONS) return

    if (this.getFailureRate(entry) >= DEMOTION_FAILURE_RATE) {
      entry.demoted = true
      console.warn(
        `[SecurityAudit] Relay auto-demoted due to high failure rate: ${entry.url} ` +
          `(${entry.failures}/${total} failures)`,
      )
      this.onDemotionCallback?.(entry.url)
    }
  }

  /** Mark a relay as "known" (user explicitly added it). */
  markKnown(url: string): void {
    const entry = this.getEntry(url)
    if (entry.tier === "unknown") {
      entry.tier = "known"
    }
  }

  /** Get the health entry for a relay. */
  getHealth(url: string): RelayHealthEntry | undefined {
    return this.entries.get(url)
  }

  /** Get the trust tier for a relay. */
  getTier(url: string): RelayTrustTier {
    return this.getEntry(url).tier
  }

  /** Check if a relay is demoted. */
  isDemoted(url: string): boolean {
    return this.entries.get(url)?.demoted ?? false
  }

  /**
   * Filter relay URLs to exclude demoted relays, but ensure at least
   * one relay remains active (circuit-breaker: never demote all relays).
   */
  filterHealthy(urls: string[]): string[] {
    const healthy = urls.filter(url => !this.isDemoted(url))
    // Circuit breaker: if all relays are demoted, keep them all
    if (healthy.length === 0) return urls
    return healthy
  }

  /** Get health metrics for all tracked relays (for Ops dashboard). */
  getAllMetrics(): RelayHealthEntry[] {
    return Array.from(this.entries.values())
  }

  /** Get connection uptime percentage for a relay. */
  getUptimePercent(url: string): number {
    const entry = this.entries.get(url)
    if (!entry) return 100
    const total = entry.successes + entry.failures
    if (total === 0) return 100
    return Math.round((entry.successes / total) * 100)
  }

  /** Reset all health data. */
  reset(): void {
    this.entries.clear()
  }
}

/** Singleton instance for app-wide relay health tracking. */
export const relayHealthTracker = new RelayHealthTracker()
