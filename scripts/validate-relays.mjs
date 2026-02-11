#!/usr/bin/env node
// Validate relay health for guided signup defaults.
// Usage: node scripts/validate-relays.mjs wss://relay1 wss://relay2
// If no args, falls back to VITE_DEFAULT_RELAYS (comma-separated) from env.

const {AbortController} = globalThis

const readRelays = () => {
  const args = process.argv.slice(2)
  if (args.length > 0) return args
  const envList = process.env.VITE_DEFAULT_RELAYS || ""
  return envList.split(/[,\s]+/).filter(Boolean)
}

const pingRelay = async url => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)
  const started = Date.now()
  try {
    const res = await fetch(url.replace(/^wss:/, "https:"), {signal: controller.signal})
    clearTimeout(timeout)
    return {url, ok: res.ok, status: res.status, ms: Date.now() - started}
  } catch (e) {
    clearTimeout(timeout)
    return {url, ok: false, status: e.name === "AbortError" ? "timeout" : e.message}
  }
}

const main = async () => {
  const relays = readRelays()
  if (!relays.length) {
    console.error("No relays provided. Pass URLs as args or set VITE_DEFAULT_RELAYS.")
    process.exit(1)
  }

  console.log(`Checking ${relays.length} relay(s)...`)
  const results = await Promise.all(relays.map(pingRelay))

  const ok = results.filter(r => r.ok)
  const bad = results.filter(r => !r.ok)

  for (const r of results) {
    console.log(`${r.ok ? "✅" : "❌"} ${r.url} ${r.status}${r.ms ? ` (${r.ms}ms)` : ""}`)
  }

  console.log(`\nSummary: ${ok.length}/${results.length} responsive`)
  if (bad.length) process.exitCode = 1
}

main()
