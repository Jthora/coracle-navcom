import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"
import {
  buildCompletionMap,
  parseExecutionEntries,
  STAGE4_AGGREGATE_RULES,
  STAGE4_SUBTASK_ROWS,
} from "./lib/groups-upgrade-evidence.mjs"

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

const logPath = resolve(
  process.cwd(),
  getArgValue("--log", "docs/groups/upgrade/18-stage4-controlled-rollout-execution-log.md"),
)
const trackerPath = resolve(
  process.cwd(),
  getArgValue("--tracker", "docs/groups/upgrade/progress-tracker.md"),
)

const dryRun = process.argv.includes("--dry-run")

if (!existsSync(logPath)) {
  throw new Error(`Execution log not found: ${logPath}`)
}

if (!existsSync(trackerPath)) {
  throw new Error(`Tracker file not found: ${trackerPath}`)
}

const entries = parseExecutionEntries(readFileSync(logPath, "utf8"))
const completionById = buildCompletionMap(STAGE4_SUBTASK_ROWS, STAGE4_AGGREGATE_RULES, entries)

const linePattern = /^(\s*-\s*\[)([ x])\](\s+([A-Z0-9-]+)\b.*)$/
const current = readFileSync(trackerPath, "utf8")
const changedItems = []

const next = current
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

    if (marker !== nextMarker) {
      changedItems.push({id, from: marker, to: nextMarker})
    }

    return `${left}${nextMarker}]${right}`
  })
  .join("\n")

if (!dryRun && next !== current) {
  writeFileSync(trackerPath, next, "utf8")
}

process.stdout.write(
  `${JSON.stringify(
    {
      trackerPath,
      logPath,
      dryRun,
      changed: changedItems,
      completion: Object.fromEntries(completionById),
      wroteFile: !dryRun && next !== current,
    },
    null,
    2,
  )}\n`,
)
