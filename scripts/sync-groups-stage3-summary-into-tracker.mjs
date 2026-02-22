import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

const START = "<!-- GROUPS_STAGE3_SUMMARY_START -->"
const END = "<!-- GROUPS_STAGE3_SUMMARY_END -->"

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

const trackerPath = resolve(
  process.cwd(),
  getArgValue("--tracker", "docs/groups/upgrade/progress-tracker.md"),
)
const summaryPath = resolve(
  process.cwd(),
  getArgValue("--summary", "docs/groups/upgrade/cache/stage3-operational-evidence-summary.json"),
)

const dryRun = process.argv.includes("--dry-run")

if (!existsSync(trackerPath)) {
  throw new Error(`Tracker file not found: ${trackerPath}`)
}

if (!existsSync(summaryPath)) {
  throw new Error(`Summary file not found: ${summaryPath}`)
}

const tracker = readFileSync(trackerPath, "utf8")
const summary = JSON.parse(readFileSync(summaryPath, "utf8"))

const pendingTaskKeys = Array.isArray(summary.pendingTaskKeys) ? summary.pendingTaskKeys : []
const previewPending = pendingTaskKeys.slice(0, 7)

const generatedBlock = [
  START,
  "### Stage 3 Operational Snapshot (Auto-Generated)",
  "",
  `- Generated At: ${summary.generatedAt || "unknown"}`,
  `- Completed Tasks: ${summary.completeTaskCount ?? 0}/${summary.totalTaskCount ?? 0}`,
  `- Pending Tasks: ${summary.pendingTaskCount ?? 0}`,
  `- All Complete: ${summary.allComplete ? "yes" : "no"}`,
  `- Summary JSON: docs/groups/upgrade/cache/stage3-operational-evidence-summary.json`,
  `- Summary MD: docs/groups/upgrade/cache/stage3-operational-evidence-summary.md`,
  ...(previewPending.length > 0
    ? ["- Pending Task Keys (up to 7):", ...previewPending.map(taskKey => `  - ${taskKey}`)]
    : ["- Pending Task Keys (up to 7): none"]),
  END,
  "",
].join("\n")

let next = tracker

if (tracker.includes(START) && tracker.includes(END)) {
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}\\n?`, "m")
  next = tracker.replace(pattern, generatedBlock)
} else {
  const anchor = "## Stage 4 Preparation Notes"

  if (tracker.includes(anchor)) {
    next = tracker.replace(anchor, `${generatedBlock}${anchor}`)
  } else {
    next = `${tracker.trimEnd()}\n\n${generatedBlock}`
  }
}

if (!dryRun && next !== tracker) {
  writeFileSync(trackerPath, next, "utf8")
}

process.stdout.write(
  `${JSON.stringify(
    {
      trackerPath,
      summaryPath,
      dryRun,
      changed: next !== tracker,
      wroteFile: !dryRun && next !== tracker,
      pendingTaskCount: summary.pendingTaskCount ?? null,
      completeTaskCount: summary.completeTaskCount ?? null,
      totalTaskCount: summary.totalTaskCount ?? null,
    },
    null,
    2,
  )}\n`,
)
