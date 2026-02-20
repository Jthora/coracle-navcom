import {spawnSync} from "node:child_process"

const hasFlag = name => process.argv.includes(name)

const runShell = command =>
  spawnSync(command, {
    cwd: process.cwd(),
    shell: true,
    encoding: "utf8",
  })

const warnOnly = hasFlag("--warn-only")

const checks = []

const adbPathCheck = runShell("command -v adb")
const adbAvailable = (adbPathCheck.status || 1) === 0

checks.push({
  name: "adb-installed",
  ok: adbAvailable,
  detail: adbAvailable ? (adbPathCheck.stdout || "").trim() : "adb binary not found in PATH",
})

let connectedDeviceIds = []
let dumpsysStatus = null

if (adbAvailable) {
  const devices = runShell("adb devices")
  const lines = `${devices.stdout || ""}`
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)

  connectedDeviceIds = lines
    .filter(line => line !== "List of devices attached")
    .map(line => line.split(/\s+/))
    .filter(parts => parts.length >= 2 && parts[1] === "device")
    .map(parts => parts[0])

  checks.push({
    name: "adb-device-connected",
    ok: connectedDeviceIds.length > 0,
    detail:
      connectedDeviceIds.length > 0
        ? `Connected devices: ${connectedDeviceIds.join(", ")}`
        : "No adb devices in 'device' state",
  })

  if (connectedDeviceIds.length > 0) {
    const dumpsys = runShell("adb shell dumpsys battery")
    const output = `${dumpsys.stdout || ""}`.trim()
    const hasLevel = /(^|\n)\s*level\s*:/i.test(output)
    const hasStatus = /(^|\n)\s*status\s*:/i.test(output)

    dumpsysStatus = (dumpsys.status || 1) === 0 && hasLevel && hasStatus

    checks.push({
      name: "adb-dumpsys-battery",
      ok: dumpsysStatus,
      detail: dumpsysStatus
        ? "adb shell dumpsys battery returned expected level/status fields"
        : "Unable to parse expected battery fields from adb dumpsys battery output",
    })
  }
}

const missing = checks.filter(check => !check.ok)
const ready = missing.length === 0

const summary = {
  generatedAt: new Date().toISOString(),
  ready,
  checks,
  connectedDeviceIds,
  notes: [
    "Android low-end/mid pre/post captures require adb plus at least one connected device.",
    "If readiness fails, re-run in warn mode to inspect details while keeping CI/dev scripts non-blocking.",
  ],
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!ready && !warnOnly) {
  process.exit(1)
}
