import {isValidRelayUrl} from "./validate-url"

const parseEnvList = (envValue: string | undefined): string[] => {
  if (!envValue) return []
  return envValue
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
}

const allowlist = parseEnvList(import.meta.env.VITE_RELAY_ALLOWLIST)
const denylist = parseEnvList(import.meta.env.VITE_RELAY_DENYLIST)
const maxCount = Number(import.meta.env.VITE_RELAY_MAX_COUNT) || 8

let activeCount = 0

export function hasAllowlist(): boolean {
  return allowlist.length > 0
}

export function isAllowlisted(url: string): boolean {
  return allowlist.includes(url)
}

export function isDenylisted(url: string): boolean {
  return denylist.includes(url)
}

export function getMaxRelayCount(): number {
  return maxCount
}

export function getActiveCount(): number {
  return activeCount
}

export function setActiveCount(count: number) {
  activeCount = count
}

export function shouldConnect(url: string): boolean {
  if (!isValidRelayUrl(url)) return false
  if (isDenylisted(url)) return false
  if (hasAllowlist() && !isAllowlisted(url)) return false
  if (activeCount >= maxCount) return false
  return true
}
