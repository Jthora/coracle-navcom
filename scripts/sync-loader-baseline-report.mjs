import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

const SURFACE_ORDER = ["feed", "intel map", "notifications", "groups", "bootstrap"]

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

const normalizeSurface = value => (typeof value === "string" ? value.trim().toLowerCase() : "")

const titleCaseSurface = surface => {
  if (surface === "feed") return "Feed"
  if (surface === "intel map") return "Intel Map"
  if (surface === "notifications") return "Notifications"
  if (surface === "groups") return "Groups"
  if (surface === "bootstrap") return "Bootstrap"

  return surface
    .split(/\s+/)
    .filter(Boolean)
    .map(token => token[0].toUpperCase() + token.slice(1))
    .join(" ")
}

const metricCell = metric => {
  if (!metric || metric.count === 0 || metric.p50 === null || metric.p95 === null) {
    return "Pending"
  }

  return `${metric.p50}/${metric.p95}`
}

const loadJsonIfExists = path => {
  if (!existsSync(path)) {
    return null
  }

  return JSON.parse(readFileSync(path, "utf8"))
}

const summaryPath = resolve(
  process.cwd(),
  getArgValue("--summary", "docs/loader/performance-plan/cache/baseline-summary.json"),
)
const completenessPath = resolve(
  process.cwd(),
  getArgValue("--completeness", "docs/loader/performance-plan/cache/baseline-completeness.json"),
)
const validationPath = resolve(
  process.cwd(),
  getArgValue(
    "--validation",
    "docs/loader/performance-plan/cache/baseline-telemetry-validation.json",
  ),
)
const diagnosisPath = resolve(
  process.cwd(),
  getArgValue("--diagnosis", "docs/loader/performance-plan/cache/baseline-diagnosability.json"),
)
const usefulnessPath = resolve(
  process.cwd(),
  getArgValue(
    "--usefulness",
    "docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json",
  ),
)
const remediationPath = resolve(
  process.cwd(),
  getArgValue(
    "--remediation",
    "docs/loader/performance-plan/cache/baseline-observability-remediation.json",
  ),
)
const issueReviewPath = resolve(
  process.cwd(),
  getArgValue("--issue-review", "docs/loader/performance-plan/cache/baseline-issue-review.json"),
)
const reportPath = resolve(
  process.cwd(),
  getArgValue("--report", "docs/loader/performance-plan/03-Baseline-Benchmark-Report.md"),
)

const summary = loadJsonIfExists(summaryPath)
const completeness = loadJsonIfExists(completenessPath)
const validation = loadJsonIfExists(validationPath)
const diagnosis = loadJsonIfExists(diagnosisPath)
const usefulness = loadJsonIfExists(usefulnessPath)
const remediation = loadJsonIfExists(remediationPath)
const issueReview = loadJsonIfExists(issueReviewPath)
const report = readFileSync(reportPath, "utf8")

const summarySurfaces = new Map()

if (summary?.surfaces && typeof summary.surfaces === "object") {
  for (const [surface, data] of Object.entries(summary.surfaces)) {
    summarySurfaces.set(normalizeSurface(surface), data)
  }
}

const tableLines = [
  "| Surface | first_event p50/p95 (ms) | first_10_rendered p50/p95 (ms) | settle p50/p95 (ms) | Slow-state rate | Evidence |",
  "|---|---:|---:|---:|---:|---|",
]

for (const surface of SURFACE_ORDER) {
  const data = summarySurfaces.get(surface)
  const firstEvent = metricCell(data?.firstEvent)
  const firstTenRendered = metricCell(data?.firstTenRendered)
  const settle = metricCell(data?.settle)
  const slowRate =
    typeof data?.settleOver5sRate === "number" && data?.settle?.count > 0
      ? `${data.settleOver5sRate}%`
      : "Pending"

  const evidenceParts = []

  if (summary) {
    evidenceParts.push("baseline-summary.json")
  }

  if (completeness) {
    evidenceParts.push("baseline-completeness.json")
  }

  if (validation) {
    evidenceParts.push("baseline-telemetry-validation.json")
  }

  if (diagnosis) {
    evidenceParts.push("baseline-diagnosability.json")
  }

  if (usefulness) {
    evidenceParts.push("baseline-telemetry-usefulness.json")
  }

  if (remediation) {
    evidenceParts.push("baseline-observability-remediation.json")
  }

  if (issueReview) {
    evidenceParts.push("baseline-issue-review.json")
  }

  const evidence = evidenceParts.length > 0 ? evidenceParts.join(" + ") : "Pending"

  tableLines.push(
    `| ${titleCaseSurface(surface)} | ${firstEvent} | ${firstTenRendered} | ${settle} | ${slowRate} | ${evidence} |`,
  )
}

const telemetryValidationText = validation
  ? validation.pass
    ? `Pass (issues: ${validation.issues.length})`
    : `Fail (issues: ${validation.issues.length})`
  : "Pending"

const completenessStatusText = completeness ? (completeness.pass ? "Pass" : "Fail") : "Pending"

const completenessRunCountText = completeness
  ? `${completeness.runCount}/${completeness.requiredRunsPerSurface * SURFACE_ORDER.length}`
  : "Pending"

const diagnosabilityStatusText = diagnosis
  ? `Ready (unknown classifications: ${diagnosis?.diagnostics?.unknownRate ?? "n/a"}%)`
  : "Pending"

const syntheticScenariosText = diagnosis
  ? diagnosis?.syntheticScenarioChecks?.pass
    ? "Pass"
    : "Fail"
  : "Pending"

const blindSpotsText = diagnosis
  ? Array.isArray(diagnosis?.blindSpots)
    ? diagnosis.blindSpots.length
    : "n/a"
  : "Pending"

const usefulnessStatusText = usefulness ? (usefulness.pass ? "Pass" : "Fail") : "Pending"

const usefulnessChecklistText = usefulness
  ? Array.isArray(usefulness?.checks)
    ? `${usefulness.checks.filter(check => check.pass).length}/${usefulness.checks.length}`
    : "n/a"
  : "Pending"

const remediationStatusText = remediation ? (remediation.pass ? "Pass" : "Fail") : "Pending"

const remediationTicketCountText = remediation
  ? Array.isArray(remediation?.tickets)
    ? remediation.tickets.length
    : "n/a"
  : "Pending"

const issueReviewStatusText = issueReview ? (issueReview.pass ? "Pass" : "Fail") : "Pending"

const issueReviewBlockerCountText = issueReview
  ? Array.isArray(issueReview?.blockers)
    ? issueReview.blockers.length
    : "n/a"
  : "Pending"

const outlierText = (() => {
  if (!summary?.surfaces || Object.keys(summary.surfaces).length === 0) {
    return "Pending first benchmark run."
  }

  const settleRows = Object.entries(summary.surfaces)
    .map(([surface, data]) => ({
      surface,
      p95: data?.settle?.p95 ?? null,
    }))
    .filter(row => typeof row.p95 === "number")
    .sort((left, right) => right.p95 - left.p95)

  if (settleRows.length === 0) {
    return "Pending first benchmark run."
  }

  const top = settleRows[0]

  return `Highest settle p95 currently observed: ${titleCaseSurface(normalizeSurface(top.surface))} (${top.p95}ms).`
})()

let nextReport = report

nextReport = nextReport.replace(
  /## Top Outliers\n\n[\s\S]*?\n## Reproduction Notes\n/m,
  `## Top Outliers\n\n${outlierText}\n\n## Reproduction Notes\n`,
)

nextReport = nextReport.replace(
  /## Baseline Snapshot Table\n\n\| Surface \|[\s\S]*$/m,
  `## Baseline Snapshot Table\n\n${tableLines.join("\n")}\n\n## Capture Completeness\n\n- Status: ${completenessStatusText}\n- Run count: ${completenessRunCountText}\n- Source: ${completeness ? "docs/loader/performance-plan/cache/baseline-completeness.json" : "Pending"}\n\n## Telemetry Validation\n\n- Status: ${telemetryValidationText}\n- Source: ${validation ? "docs/loader/performance-plan/cache/baseline-telemetry-validation.json" : "Pending"}\n\n## Diagnosability Assessment\n\n- Status: ${diagnosabilityStatusText}\n- Synthetic scenarios: ${syntheticScenariosText}\n- Blind spots: ${blindSpotsText}\n- Source: ${diagnosis ? "docs/loader/performance-plan/cache/baseline-diagnosability.json" : "Pending"}\n\n## Telemetry Usefulness Assessment\n\n- Status: ${usefulnessStatusText}\n- Checklist: ${usefulnessChecklistText}\n- Source: ${usefulness ? "docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json" : "Pending"}\n\n## Observability Remediation\n\n- Status: ${remediationStatusText}\n- Tickets: ${remediationTicketCountText}\n- Source: ${remediation ? "docs/loader/performance-plan/cache/baseline-observability-remediation.json" : "Pending"}\n\n## Baseline Issue Review\n\n- Status: ${issueReviewStatusText}\n- Blockers: ${issueReviewBlockerCountText}\n- Source: ${issueReview ? "docs/loader/performance-plan/cache/baseline-issue-review.json" : "Pending"}\n`,
)

writeFileSync(reportPath, nextReport, "utf8")

process.stdout.write(`LOADER_BASELINE_REPORT_SYNCED:${reportPath}\n`)
process.stdout.write(`LOADER_BASELINE_REPORT_SUMMARY_USED:${existsSync(summaryPath)}\n`)
process.stdout.write(`LOADER_BASELINE_REPORT_COMPLETENESS_USED:${existsSync(completenessPath)}\n`)
process.stdout.write(`LOADER_BASELINE_REPORT_VALIDATION_USED:${existsSync(validationPath)}\n`)
process.stdout.write(`LOADER_BASELINE_REPORT_DIAGNOSIS_USED:${existsSync(diagnosisPath)}\n`)
process.stdout.write(`LOADER_BASELINE_REPORT_USEFULNESS_USED:${existsSync(usefulnessPath)}\n`)
process.stdout.write(`LOADER_BASELINE_REPORT_REMEDIATION_USED:${existsSync(remediationPath)}\n`)
process.stdout.write(`LOADER_BASELINE_REPORT_ISSUE_REVIEW_USED:${existsSync(issueReviewPath)}\n`)
