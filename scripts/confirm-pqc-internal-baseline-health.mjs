import {appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
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
const checkpointPath = resolve(
  process.cwd(),
  getArgValue("--checkpoint", "docs/security/pqc/cache/rollout-beta-checkpoint.json"),
)
const cohortEnablementPath = resolve(
  process.cwd(),
  getArgValue(
    "--cohort-enablement",
    "docs/security/pqc/cache/rollout-internal-cohort-enablement.json",
  ),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-internal-baseline-health.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-internal-baseline-health.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-internal-baseline-health.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

const requiredInputs = [
  ["readiness", readinessPath],
  ["triage", triagePath],
  ["checkpoint", checkpointPath],
  ["cohort-enablement", cohortEnablementPath],
]

for (const [label, path] of requiredInputs) {
  if (!existsSync(path)) {
    throw new Error(`Required ${label} artifact not found: ${path}`)
  }
}

const readiness = JSON.parse(readFileSync(readinessPath, "utf8"))
const triage = JSON.parse(readFileSync(triagePath, "utf8"))
const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"))
const cohortEnablement = JSON.parse(readFileSync(cohortEnablementPath, "utf8"))

const triageRows = Array.isArray(triage?.rows) ? triage.rows : []
const cohortRows = Array.isArray(cohortEnablement?.rows) ? cohortEnablement.rows : []
const failedGates = Array.isArray(checkpoint?.failedGates) ? checkpoint.failedGates : []

const gates = [
  {
    name: "readiness-ready",
    pass: Boolean(readiness?.ready),
    detail: Boolean(readiness?.ready)
      ? "Readiness thresholds are currently passing."
      : "Readiness thresholds are not passing; missing/failing metrics remain.",
  },
  {
    name: "triage-owner-coverage",
    pass: triageRows.length > 0 && Number(triage?.unownedCount || 0) === 0,
    detail:
      triageRows.length > 0 && Number(triage?.unownedCount || 0) === 0
        ? "Triage rows are owner-mapped."
        : "Triage rows are missing or include unowned classes.",
  },
  {
    name: "checkpoint-gate",
    pass: failedGates.length === 0,
    detail:
      failedGates.length === 0
        ? "Checkpoint reports no failed gates."
        : `Checkpoint still has ${failedGates.length} failed gate(s).`,
  },
  {
    name: "cohort-plan-valid",
    pass: Boolean(cohortEnablement?.complete),
    detail: Boolean(cohortEnablement?.complete)
      ? "Internal cohort enablement plan is valid."
      : "Internal cohort enablement plan has schema/validation issues.",
  },
  {
    name: "cohort-ready-exists",
    pass: cohortRows.some(row => row?.status === "ready-to-enable"),
    detail: cohortRows.some(row => row?.status === "ready-to-enable")
      ? "At least one internal cohort is ready-to-enable."
      : "No internal cohorts are currently ready-to-enable.",
  },
]

const failed = gates.filter(gate => !gate.pass)

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  readinessPath,
  triagePath,
  checkpointPath,
  cohortEnablementPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  canExpandCohort: failed.length === 0,
  recommendation: failed.length === 0 ? "expand-next-internal-cohort" : "hold-internal-expansion",
  gateCount: gates.length,
  failedGateCount: failed.length,
  gates,
  failed,
  checkpointRecommendation: checkpoint?.recommendation || null,
  openIssueCounts: checkpoint?.openIssueCounts || null,
  guidance:
    failed.length === 0
      ? [
          "Baseline health gates passed for internal expansion.",
          "Proceed to next internal cohort stage and continue daily telemetry review.",
        ]
      : [
          "Baseline health gates failed for internal expansion.",
          "Do not expand internal cohorts until failed gates are remediated and rerun.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Internal Baseline Expansion Health",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Can Expand Cohort: ${summary.canExpandCohort ? "yes" : "no"}`,
  `Recommendation: ${summary.recommendation}`,
  "",
  "## Gate Results",
  "",
  "| Gate | Pass | Detail |",
  "| --- | --- | --- |",
  ...summary.gates.map(gate => `| ${gate.name} | ${gate.pass ? "yes" : "no"} | ${gate.detail} |`),
  "",
  "## Failed Gates",
  "",
  ...(summary.failed.length === 0
    ? ["- none"]
    : summary.failed.map(gate => `- ${gate.name}: ${gate.detail}`)),
  "",
  "## Guidance",
  ...summary.guidance.map(item => `- ${item}`),
  "",
].join("\n")

mkdirSync(dirname(outputMdPath), {recursive: true})
writeFileSync(outputMdPath, `${markdown}\n`, "utf8")

const auditEntry = {
  generatedAt: summary.generatedAt,
  operator: summary.operator,
  canExpandCohort: summary.canExpandCohort,
  recommendation: summary.recommendation,
  failedGateCount: summary.failedGateCount,
  gateCount: summary.gateCount,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.canExpandCohort && !warnOnly) {
  process.stderr.write("PQC_INTERNAL_BASELINE_HEALTH_NOT_READY\n")
  process.exitCode = 1
}
