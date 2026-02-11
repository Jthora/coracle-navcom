#!/usr/bin/env node
// Validate DEFAULT_FOLLOWS (or provided list) for formatting and duplicates.
// Usage: node scripts/validate-follows.mjs npub1... npub1... OR rely on VITE_DEFAULT_FOLLOWS env (comma/space-separated).

import {nip19} from "nostr-tools"

const readFollows = () => {
  const args = process.argv.slice(2)
  if (args.length > 0) return args
  const envList = process.env.VITE_DEFAULT_FOLLOWS || ""
  return envList.split(/[,\s]+/).filter(Boolean)
}

const decode = val => {
  try {
    const {type, data} = nip19.decode(val)
    if (type !== "npub") return {ok: false, reason: `not npub (type=${type})`}
    const hex = Buffer.from(data).toString("hex")
    return {ok: true, hex}
  } catch (e) {
    return {ok: false, reason: e.message}
  }
}

const main = () => {
  const follows = readFollows()
  if (!follows.length) {
    console.error("No follows provided. Pass npubs as args or set VITE_DEFAULT_FOLLOWS.")
    process.exit(1)
  }

  const seen = new Set()
  const dupes = new Set()
  const invalid = []

  for (const f of follows) {
    const res = decode(f)
    if (!res.ok) {
      invalid.push({value: f, reason: res.reason})
      continue
    }
    const key = res.hex.toLowerCase()
    if (seen.has(key)) {
      dupes.add(f)
    }
    seen.add(key)
  }

  console.log(
    `Checked ${follows.length} follows; ${invalid.length} invalid; ${dupes.size} duplicates.`,
  )

  if (invalid.length) {
    console.log("Invalid:")
    invalid.forEach(i => console.log(` - ${i.value}: ${i.reason}`))
  }

  if (dupes.size) {
    console.log("Duplicates:")
    Array.from(dupes).forEach(d => console.log(` - ${d}`))
  }

  if (invalid.length || dupes.size) {
    process.exitCode = 1
  }
}

main()
