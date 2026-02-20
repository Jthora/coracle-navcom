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

const checkpointPath = resolve(
  process.cwd(),
  getArgValue("--checkpoint", "docs/security/pqc/cache/rollout-beta-checkpoint.json"),
)
const readinessPath = resolve(
  process.cwd(),
  getArgValue("--readiness", "docs/security/pqc/cache/rollout-readiness.json"),
)
const triagePath = resolve(
  process.cwd(),
  getArgValue("--triage", "docs/security/pqc/cache/rollout-error-triage.json"),
)
const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/security/pqc/external-opt-in-beta-instructions.md"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/external-opt-in-beta-instructions.json"),
)
const requireReady = hasFlag("--require-ready")

if (!existsSync(checkpointPath)) {
  throw new Error(`Checkpoint file not found: ${checkpointPath}`)
}

const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"))
const readiness = existsSync(readinessPath) ? JSON.parse(readFileSync(readinessPath, "utf8")) : null
const triage = existsSync(triagePath) ? JSON.parse(readFileSync(triagePath, "utf8")) : null

const ready = Boolean(checkpoint?.readyForExternalBeta)
const recommendation = checkpoint?.recommendation || "hold-populate-readiness-metrics"
const failedGates = Array.isArray(checkpoint?.failedGates) ? checkpoint.failedGates : []
const openCounts = checkpoint?.openIssueCounts || {
  total: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
}

const overview = ready
  ? "Checkpoint passed: external opt-in beta can proceed for approved users."
  : "Checkpoint is hold: external opt-in beta should remain disabled until failed gates are resolved."

const guidance = ready
  ? [
      "Enable external opt-in cohort only for approved users listed by release operations.",
      "Keep daily readiness + triage + checkpoint jobs active during rollout expansion.",
      "Pause expansion immediately if checkpoint regresses to hold state.",
    ]
  : [
      "Do not enable external opt-in beta flags yet.",
      "Resolve all failed checkpoint gates and regenerate artifacts.",
      "Re-run this publisher after checkpoint moves to proceed state.",
    ]

const summary = {
  generatedAt: new Date().toISOString(),
  checkpointPath,
  readinessPath,
  triagePath,
  outputPath,
  outputJsonPath,
  requireReady,
  readyForExternalBeta: ready,
  recommendation,
  failedGates,
  openIssueCounts: openCounts,
  readinessWindow: readiness?.window || null,
  triageRows: Array.isArray(triage?.rows) ? triage.rows.length : 0,
  guidance,
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC External Opt-In Beta Instructions",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Checkpoint Status: ${summary.readyForExternalBeta ? "proceed" : "hold"}`,
  `Recommendation: ${summary.recommendation}`,
  "",
  "## Status Overview",
  "",
  overview,
  "",
  "## Current Gate Snapshot",
  "",
  `- Failed gates: ${summary.failedGates.length}`,
  `- Open issue counts: total=${openCounts.total}, critical=${openCounts.critical}, high=${openCounts.high}, medium=${openCounts.medium}, low=${openCounts.low}`,
  summary.readinessWindow
    ? `- Readiness window: ${summary.readinessWindow.start} to ${summary.readinessWindow.end} (${summary.readinessWindow.label})`
    : "- Readiness window: unavailable",
  `- Triage rows analyzed: ${summary.triageRows}`,
  "",
  "## Command Sequence",
  "",
  "```bash",
  "pnpm benchmark:pqc:rollout:prepare-telemetry -- --force",
  "pnpm benchmark:pqc:rollout:assess-readiness:warn",
  "pnpm benchmark:pqc:rollout:triage-errors:warn",
  "pnpm benchmark:pqc:rollout:checkpoint-beta:warn",
  "pnpm benchmark:pqc:rollout:publish-opt-in-instructions",
  "```",
  "",
  "## Enablement Steps",
  "",
  "1. Confirm approved external users/cohorts are listed by release operations.",
  "2. Verify latest checkpoint state and failed gate count from `rollout-beta-checkpoint.json`.",
  "3. If checkpoint status is proceed, enable `pqc_enabled`, `pqc_dm_enabled`, and `pqc_groups_enabled` for approved cohort only.",
  "4. Record rollout change ticket with timestamp, cohort identifiers, and operator.",
  "5. Monitor daily readiness, triage, and checkpoint outputs before any cohort expansion.",
  "",
  "## Guidance",
  ...summary.guidance.map(item => `- ${item}`),
  "",
  ...(summary.failedGates.length > 0
    ? [
        "## Failed Gates",
        "",
        ...summary.failedGates.map(gate => `- ${gate.name}: ${gate.detail}`),
        "",
      ]
    : []),
].join("\n")

mkdirSync(dirname(outputPath), {recursive: true})
writeFileSync(outputPath, `${markdown}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (requireReady && !ready) {
  process.stderr.write("PQC_OPT_IN_INSTRUCTIONS_BLOCKED_BY_CHECKPOINT\n")
  process.exitCode = 1
}
