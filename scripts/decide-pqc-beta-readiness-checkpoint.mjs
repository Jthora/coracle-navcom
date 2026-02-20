import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"

const getArgValue = (name, fallback = "") => {
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

const hasFlag = name => process.argv.includes(name)

const readinessPath = resolve(
  process.cwd(),
  getArgValue("--readiness", "docs/security/pqc/cache/rollout-readiness.json"),
)
const triagePath = resolve(
  process.cwd(),
  getArgValue("--triage", "docs/security/pqc/cache/rollout-error-triage.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-beta-checkpoint.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-beta-checkpoint.md"),
)

const maxCriticalOpen = Number.parseInt(getArgValue("--max-critical-open", "0"), 10)
const maxHighOpen = Number.parseInt(getArgValue("--max-high-open", "0"), 10)
const maxMediumOpen = Number.parseInt(getArgValue("--max-medium-open", "1"), 10)
const warnOnly = hasFlag("--warn-only")

if (!existsSync(readinessPath)) {
  throw new Error(`Rollout readiness file not found: ${readinessPath}`)
}

if (!existsSync(triagePath)) {
  throw new Error(`Rollout triage file not found: ${triagePath}`)
}

const readiness = JSON.parse(readFileSync(readinessPath, "utf8"))
const triage = JSON.parse(readFileSync(triagePath, "utf8"))

const rows = Array.isArray(triage?.rows) ? triage.rows : []

const isOpenIssue = row => {
  const reasons = Array.isArray(row?.reasons) ? row.reasons : []
  const reasonOpen = reasons.some(
    reason => reason?.status === "fail" || reason?.status === "missing",
  )
  const countOpen = Number.isFinite(Number(row?.count)) && Number(row.count) > 0
  const rateOpen = Number.isFinite(Number(row?.rate)) && Number(row.rate) > 0

  return reasonOpen || countOpen || rateOpen
}

const openRows = rows.filter(isOpenIssue)

const bySeverity = {
  critical: openRows.filter(row => String(row?.severity || "").toLowerCase() === "critical"),
  high: openRows.filter(row => String(row?.severity || "").toLowerCase() === "high"),
  medium: openRows.filter(row => String(row?.severity || "").toLowerCase() === "medium"),
  low: openRows.filter(row => String(row?.severity || "").toLowerCase() === "low"),
}

const gates = {
  readiness: {
    pass: Boolean(readiness?.ready),
    detail: readiness?.ready
      ? "Rollout readiness thresholds passed."
      : "Readiness thresholds are not satisfied for this checkpoint.",
  },
  triageCoverage: {
    pass: rows.length > 0,
    detail:
      rows.length > 0
        ? "Triage artifact includes ranked error classes."
        : "Triage artifact has no ranked classes.",
  },
  triageOwners: {
    pass: Number(triage?.unownedCount || 0) === 0,
    detail:
      Number(triage?.unownedCount || 0) === 0
        ? "All top triage rows have explicit owners."
        : `${Number(triage?.unownedCount || 0)} unowned triage rows require assignment.`,
  },
  criticalBudget: {
    pass: bySeverity.critical.length <= Math.max(0, maxCriticalOpen),
    detail: `${bySeverity.critical.length} critical open classes (max ${Math.max(0, maxCriticalOpen)}).`,
  },
  highBudget: {
    pass: bySeverity.high.length <= Math.max(0, maxHighOpen),
    detail: `${bySeverity.high.length} high open classes (max ${Math.max(0, maxHighOpen)}).`,
  },
  mediumBudget: {
    pass: bySeverity.medium.length <= Math.max(0, maxMediumOpen),
    detail: `${bySeverity.medium.length} medium open classes (max ${Math.max(0, maxMediumOpen)}).`,
  },
}

const failedGates = Object.entries(gates)
  .filter(([, gate]) => !gate.pass)
  .map(([name, gate]) => ({name, detail: gate.detail}))

const readyForExternalBeta = failedGates.length === 0

const recommendation = readyForExternalBeta
  ? "proceed-external-opt-in-beta"
  : !gates.readiness.pass
    ? "hold-populate-readiness-metrics"
    : !gates.triageOwners.pass
      ? "hold-assign-triage-owners"
      : "hold-remediate-open-error-classes"

const summary = {
  generatedAt: new Date().toISOString(),
  readinessPath,
  triagePath,
  outputJsonPath,
  outputMdPath,
  warnOnly,
  thresholds: {
    maxCriticalOpen: Math.max(0, maxCriticalOpen),
    maxHighOpen: Math.max(0, maxHighOpen),
    maxMediumOpen: Math.max(0, maxMediumOpen),
  },
  readyForExternalBeta,
  recommendation,
  gates,
  failedGates,
  openIssueCounts: {
    total: openRows.length,
    critical: bySeverity.critical.length,
    high: bySeverity.high.length,
    medium: bySeverity.medium.length,
    low: bySeverity.low.length,
  },
  topOpenRows: openRows.slice(0, 10).map(row => ({
    id: row.id || null,
    label: row.label || "Unknown",
    severity: row.severity || "medium",
    owner: row.owner || "Release Operations",
    count: row.count ?? null,
    rate: row.rate ?? null,
  })),
  guidance: readyForExternalBeta
    ? [
        "Checkpoint passed: proceed to external opt-in beta enablement tasks.",
        "Continue daily readiness/triage monitoring during expansion.",
      ]
    : [
        "Checkpoint is hold: do not enable external opt-in beta yet.",
        "Resolve failed gates and regenerate readiness/triage/checkpoint artifacts.",
      ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Beta Readiness Checkpoint",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Ready For External Beta: ${summary.readyForExternalBeta ? "yes" : "no"}`,
  `Recommendation: ${summary.recommendation}`,
  "",
  "## Gate Results",
  "",
  "| Gate | Pass | Detail |",
  "| --- | --- | --- |",
  ...Object.entries(summary.gates).map(
    ([name, gate]) => `| ${name} | ${gate.pass ? "yes" : "no"} | ${gate.detail} |`,
  ),
  "",
  "## Open Issue Counts",
  "",
  `- total: ${summary.openIssueCounts.total}`,
  `- critical: ${summary.openIssueCounts.critical}`,
  `- high: ${summary.openIssueCounts.high}`,
  `- medium: ${summary.openIssueCounts.medium}`,
  `- low: ${summary.openIssueCounts.low}`,
  "",
  "## Guidance",
  ...summary.guidance.map(item => `- ${item}`),
  "",
].join("\n")

mkdirSync(dirname(outputMdPath), {recursive: true})
writeFileSync(outputMdPath, `${markdown}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!readyForExternalBeta && !warnOnly) {
  process.stderr.write("PQC_BETA_CHECKPOINT_NOT_READY\n")
  process.exitCode = 1
}
