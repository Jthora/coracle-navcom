import {existsSync, readFileSync} from "node:fs"
import {resolve} from "node:path"

export const PLACEHOLDER_MARKER = "# Paste full output of: adb shell dumpsys battery"

const getLines = batteryDump =>
  batteryDump
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)

const readNumberFromLines = (lines, key) => {
  const line = lines.find(entry => entry.toLowerCase().startsWith(`${key.toLowerCase()}:`))

  if (!line) {
    return null
  }

  const value = line.split(":").slice(1).join(":").trim()
  const parsed = Number.parseFloat(value)

  return Number.isFinite(parsed) ? parsed : null
}

const readTextFromLines = (lines, key) => {
  const line = lines.find(entry => entry.toLowerCase().startsWith(`${key.toLowerCase()}:`))

  return line ? line.split(":").slice(1).join(":").trim() : null
}

export const parseBatteryDump = batteryDump => {
  const lines = getLines(batteryDump)

  return {
    level: readNumberFromLines(lines, "level"),
    temperature: readNumberFromLines(lines, "temperature"),
    voltage: readNumberFromLines(lines, "voltage"),
    status: readTextFromLines(lines, "status"),
  }
}

export const hasRequiredBatteryFields = parsed =>
  Number.isFinite(parsed.level) &&
  Number.isFinite(parsed.temperature) &&
  Number.isFinite(parsed.voltage) &&
  Boolean(parsed.status)

export const isPlaceholderBatteryDump = (batteryDump, parsed = parseBatteryDump(batteryDump)) =>
  batteryDump.includes(PLACEHOLDER_MARKER) ||
  (parsed.level === 0 && parsed.temperature === 0 && parsed.voltage === 0)

export const inspectBatteryDumpFile = filePath => {
  const resolvedPath = resolve(process.cwd(), filePath)

  if (!existsSync(resolvedPath)) {
    return {
      path: resolvedPath,
      exists: false,
      empty: false,
      placeholder: false,
      parsed: null,
      hasRequiredFields: false,
      content: "",
    }
  }

  const content = readFileSync(resolvedPath, "utf8")
  const empty = !content.trim()
  const parsed = parseBatteryDump(content)

  return {
    path: resolvedPath,
    exists: true,
    empty,
    placeholder: isPlaceholderBatteryDump(content, parsed),
    parsed,
    hasRequiredFields: hasRequiredBatteryFields(parsed),
    content,
  }
}
