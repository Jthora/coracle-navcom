/**
 * Local Relay Discovery — Phase A of Mesh Networking (5.6.2.a)
 *
 * Manages a manually-configured or auto-discovered local Nostr relay on the LAN.
 * The local relay URL bypasses private-IP restrictions in validate-url.ts
 * and connects alongside internet relays for store-and-forward operation.
 */

import {Pool} from "@welshman/net"

// ── Configuration ──────────────────────────────────────────────────────

const LOCAL_RELAY_STORAGE_KEY = "navcom/local-relay-url"
const DISCOVERED_RELAYS_KEY = "navcom/discovered-local-relays"
const MDNS_POLL_INTERVAL_MS = 30_000

// ── State ──────────────────────────────────────────────────────────────

let configuredUrl: string | null = null
let discoveredUrls: string[] = []
let connectedUrls: Set<string> = new Set()
let mdnsPollTimer: ReturnType<typeof setInterval> | null = null

// ── Env helpers ────────────────────────────────────────────────────────

function getEnvLocalRelayUrl(): string {
  return (import.meta.env.VITE_LOCAL_RELAY_URL as string) || ""
}

function isAutoDiscoverEnabled(): boolean {
  return (import.meta.env.VITE_LOCAL_RELAY_AUTO_DISCOVER as string) === "true"
}

// ── URL validation (relaxed for local relays) ──────────────────────────

const PRIVATE_IP_PATTERNS = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^127\./, // Loopback
  /^169\.254\./, // Link-local
  /^fc[0-9a-f]{2}:/i, // IPv6 ULA (fc00::/7)
  /^fe80:/i, // IPv6 link-local
  /^::1$/, // IPv6 loopback
]

/**
 * Check whether a URL looks like a valid local WebSocket relay.
 * Accepts ws:// and wss:// on private/LAN addresses only.
 * Rejects public IPs to prevent SSRF via relay configuration.
 */
export function isValidLocalRelayUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") return false
    if (!parsed.hostname || parsed.hostname.length < 1) return false
    const host = parsed.hostname
    if (host === "localhost") return true
    if (host.endsWith(".local")) return true
    return PRIVATE_IP_PATTERNS.some(p => p.test(host))
  } catch {
    return false
  }
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Get the configured local relay URL (env or user-set).
 */
export function getLocalRelayUrl(): string | null {
  if (configuredUrl) return configuredUrl
  const stored =
    typeof localStorage !== "undefined" ? localStorage.getItem(LOCAL_RELAY_STORAGE_KEY) : null
  if (stored && isValidLocalRelayUrl(stored)) return stored
  const env = getEnvLocalRelayUrl()
  if (env && isValidLocalRelayUrl(env)) return env
  return null
}

/**
 * Set a local relay URL (persisted in localStorage).
 */
export function setLocalRelayUrl(url: string | null) {
  if (url && !isValidLocalRelayUrl(url)) return
  configuredUrl = url
  if (typeof localStorage !== "undefined") {
    if (url) {
      localStorage.setItem(LOCAL_RELAY_STORAGE_KEY, url)
    } else {
      localStorage.removeItem(LOCAL_RELAY_STORAGE_KEY)
    }
  }
}

/**
 * Get all known local relay URLs (configured + discovered).
 */
export function getAllLocalRelayUrls(): string[] {
  const urls = new Set<string>()
  const main = getLocalRelayUrl()
  if (main) urls.add(main)
  for (const u of discoveredUrls) urls.add(u)
  return Array.from(urls)
}

/**
 * Get the set of local relay URLs currently connected.
 */
export function getConnectedLocalRelays(): string[] {
  return Array.from(connectedUrls)
}

/**
 * Returns true if the given URL is a recognized local relay URL.
 * Used by pool-gate / validate-url to bypass private-IP blocking.
 */
export function isLocalRelay(url: string): boolean {
  const all = getAllLocalRelayUrls()
  return all.includes(url)
}

/**
 * Connect to all known local relays alongside internet relays.
 * Uses welshman's Pool.get() to open WebSocket connections.
 */
export function connectLocalRelays() {
  const urls = getAllLocalRelayUrls()
  const pool = Pool.get()
  for (const url of urls) {
    if (!connectedUrls.has(url)) {
      try {
        pool.get(url)
        connectedUrls.add(url)
      } catch (e) {
        console.warn(`[local-relay] Failed to connect to ${url}:`, e)
      }
    }
  }
}

/**
 * Disconnect all local relays.
 */
export function disconnectLocalRelays() {
  connectedUrls.clear()
}

// ── mDNS Discovery ─────────────────────────────────────────────────────
// Browser cannot do raw mDNS, so in a web context this is a no-op.
// In a Capacitor/native context, a plugin would provide the scan results.
// This module provides the ingestion API and a poll-based hook.

export interface LocalRelayDiscoveryResult {
  url: string
  name?: string
  host: string
  port: number
}

/**
 * Ingest discovery results (e.g., from a Capacitor mDNS plugin callback).
 * Returns count of newly added relays.
 */
export function ingestDiscoveredRelays(results: LocalRelayDiscoveryResult[]): number {
  let added = 0
  for (const r of results) {
    const url = r.url || `ws://${r.host}:${r.port}`
    if (isValidLocalRelayUrl(url) && !discoveredUrls.includes(url)) {
      discoveredUrls.push(url)
      added++
    }
  }
  if (added > 0 && typeof localStorage !== "undefined") {
    localStorage.setItem(DISCOVERED_RELAYS_KEY, JSON.stringify(discoveredUrls))
  }
  return added
}

/**
 * Load previously discovered relays from localStorage.
 */
export function loadDiscoveredRelays() {
  if (typeof localStorage === "undefined") return
  try {
    const stored = localStorage.getItem(DISCOVERED_RELAYS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        discoveredUrls = parsed.filter(isValidLocalRelayUrl)
      }
    }
  } catch {
    // ignore corrupt data
  }
}

/**
 * Start polling for local relay discovery (native contexts only).
 * In browser, this loads stored relays and auto-connects if configured.
 */
export function startLocalRelayDiscovery() {
  loadDiscoveredRelays()

  const main = getLocalRelayUrl()
  if (main || discoveredUrls.length > 0) {
    connectLocalRelays()
  }

  // In a Capacitor context, a real mDNS scan plugin would be polled here.
  // For now, just periodically re-connect to handle transient disconnections.
  if (isAutoDiscoverEnabled() && !mdnsPollTimer) {
    mdnsPollTimer = setInterval(() => {
      connectLocalRelays()
    }, MDNS_POLL_INTERVAL_MS)
  }
}

/**
 * Stop local relay discovery polling.
 */
export function stopLocalRelayDiscovery() {
  if (mdnsPollTimer) {
    clearInterval(mdnsPollTimer)
    mdnsPollTimer = null
  }
}

/**
 * Clear all discovered relays and disconnect.
 */
export function clearDiscoveredRelays() {
  discoveredUrls = []
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(DISCOVERED_RELAYS_KEY)
  }
}

// For testing — reset module state
export function _resetForTest() {
  configuredUrl = null
  discoveredUrls = []
  connectedUrls = new Set()
  stopLocalRelayDiscovery()
}
