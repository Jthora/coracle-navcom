import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"
import {
  buildSummaryRows,
  parseExecutionEntries,
  STAGE3_SUBTASK_ROWS,
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
  getArgValue("--log", "docs/groups/upgrade/17-stage3-staging-execution-log.md"),
)
const outputJson = resolve(
  process.cwd(),
  getArgValue(
    "--output-json",
    "docs/groups/upgrade/cache/stage3-operational-evidence-summary.json",
  ),
)
const outputMarkdown = resolve(
  process.cwd(),
  getArgValue(
    "--output-markdown",
    "docs/groups/upgrade/cache/stage3-operational-evidence-summary.md",
  ),
)

if (!existsSync(logPath)) {
  throw new Error(`Execution log not found: ${logPath}`)
}

const entries = parseExecutionEntries(readFileSync(logPath, "utf8"))
const rows = buildSummaryRows(STAGE3_SUBTASK_ROWS, entries)

const completeCount = rows.filter(row => row.complete).length
const pendingRows = rows.filter(row => !row.complete)

const summary = {
  generatedAt: new Date().toISOString(),
  logPath,
  totalTaskCount: rows.length,
  completeTaskCount: completeCount,
  pendingTaskCount: pendingRows.length,
  allComplete: pendingRows.length === 0,
  rows,
  pendingTaskKeys: pendingRows.map(row => row.taskKey),
}

const markdown = [
  "# Stage 3 Operational Evidence Summary",
  "",
  `Generated At: ${summary.generatedAt}`,
  `All Complete: ${summary.allComplete ? "yes" : "no"}`,
  `Completed: ${summary.completeTaskCount}/${summary.totalTaskCount}`,
  `Pending: ${summary.pendingTaskCount}`,
  "",
  "| Task Key | Description | Status | Latest Timestamp |",
  "| --- | --- | --- | --- |",
  ...rows.map(
    row =>
      `| ${row.taskKey} | ${row.description} | ${row.status} | ${row.latestTimestamp || "n/a"} |`,
  ),
  "",
]

if (pendingRows.length > 0) {
  markdown.push("## Pending Task Keys", "", ...pendingRows.map(row => `- ${row.taskKey}`), "")
}

mkdirSync(dirname(outputJson), {recursive: true})
mkdirSync(dirname(outputMarkdown), {recursive: true})

writeFileSync(outputJson, `${JSON.stringify(summary, null, 2)}\n`, "utf8")
writeFileSync(outputMarkdown, `${markdown.join("\n")}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
process.stdout.write(`STAGE3_OPERATIONAL_SUMMARY_JSON:${outputJson}\n`)
process.stdout.write(`STAGE3_OPERATIONAL_SUMMARY_MD:${outputMarkdown}\n`)
