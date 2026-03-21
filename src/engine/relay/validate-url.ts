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
  const lower = hostname.toLowerCase()
  if (PRIVATE_HOSTS.includes(lower)) return true
  if (PRIVATE_PREFIXES.some(p => lower.startsWith(p))) return true
  if (PRIVATE_SUFFIXES.some(s => lower.endsWith(s))) return true
  return false
}

export function isValidRelayUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false

  // Local relay URLs bypass private-IP and protocol restrictions
  if (isLocalRelay(url)) return true

  try {
    const parsed = new URL(url)

    if (parsed.protocol === "wss:") {
      // wss:// always allowed (subject to host checks)
    } else if (parsed.protocol === "ws:") {
      // ws:// only allowed in dev mode
      if (!import.meta.env.DEV) return false
    } else {
      return false
    }

    if (isPrivateHost(parsed.hostname)) return false
    if (!parsed.hostname || parsed.hostname.length < 3) return false

    return true
  } catch {
    return false
  }
}
