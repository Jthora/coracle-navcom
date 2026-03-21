import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

const UNBLOCK_START_MARKER = "<!-- LOADER_UNBLOCK_START -->"
const UNBLOCK_END_MARKER = "<!-- LOADER_UNBLOCK_END -->"

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

const unblockPath = resolve(
  process.cwd(),
  getArgValue("--unblock", "docs/loader/performance-plan/cache/baseline-unblock-checklist.json"),
)
const trackerPath = resolve(
  process.cwd(),
  getArgValue("--tracker", "docs/loader/performance-plan/progress-tracker.md"),
)
const parsedMaxItems = Number.parseInt(getArgValue("--max-items", "3"), 10)
const maxItems = Number.isFinite(parsedMaxItems) && parsedMaxItems > 0 ? parsedMaxItems : 3

const unblockChecklist = existsSync(unblockPath)
  ? JSON.parse(readFileSync(unblockPath, "utf8"))
  : null
const actions = Array.isArray(unblockChecklist?.actions)
  ? unblockChecklist.actions.slice(0, maxItems)
  : []

const unblockLines =
  unblockChecklist === null
    ? ["- Pending (unblock checklist artifact missing)."]
    : actions.length === 0
      ? ["- No active unblock actions."]
      : actions.flatMap((action, index) => {
          const blockerType = action?.blockerType || "unknown"
          const title = action?.title || "Untitled action"
          const detail = action?.detail || "Action required."
          const owner = action?.owner || "TBD"
          const eta = action?.eta || "TBD"
          const nextAction = action?.action || "Review generated artifacts and resolve blockers."

          return [
            `${index + 1}. [${blockerType}] ${title}: ${detail}`,
            `   - Action: ${nextAction}`,
            `   - Owner: ${owner}; ETA: ${eta}`,
          ]
        })

const tracker = readFileSync(trackerPath, "utf8")
const markerRegex = new RegExp(`${UNBLOCK_START_MARKER}[\\s\\S]*?${UNBLOCK_END_MARKER}`, "m")

if (!markerRegex.test(tracker)) {
  throw new Error(
    `Unblock marker section not found in tracker: expected ${UNBLOCK_START_MARKER} ... ${UNBLOCK_END_MARKER}`,
  )
}

const replacement = `${UNBLOCK_START_MARKER}\n${unblockLines.join("\n")}\n${UNBLOCK_END_MARKER}`
const nextTracker = tracker.replace(markerRegex, replacement)

writeFileSync(trackerPath, nextTracker, "utf8")

process.stdout.write(`LOADER_BASELINE_UNBLOCK_SYNCED:${trackerPath}\n`)
process.stdout.write(`LOADER_BASELINE_UNBLOCK_SOURCE:${unblockPath}\n`)
process.stdout.write(`LOADER_BASELINE_UNBLOCK_COUNT:${actions.length}\n`)
