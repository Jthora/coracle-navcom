#!/usr/bin/env node
/**
 * CI script: verify every locale file has the same keys as en.json (the source of truth).
 *
 * Usage:
 *   node scripts/check-locale-parity.mjs
 *
 * Exit code 0 = all locale files match en.json keys.
 * Exit code 1 = missing or extra keys found.
 */

import {readFileSync, readdirSync} from "fs"
import {join, basename} from "path"

const LOCALES_DIR = join(import.meta.dirname, "..", "src", "locales")

const enPath = join(LOCALES_DIR, "en.json")
const enKeys = new Set(Object.keys(JSON.parse(readFileSync(enPath, "utf8"))))

const localeFiles = readdirSync(LOCALES_DIR).filter(f => f.endsWith(".json") && f !== "en.json")

let ok = true

for (const file of localeFiles) {
  const otherKeys = new Set(Object.keys(JSON.parse(readFileSync(join(LOCALES_DIR, file), "utf8"))))
  const missing = [...enKeys].filter(k => !otherKeys.has(k))
  const extra = [...otherKeys].filter(k => !enKeys.has(k))

  if (missing.length) {
    console.error(`${file}: missing ${missing.length} keys from en.json:`)
    missing.forEach(k => console.error(`  - ${k}`))
    ok = false
  }
  if (extra.length) {
    console.error(`${file}: ${extra.length} extra keys not in en.json:`)
    extra.forEach(k => console.error(`  + ${k}`))
    ok = false
  }
  if (!missing.length && !extra.length) {
    console.log(`${file}: OK (${otherKeys.size} keys)`)
  }
}

if (localeFiles.length === 0) {
  console.log("No additional locale files found (en.json is the only locale).")
}

process.exit(ok ? 0 : 1)
