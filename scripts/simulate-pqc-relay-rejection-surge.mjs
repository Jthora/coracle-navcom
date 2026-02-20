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
  getArgValue("--input", "docs/security/pqc/cache/relay-rejection-surge-simulation.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-relay-rejection-surge.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-relay-rejection-surge.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-relay-rejection-surge.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

if (!existsSync(inputPath)) {
  throw new Error(`Relay surge simulation input not found: ${inputPath}`)
}

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

const environment = String(payload?.environment || "")
  .trim()
  .toLowerCase()
const ticketId = String(payload?.ticketId || "").trim()
const executedAt = String(payload?.executedAt || "").trim()
const scenario = String(payload?.scenario || "").trim()
const baselineRate = Number(payload?.baseline?.rejectionRate)
const surgeRate = Number(payload?.surge?.rejectionRate)
const threshold = Number(payload?.concentration?.threshold)
const detected = payload?.concentration?.detected === true
const byRelay = Array.isArray(payload?.concentration?.byRelay) ? payload.concentration.byRelay : []

if (environment !== "staging") {
  issues.push({code: "invalid-environment", detail: "Relay surge simulation must run in staging."})
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
if (!Number.isFinite(baselineRate) || baselineRate < 0 || baselineRate > 1) {
  issues.push({
    code: "invalid-baseline-rate",
    detail: "baseline.rejectionRate must be within [0,1].",
  })
}
if (!Number.isFinite(surgeRate) || surgeRate < 0 || surgeRate > 1) {
  issues.push({code: "invalid-surge-rate", detail: "surge.rejectionRate must be within [0,1]."})
}
if (!Number.isFinite(threshold) || threshold <= 0 || threshold >= 1) {
  issues.push({code: "invalid-threshold", detail: "concentration.threshold must be within (0,1)."})
}
if (byRelay.length === 0) {
  issues.push({
    code: "missing-relay-concentration",
    detail: "concentration.byRelay must include at least one relay row.",
  })
}
if (Number.isFinite(baselineRate) && Number.isFinite(surgeRate) && surgeRate <= baselineRate) {
  issues.push({
    code: "no-surge-detected",
    detail: "surge.rejectionRate must exceed baseline.rejectionRate.",
  })
}
if (!detected) {
  issues.push({code: "concentration-not-detected", detail: "concentration.detected must be true."})
}

const exceededRelayCount = byRelay.filter(row => Number(row?.rejectionRate) >= threshold).length
if (detected && exceededRelayCount === 0) {
  issues.push({
    code: "threshold-not-exceeded",
    detail: "No relay concentration rows exceeded threshold.",
  })
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
  baselineRejectionRate: Number.isFinite(baselineRate) ? baselineRate : null,
  surgeRejectionRate: Number.isFinite(surgeRate) ? surgeRate : null,
  concentrationThreshold: Number.isFinite(threshold) ? threshold : null,
  exceededRelayCount,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "High rejection conditions simulation passed.",
          "Proceed to fallback and alerting validation.",
        ]
      : [
          "High rejection simulation failed.",
          "Resolve surge/concentration input gaps before fallback validation.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Relay Rejection Surge Simulation",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Ticket ID: ${summary.ticketId || "n/a"}`,
  "",
  "## Metrics",
  "",
  `- Baseline rejection rate: ${summary.baselineRejectionRate ?? "n/a"}`,
  `- Surge rejection rate: ${summary.surgeRejectionRate ?? "n/a"}`,
  `- Concentration threshold: ${summary.concentrationThreshold ?? "n/a"}`,
  `- Relays above threshold: ${summary.exceededRelayCount}`,
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
  surgeRejectionRate: summary.surgeRejectionRate,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_RELAY_SURGE_SIMULATION_INVALID\n")
  process.exitCode = 1
}
