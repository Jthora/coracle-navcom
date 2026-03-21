import {mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"
import {extractOutstandingStage2Tasks} from "./loader-stage2-priorities.mjs"

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

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

const actionMap = {
  "2.2.1.1": {
    action:
      "Capture baseline runs for all required surfaces, refresh artifacts, and sync Doc 03 baseline table.",
    commands: [
      "pnpm benchmark:loader:baseline:capture-loop -- --iterations=5",
      "pnpm benchmark:loader:baseline:refresh-and-sync",
    ],
    evidence: [
      "docs/loader/performance-plan/cache/baseline-summary.json",
      "docs/loader/performance-plan/03-Baseline-Benchmark-Report.md",
    ],
  },
  "2.2.1.2": {
    action: "Update reproduction conditions and environment details, then refresh report sync.",
    commands: ["pnpm benchmark:loader:baseline:refresh-and-sync"],
    evidence: [
      "docs/loader/performance-plan/03-Baseline-Benchmark-Report.md",
      "docs/loader/performance-plan/cache/baseline-runs.json",
    ],
  },
  "2.2.2.1": {
    action:
      "Validate diagnostic discriminators from current traces and confirm usefulness outputs.",
    commands: [
      "pnpm benchmark:loader:baseline:validate-telemetry",
      "pnpm benchmark:loader:baseline:diagnose",
      "pnpm benchmark:loader:baseline:assess-usefulness",
    ],
    evidence: [
      "docs/loader/performance-plan/cache/baseline-telemetry-validation.json",
      "docs/loader/performance-plan/cache/baseline-diagnosability.json",
      "docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json",
    ],
  },
}

const trackerPath = resolve(
  process.cwd(),
  getArgValue("--tracker", "docs/loader/performance-plan/progress-tracker.md"),
)
const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/loader/performance-plan/cache/baseline-priority-checklist.json"),
)
const markdownPath = resolve(
  process.cwd(),
  getArgValue("--markdown", "docs/loader/performance-plan/cache/baseline-priority-checklist.md"),
)
const maxItems = toPositiveInteger(getArgValue("--max-items", "3"), 3)

const tracker = readFileSync(trackerPath, "utf8")
const prioritizedOutstandingTasks = extractOutstandingStage2Tasks(tracker).slice(0, maxItems)

const checklist = prioritizedOutstandingTasks.map(task => {
  const mapped = actionMap[task.id]

  return {
    id: task.id,
    title: task.title,
    action:
      mapped?.action ||
      "Review tracker task details and execute the next documented stage commands.",
    commands: Array.isArray(mapped?.commands) ? mapped.commands : [],
    evidence: Array.isArray(mapped?.evidence) ? mapped.evidence : [],
  }
})

const result = {
  generatedAt: new Date().toISOString(),
  tracker: trackerPath,
  count: checklist.length,
  items: checklist,
}

const markdownLines = [
  "# Loader Baseline Priority Checklist",
  "",
  `Generated: ${result.generatedAt}`,
  `Tracker: ${trackerPath}`,
  `Items: ${checklist.length}`,
  "",
]

if (checklist.length === 0) {
  markdownLines.push("No outstanding Stage 2 tasks found in tracker.")
} else {
  for (const item of checklist) {
    markdownLines.push(`${item.id} — ${item.title}`)
    markdownLines.push(`- Action: ${item.action}`)

    if (item.commands.length > 0) {
      markdownLines.push("- Commands:")

      for (const command of item.commands) {
        markdownLines.push(`  - \`${command}\``)
      }
    }

    if (item.evidence.length > 0) {
      markdownLines.push("- Evidence:")

      for (const evidencePath of item.evidence) {
        markdownLines.push(`  - ${evidencePath}`)
      }
    }

    markdownLines.push("")
  }
}

mkdirSync(dirname(outputPath), {recursive: true})
mkdirSync(dirname(markdownPath), {recursive: true})

writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
writeFileSync(markdownPath, `${markdownLines.join("\n")}\n`, "utf8")

process.stdout.write(`LOADER_BASELINE_PRIORITY_CHECKLIST_SAVED:${outputPath}\n`)
process.stdout.write(`LOADER_BASELINE_PRIORITY_CHECKLIST_MARKDOWN_SAVED:${markdownPath}\n`)
process.stdout.write(`LOADER_BASELINE_PRIORITY_CHECKLIST_COUNT:${checklist.length}\n`)
