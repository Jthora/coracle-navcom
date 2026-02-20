import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

const getArgValue = (name, fallback) => {
  const prefix = `${name}=`
  const direct = process.argv.find(argument => argument.startsWith(prefix))

  if (direct) {
    return direct.slice(prefix.length)
  }

  const index = process.argv.findIndex(argument => argument === name)

  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1]
  }

  return fallback
}

const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/power-metrics.ndjson"),
)
const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/security/pqc/cache/power-metrics-summary.json"),
)
const label = getArgValue("--label", "pqc-sustained")
const modeFilter = getArgValue("--mode", "")
const profileFilter = getArgValue("--profile", "")
const beforePhase = getArgValue("--before-phase", "pre")
const afterPhase = getArgValue("--after-phase", "post")

const readEntries = () => {
  if (!existsSync(inputPath)) {
    return []
  }

  const content = readFileSync(inputPath, "utf8").trim()

  if (!content) {
    return []
  }

  return content
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

const parseAndroidBatteryDump = dump => {
  if (typeof dump !== "string" || !dump.trim()) {
    return null
  }

  const lines = dump.split("\n").map(line => line.trim())
  const readNumber = key => {
    const line = lines.find(entry => entry.toLowerCase().startsWith(`${key.toLowerCase()}:`))

    if (!line) {
      return null
    }

    const value = line.split(":").slice(1).join(":").trim()
    const parsed = Number.parseFloat(value)

    return Number.isFinite(parsed) ? parsed : null
  }

  const readText = key => {
    const line = lines.find(entry => entry.toLowerCase().startsWith(`${key.toLowerCase()}:`))

    return line ? line.split(":").slice(1).join(":").trim() : null
  }

  return {
    level: readNumber("level"),
    temperature_tenths_c: readNumber("temperature"),
    voltage_mv: readNumber("voltage"),
    status: readText("status"),
    health: readText("health"),
  }
}

const diffNumber = (before, after) => {
  if (!Number.isFinite(before) || !Number.isFinite(after)) {
    return null
  }

  return after - before
}

const entries = readEntries()
const scopedEntries = entries.filter(entry => {
  if (entry?.label !== label) {
    return false
  }

  if (modeFilter && entry?.mode !== modeFilter) {
    return false
  }

  if (profileFilter && entry?.profile !== profileFilter) {
    return false
  }

  return true
})

const sorted = scopedEntries
  .slice()
  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

const findByPhase = phase => sorted.filter(entry => entry?.phase === phase)

const beforeCandidates = findByPhase(beforePhase)
const afterCandidates = findByPhase(afterPhase)

const before = beforeCandidates[0] || sorted[0] || null
const after = afterCandidates[afterCandidates.length - 1] || sorted[sorted.length - 1] || null

const pairingStrategy =
  beforeCandidates.length > 0 && afterCandidates.length > 0
    ? "phase-matched"
    : "time-range-fallback"

const beforeAndroid =
  before?.mode === "android" ? parseAndroidBatteryDump(before.battery_dump) : null
const afterAndroid = after?.mode === "android" ? parseAndroidBatteryDump(after.battery_dump) : null

const beforeBattery = before?.battery || beforeAndroid
const afterBattery = after?.battery || afterAndroid

const summary = {
  generatedAt: new Date().toISOString(),
  inputPath,
  outputPath,
  label,
  modeFilter: modeFilter || null,
  profileFilter: profileFilter || null,
  expectedPhases: {
    before: beforePhase,
    after: afterPhase,
  },
  pairingStrategy,
  sampleCount: sorted.length,
  before: before
    ? {
        timestamp: before.timestamp,
        mode: before.mode,
        phase: before.phase ?? null,
        profile: before.profile ?? null,
        load_1: Number.isFinite(before.load_1) ? before.load_1 : null,
        mem_available_kb: Number.isFinite(before.mem_available_kb) ? before.mem_available_kb : null,
        battery: beforeBattery,
      }
    : null,
  after: after
    ? {
        timestamp: after.timestamp,
        mode: after.mode,
        phase: after.phase ?? null,
        profile: after.profile ?? null,
        load_1: Number.isFinite(after.load_1) ? after.load_1 : null,
        mem_available_kb: Number.isFinite(after.mem_available_kb) ? after.mem_available_kb : null,
        battery: afterBattery,
      }
    : null,
  deltas: {
    batteryCapacityPoints: diffNumber(beforeBattery?.capacity, afterBattery?.capacity),
    batteryLevelPoints: diffNumber(beforeBattery?.level, afterBattery?.level),
    temperatureTenthsC: diffNumber(
      beforeBattery?.temperature_tenths_c,
      afterBattery?.temperature_tenths_c,
    ),
    voltageMv: diffNumber(beforeBattery?.voltage_mv, afterBattery?.voltage_mv),
    linuxPowerUw: diffNumber(beforeBattery?.power_uw, afterBattery?.power_uw),
    linuxCurrentUa: diffNumber(beforeBattery?.current_ua, afterBattery?.current_ua),
    load1: diffNumber(before?.load_1, after?.load_1),
    memAvailableKb: diffNumber(before?.mem_available_kb, after?.mem_available_kb),
  },
  notes: [
    "For accurate battery impact, provide pre and post snapshots on the same mode/profile.",
    "Android deltas require adb dumpsys battery snapshots in power-metrics.ndjson.",
    pairingStrategy === "time-range-fallback"
      ? "Expected phase-tagged snapshots were not both found; analyzer used earliest/latest samples."
      : "Phase-tagged snapshots matched using before/after phase filters.",
  ],
}

writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
