import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

const START = "<!-- GROUPS_OPS_RUNSTAMP_START -->"
const END = "<!-- GROUPS_OPS_RUNSTAMP_END -->"

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
const stage3SummaryPath = resolve(
  process.cwd(),
  getArgValue(
    "--stage3-summary",
    "docs/groups/upgrade/cache/stage3-operational-evidence-summary.json",
  ),
)
const stage4SummaryPath = resolve(
  process.cwd(),
  getArgValue("--stage4-summary", "docs/groups/upgrade/cache/stage4-rollout-evidence-summary.json"),
)

const dryRun = process.argv.includes("--dry-run")

if (!existsSync(trackerPath)) {
  throw new Error(`Tracker file not found: ${trackerPath}`)
}

if (!existsSync(stage3SummaryPath)) {
  throw new Error(`Stage 3 summary file not found: ${stage3SummaryPath}`)
}

if (!existsSync(stage4SummaryPath)) {
  throw new Error(`Stage 4 summary file not found: ${stage4SummaryPath}`)
}

const tracker = readFileSync(trackerPath, "utf8")
const stage3 = JSON.parse(readFileSync(stage3SummaryPath, "utf8"))
const stage4 = JSON.parse(readFileSync(stage4SummaryPath, "utf8"))
const generatedAt = new Date().toISOString()

const generatedBlock = [
  START,
  "### Operations Refresh Stamp (Auto-Generated)",
  "",
  `- Refreshed At: ${generatedAt}`,
  "- Stage 3 Summary:",
  `  - Generated At: ${stage3.generatedAt || "unknown"}`,
  `  - Completed: ${stage3.completeTaskCount ?? 0}/${stage3.totalTaskCount ?? 0}`,
  `  - Pending: ${stage3.pendingTaskCount ?? 0}`,
  `  - All Complete: ${stage3.allComplete ? "yes" : "no"}`,
  "- Stage 4 Summary:",
  `  - Generated At: ${stage4.generatedAt || "unknown"}`,
  `  - Completed: ${stage4.completeTaskCount ?? 0}/${stage4.totalTaskCount ?? 0}`,
  `  - Pending: ${stage4.pendingTaskCount ?? 0}`,
  `  - All Complete: ${stage4.allComplete ? "yes" : "no"}`,
  "- Source Commands:",
  "  - pnpm groups:stage3:ops:status:sync",
  "  - pnpm groups:stage3:ops:validate",
  "  - pnpm groups:stage4:rollout:status:sync",
  "  - pnpm groups:stage4:rollout:validate",
  END,
  "",
].join("\n")

let next = tracker

if (tracker.includes(START) && tracker.includes(END)) {
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}\\n?`, "m")
  next = tracker.replace(pattern, generatedBlock)
} else {
  const anchor = "## Definition of Done"

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
      stage3SummaryPath,
      stage4SummaryPath,
      dryRun,
      changed: next !== tracker,
      wroteFile: !dryRun && next !== tracker,
      stage3Pending: stage3.pendingTaskCount ?? null,
      stage4Pending: stage4.pendingTaskCount ?? null,
    },
    null,
    2,
  )}\n`,
)
