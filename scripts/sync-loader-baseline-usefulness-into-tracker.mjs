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

const usefulnessPath = resolve(
  process.cwd(),
  getArgValue(
    "--usefulness",
    "docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json",
  ),
)
const trackerPath = resolve(
  process.cwd(),
  getArgValue("--tracker", "docs/loader/performance-plan/progress-tracker.md"),
)
const dryRun = process.argv.includes("--dry-run")

if (!existsSync(usefulnessPath)) {
  throw new Error(`Telemetry usefulness artifact not found: ${usefulnessPath}`)
}

if (!existsSync(trackerPath)) {
  throw new Error(`Tracker file not found: ${trackerPath}`)
}

const usefulness = JSON.parse(readFileSync(usefulnessPath, "utf8"))
const checks = Array.isArray(usefulness?.checks) ? usefulness.checks : []

const completionById = new Map()

for (const check of checks) {
  if (typeof check?.id !== "string") {
    continue
  }

  completionById.set(check.id, Boolean(check.pass))
}

const taskGroups = [
  {
    id: "2.2.2.1",
    subtasks: ["2.2.2.1.1", "2.2.2.1.2", "2.2.2.1.3"],
  },
  {
    id: "2.2.2.2",
    subtasks: ["2.2.2.2.1", "2.2.2.2.2", "2.2.2.2.3"],
  },
]

for (const group of taskGroups) {
  const allSubtasksHaveSignal = group.subtasks.every(subtaskId => completionById.has(subtaskId))

  if (!allSubtasksHaveSignal) {
    continue
  }

  const groupPass = group.subtasks.every(subtaskId => completionById.get(subtaskId) === true)
  completionById.set(group.id, groupPass)
}

const linePattern = /^(\s*-\s*\[)([ x])\](\s+\*\*([0-9]+(?:\.[0-9]+)+)\b.*)$/
const currentTracker = readFileSync(trackerPath, "utf8")
const changed = []

const nextTracker = currentTracker
  .split("\n")
  .map(line => {
    const match = line.match(linePattern)

    if (!match) {
      return line
    }

    const [, left, marker, right, id] = match

    if (!completionById.has(id)) {
      return line
    }

    const nextMarker = completionById.get(id) ? "x" : " "

    if (nextMarker === marker) {
      return line
    }

    changed.push({id, from: marker, to: nextMarker})

    return `${left}${nextMarker}]${right}`
  })
  .join("\n")

if (!dryRun && nextTracker !== currentTracker) {
  writeFileSync(trackerPath, nextTracker, "utf8")
}

process.stdout.write(`LOADER_BASELINE_USEFULNESS_TRACKER_SYNCED:${trackerPath}\n`)
process.stdout.write(`LOADER_BASELINE_USEFULNESS_TRACKER_SOURCE:${usefulnessPath}\n`)
process.stdout.write(`LOADER_BASELINE_USEFULNESS_TRACKER_DRY_RUN:${dryRun}\n`)
process.stdout.write(`LOADER_BASELINE_USEFULNESS_TRACKER_CHANGED_COUNT:${changed.length}\n`)
