import {readFileSync} from "node:fs"
import {resolve} from "node:path"

const defaultPath = "docs/cache/groups-flaky-quarantine.json"

const args = process.argv.slice(2)
const fileArg = args.find(arg => arg.startsWith("--file="))
const maxArg = args.find(arg => arg.startsWith("--max="))
const filePath = resolve(process.cwd(), (fileArg ? fileArg.slice(7) : defaultPath).trim())

const parsedMax = maxArg ? Number.parseInt(maxArg.slice(6), 10) : null

const fail = message => {
  console.error(`[groups-flaky-budget] ${message}`)
  process.exit(1)
}

let raw

try {
  raw = readFileSync(filePath, "utf8")
} catch (error) {
  fail(`Unable to read quarantine file at ${filePath}`)
}

let payload

try {
  payload = JSON.parse(raw)
} catch (error) {
  fail("Quarantine file is not valid JSON")
}

if (!payload || typeof payload !== "object") {
  fail("Quarantine payload must be an object")
}

const maxQuarantined = parsedMax ?? payload.maxQuarantined

if (!Number.isInteger(maxQuarantined) || maxQuarantined < 0) {
  fail("maxQuarantined must be a non-negative integer")
}

if (!Array.isArray(payload.quarantinedSpecs)) {
  fail("quarantinedSpecs must be an array")
}

const nowIsoDate = new Date().toISOString().slice(0, 10)
const expiredEntries = []

for (const entry of payload.quarantinedSpecs) {
  if (!entry || typeof entry !== "object") {
    fail("Each quarantined spec entry must be an object")
  }

  if (typeof entry.spec !== "string" || entry.spec.trim().length === 0) {
    fail("Each quarantined spec entry must include a non-empty spec")
  }

  if (typeof entry.reason !== "string" || entry.reason.trim().length === 0) {
    fail(`Quarantine entry ${entry.spec} is missing reason`)
  }

  if (typeof entry.owner !== "string" || entry.owner.trim().length === 0) {
    fail(`Quarantine entry ${entry.spec} is missing owner`)
  }

  if (typeof entry.expiresOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.expiresOn)) {
    fail(`Quarantine entry ${entry.spec} has invalid expiresOn (expected YYYY-MM-DD)`)
  }

  if (entry.expiresOn < nowIsoDate) {
    expiredEntries.push(entry.spec)
  }
}

if (payload.quarantinedSpecs.length > maxQuarantined) {
  fail(
    `Quarantine budget exceeded: ${payload.quarantinedSpecs.length}/${maxQuarantined}. Reduce quarantined specs before merge.`,
  )
}

if (expiredEntries.length > 0) {
  fail(`Expired quarantine entries detected: ${expiredEntries.join(", ")}`)
}

console.log(
  `[groups-flaky-budget] OK: ${payload.quarantinedSpecs.length}/${maxQuarantined} quarantined specs in ${filePath}`,
)
