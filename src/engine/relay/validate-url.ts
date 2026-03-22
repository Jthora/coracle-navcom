import {isLocalRelay} from "./local-relay"

const PRIVATE_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]

const PRIVATE_PREFIXES = [
  "192.168.",
  "10.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
]

const PRIVATE_SUFFIXES = [".local", ".internal"]

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, "") // strip IPv6 brackets
  if (PRIVATE_HOSTS.includes(lower)) return true
  if (PRIVATE_HOSTS.includes(`[${lower}]`)) return true
  if (PRIVATE_PREFIXES.some(p => lower.startsWith(p))) return true
  if (PRIVATE_SUFFIXES.some(s => lower.endsWith(s))) return true

  // IPv6-mapped IPv4 addresses in dotted notation (e.g., ::ffff:192.168.1.1)
  const v4Mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (v4Mapped) {
    const ipv4 = v4Mapped[1]
    if (PRIVATE_HOSTS.includes(ipv4)) return true
    if (PRIVATE_PREFIXES.some(p => ipv4.startsWith(p))) return true
  }

  // IPv6-mapped IPv4 in hex notation (URL parsers normalize to hex, e.g., ::ffff:c0a8:101)
  const hexMapped = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (hexMapped) {
    const hi = parseInt(hexMapped[1], 16)
    const lo = parseInt(hexMapped[2], 16)
    const a = (hi >> 8) & 0xff
    const b = hi & 0xff
    const c = (lo >> 8) & 0xff
    const d = lo & 0xff
    const ipv4 = `${a}.${b}.${c}.${d}`
    if (PRIVATE_HOSTS.includes(ipv4)) return true
    if (PRIVATE_PREFIXES.some(p => ipv4.startsWith(p))) return true
  }

  return false
}

export function isValidRelayUrl(url: string): boolean {
  return validateRelayUrl(url).valid
}

/**
 * Validate a relay URL and return a descriptive error if invalid.
 * Use this when you need to surface the specific rejection reason to the user.
 */
export function validateRelayUrl(url: string): {valid: boolean; error?: string} {
  if (!url || typeof url !== "string")
    return {valid: false, error: "Relay URL is empty or invalid."}

  // Local relay URLs bypass private-IP and protocol restrictions
  if (isLocalRelay(url)) return {valid: true}

  try {
    const parsed = new URL(url)

    if (parsed.protocol === "wss:") {
      // wss:// always allowed (subject to host checks)
    } else if (parsed.protocol === "ws:") {
      // ws:// only allowed in dev mode
      if (!import.meta.env.DEV) {
        return {
          valid: false,
          error:
            "Secure connection required — this relay does not support encrypted connections (ws:// blocked, use wss://)",
        }
      }
    } else {
      return {
        valid: false,
        error: `Unsupported protocol: ${parsed.protocol} — only wss:// is allowed.`,
      }
    }

    if (isPrivateHost(parsed.hostname)) {
      console.warn(
        `[SecurityAudit] Rejected private-host relay URL: ${url} — hostname resolves to private/internal network`,
      )
      return {
        valid: false,
        error: "Private/internal network addresses are not allowed as relay URLs.",
      }
    }
    if (!parsed.hostname || parsed.hostname.length < 3) {
      return {valid: false, error: "Relay hostname is too short or empty."}
    }

    // Reject raw IP-literal relay URLs (DNS rebinding prevention).
    // Relay URLs should use domain names, not bare IP addresses.
    if (isIpLiteral(parsed.hostname)) {
      console.warn(
        `[SecurityAudit] Rejected IP-literal relay URL: ${url} — use a domain name instead`,
      )
      return {valid: false, error: "Raw IP addresses are not allowed — use a domain name instead."}
    }

    return {valid: true}
  } catch {
    return {valid: false, error: "Could not parse relay URL."}
  }
}

/** Detect whether a hostname is a raw IP address (v4 or v6). */
function isIpLiteral(hostname: string): boolean {
  // IPv4: all digits and dots (e.g., 203.0.113.50)
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true
  // IPv6: contains colons or is bracketed (e.g., [::1], ::ffff:1.2.3.4)
  const bare = hostname.replace(/^\[|\]$/g, "")
  if (bare.includes(":")) return true
  return false
}
