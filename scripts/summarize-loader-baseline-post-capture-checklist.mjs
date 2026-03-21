import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"

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

const loadJsonIfExists = path => {
  if (!existsSync(path)) {
    return null
  }

  return JSON.parse(readFileSync(path, "utf8"))
}

const toStatus = value => (value ? "Pass" : "Action required")

const captureStatusPath = resolve(
  process.cwd(),
  getArgValue(
    "--capture-status",
    "docs/loader/performance-plan/cache/baseline-capture-status.json",
  ),
)
const completenessPath = resolve(
  process.cwd(),
  getArgValue("--completeness", "docs/loader/performance-plan/cache/baseline-completeness.json"),
)
const usefulnessPath = resolve(
  process.cwd(),
  getArgValue(
    "--usefulness",
    "docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json",
  ),
)
const issueReviewPath = resolve(
  process.cwd(),
  getArgValue("--issue-review", "docs/loader/performance-plan/cache/baseline-issue-review.json"),
)
const outputPath = resolve(
  process.cwd(),
  getArgValue(
    "--output",
    "docs/loader/performance-plan/cache/baseline-post-capture-checklist.json",
  ),
)
const markdownPath = resolve(
  process.cwd(),
  getArgValue(
    "--markdown",
    "docs/loader/performance-plan/cache/baseline-post-capture-checklist.md",
  ),
)
const strictMode = ["1", "true", "yes"].includes(
  String(getArgValue("--strict", "false")).toLowerCase(),
)

const captureStatus = loadJsonIfExists(captureStatusPath)
const completeness = loadJsonIfExists(completenessPath)
const usefulness = loadJsonIfExists(usefulnessPath)
const issueReview = loadJsonIfExists(issueReviewPath)

const blockers = Array.isArray(issueReview?.blockers) ? issueReview.blockers : []
const blockersSummary = blockers.map(blocker => blocker.type).join(", ")

const checks = [
  {
    id: "capture-target",
    title: "Capture required run volume",
    pass: Boolean(captureStatus?.pass),
    detail: captureStatus
      ? `Progress ${captureStatus.totalCapturedRuns}/${captureStatus.totalRequiredRuns} runs.`
      : "Capture status artifact missing.",
    action: "Use `pnpm benchmark:loader:baseline:capture-next` and continue capture loops.",
  },
  {
    id: "completeness-gate",
    title: "Pass completeness gate",
    pass: Boolean(completeness?.pass),
    detail: completeness
      ? `Completeness issues: ${Array.isArray(completeness.issues) ? completeness.issues.length : "n/a"}.`
      : "Completeness artifact missing.",
    action: "Re-run `pnpm benchmark:loader:baseline:validate-completeness` after additional runs.",
  },
  {
    id: "usefulness-gate",
    title: "Pass telemetry usefulness gate",
    pass: Boolean(usefulness?.pass),
    detail: usefulness
      ? `Checklist: ${Array.isArray(usefulness.checks) ? usefulness.checks.filter(check => check.pass).length : "n/a"}/${Array.isArray(usefulness.checks) ? usefulness.checks.length : "n/a"}.`
      : "Usefulness artifact missing.",
    action:
      "Review failed checklist items in baseline-telemetry-usefulness.md and capture missing evidence.",
  },
  {
    id: "issue-review",
    title: "Clear consolidated issue-review blockers",
    pass: Boolean(issueReview?.pass),
    detail: issueReview
      ? `Blockers: ${blockers.length}${blockers.length > 0 ? ` (${blockersSummary})` : ""}.`
      : "Issue review artifact missing.",
    action: "Run `pnpm benchmark:loader:baseline:refresh-and-sync` and resolve active blockers.",
  },
]

const pass = checks.every(check => check.pass)

const result = {
  generatedAt: new Date().toISOString(),
  pass,
  source: {
    captureStatus: captureStatusPath,
    completeness: completenessPath,
    usefulness: usefulnessPath,
    issueReview: issueReviewPath,
  },
  checks,
}

const lines = [
  "# Loader Baseline Post-Capture Checklist",
  "",
  `Generated: ${result.generatedAt}`,
  `Overall status: ${pass ? "Pass" : "Action required"}`,
  "",
  "## Checklist",
  "",
]

for (const check of checks) {
  lines.push(`- ${check.title}: ${toStatus(check.pass)}`)
  lines.push(`  - Detail: ${check.detail}`)
  if (!check.pass) {
    lines.push(`  - Next action: ${check.action}`)
  }
}

mkdirSync(dirname(outputPath), {recursive: true})
mkdirSync(dirname(markdownPath), {recursive: true})

writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8")

process.stdout.write(`LOADER_BASELINE_POST_CAPTURE_CHECKLIST_SAVED:${outputPath}\n`)
process.stdout.write(`LOADER_BASELINE_POST_CAPTURE_CHECKLIST_MARKDOWN_SAVED:${markdownPath}\n`)
process.stdout.write(`LOADER_BASELINE_POST_CAPTURE_CHECKLIST_PASS:${result.pass}\n`)
process.stdout.write(`LOADER_BASELINE_POST_CAPTURE_CHECKLIST_STRICT:${strictMode}\n`)

if (!result.pass && strictMode) {
  process.exitCode = 1
}
