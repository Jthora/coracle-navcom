import {appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"

const getArgValue = (name, fallback = "") => {
  const prefix = `${name}=`
  const direct = process.argv.find(argument => argument.startsWith(prefix))
  if (direct) return direct.slice(prefix.length)
  const index = process.argv.findIndex(argument => argument === name)
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1]
  return fallback
}

const hasFlag = name => process.argv.includes(name)

const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/compromise-detection-simulation.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-compromise-triage.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-compromise-triage.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-compromise-triage.ndjson"),
)
const operator = getArgValue("--operator", "security-response")
const warnOnly = hasFlag("--warn-only")

if (!existsSync(inputPath)) {
  throw new Error(`Compromise simulation input not found: ${inputPath}`)
}

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

const environment = String(payload?.environment || "")
  .trim()
  .toLowerCase()
const ticketId = String(payload?.ticketId || "").trim()
const executedAt = String(payload?.executedAt || "").trim()
const scenario = String(payload?.scenario || "").trim()
const indicators = Array.isArray(payload?.indicators) ? payload.indicators : []
const affectedKeyIds = Array.isArray(payload?.affectedKeyIds) ? payload.affectedKeyIds : []
const triage = payload?.triage || {}
const controls = triage?.containmentControls || {}

if (environment !== "staging") {
  issues.push({code: "invalid-environment", detail: "Compromise tabletop must run in staging."})
}
if (!ticketId) {
  issues.push({code: "missing-ticket-id", detail: "ticketId is required."})
}
if (!executedAt || Number.isNaN(Date.parse(executedAt))) {
  issues.push({code: "invalid-executed-at", detail: "executedAt must be an ISO timestamp."})
}
if (!scenario) {
  issues.push({code: "missing-scenario", detail: "scenario summary is required."})
}
if (indicators.length === 0) {
  issues.push({
    code: "missing-indicators",
    detail: "At least one compromise indicator is required.",
  })
}
if (affectedKeyIds.length === 0) {
  issues.push({
    code: "missing-affected-key-ids",
    detail: "affectedKeyIds must include at least one key.",
  })
}
if (String(triage?.incidentClass || "").trim() !== "IC-1") {
  issues.push({code: "invalid-incident-class", detail: "triage.incidentClass must be IC-1."})
}
if (String(triage?.severity || "").trim() !== "P1") {
  issues.push({code: "invalid-severity", detail: "triage.severity must be P1."})
}

const requiredControls = [
  "killSwitchApplied",
  "compatibilityForced",
  "groupSecureModeTemporarilyDisabled",
  "relayIsolationApplied",
]
for (const key of requiredControls) {
  if (controls[key] !== true) {
    issues.push({
      code: "containment-control-missing",
      detail: `triage.containmentControls.${key} must be true.`,
    })
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  environment,
  ticketId: ticketId || null,
  executedAt: executedAt || null,
  scenario: scenario || null,
  indicatorCount: indicators.length,
  affectedKeyIds,
  incidentClass: triage?.incidentClass || null,
  severity: triage?.severity || null,
  containmentControls: controls,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "Compromise detection and triage simulation passed.",
          "Proceed to revocation/rekey timing validation.",
        ]
      : [
          "Compromise detection and triage simulation failed.",
          "Resolve simulation and containment gaps before timing validation.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Compromise Detection and Triage Simulation",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Ticket ID: ${summary.ticketId || "n/a"}`,
  "",
  "## Summary",
  "",
  `- Environment: ${summary.environment || "n/a"}`,
  `- Indicators: ${summary.indicatorCount}`,
  `- Incident class: ${summary.incidentClass || "n/a"}`,
  `- Severity: ${summary.severity || "n/a"}`,
  "",
  "## Validation Issues",
  "",
  ...(summary.issues.length === 0
    ? ["- none"]
    : summary.issues.map(issue => `- ${issue.code}: ${issue.detail}`)),
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
  ticketId: summary.ticketId,
  complete: summary.complete,
  issueCount: summary.issues.length,
  indicatorCount: summary.indicatorCount,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_COMPROMISE_TRIAGE_INVALID\n")
  process.exitCode = 1
}
