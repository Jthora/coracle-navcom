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

const surgePath = resolve(
  process.cwd(),
  getArgValue("--surge", "docs/security/pqc/cache/rollout-relay-rejection-surge.json"),
)
const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/relay-fallback-alerting-checks.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-relay-fallback-alerting.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-relay-fallback-alerting.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-relay-fallback-alerting.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

for (const path of [surgePath, inputPath]) {
  if (!existsSync(path)) {
    throw new Error(`Required relay fallback/alerting input not found: ${path}`)
  }
}

const surge = JSON.parse(readFileSync(surgePath, "utf8"))
const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

if (!surge?.complete) {
  issues.push({
    code: "surge-not-complete",
    detail: "Relay surge simulation must be complete before fallback validation.",
  })
}

const ticketId = String(payload?.ticketId || "").trim()
const executedAt = String(payload?.executedAt || "").trim()
const fallback = payload?.fallback || {}
const alerts = payload?.alerts || {}
const results = payload?.results || {}

if (!ticketId) issues.push({code: "missing-ticket-id", detail: "ticketId is required."})
if (!executedAt || Number.isNaN(Date.parse(executedAt))) {
  issues.push({code: "invalid-executed-at", detail: "executedAt must be an ISO timestamp."})
}

const requiredFallback = [
  "adaptiveRelaySelectionApplied",
  "alternateRelayRetryEnabled",
  "compatibilityFallbackEnabled",
  "payloadLimitsAdjusted",
  "chunkingPolicyAdjusted",
]
for (const key of requiredFallback) {
  if (fallback[key] !== true) {
    issues.push({code: "fallback-check-failed", detail: `fallback.${key} must be true.`})
  }
}

const requiredAlerts = [
  "relayRejectionSpikeAlertFired",
  "fallbackActivationAlertFired",
  "onCallAcknowledged",
]
for (const key of requiredAlerts) {
  if (alerts[key] !== true) {
    issues.push({code: "alert-check-failed", detail: `alerts.${key} must be true.`})
  }
}
if (!alerts?.acknowledgedAt || Number.isNaN(Date.parse(String(alerts.acknowledgedAt)))) {
  issues.push({
    code: "invalid-alert-ack-time",
    detail: "alerts.acknowledgedAt must be ISO timestamp.",
  })
}

const postFallbackRate = Number(results?.postFallbackRejectionRate)
const targetMaxRate = Number(results?.targetMaxRejectionRate)
if (!Number.isFinite(postFallbackRate) || postFallbackRate < 0 || postFallbackRate > 1) {
  issues.push({
    code: "invalid-post-fallback-rate",
    detail: "results.postFallbackRejectionRate must be within [0,1].",
  })
}
if (!Number.isFinite(targetMaxRate) || targetMaxRate <= 0 || targetMaxRate > 1) {
  issues.push({
    code: "invalid-target-max-rate",
    detail: "results.targetMaxRejectionRate must be within (0,1].",
  })
}
if (
  Number.isFinite(postFallbackRate) &&
  Number.isFinite(targetMaxRate) &&
  postFallbackRate > targetMaxRate
) {
  issues.push({
    code: "post-fallback-rate-above-target",
    detail: `postFallbackRejectionRate ${postFallbackRate} exceeds target ${targetMaxRate}.`,
  })
}
if (results?.dmPathPass !== true)
  issues.push({code: "dm-path-failed", detail: "results.dmPathPass must be true."})
if (results?.groupPathPass !== true)
  issues.push({code: "group-path-failed", detail: "results.groupPathPass must be true."})

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  surgePath,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  ticketId: ticketId || null,
  executedAt: executedAt || null,
  postFallbackRejectionRate: Number.isFinite(postFallbackRate) ? postFallbackRate : null,
  targetMaxRejectionRate: Number.isFinite(targetMaxRate) ? targetMaxRate : null,
  fallback,
  alerts,
  results,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "Fallback and alerting behavior validation passed.",
          "Proceed to operator playbook update capture.",
        ]
      : [
          "Fallback and alerting behavior validation failed.",
          "Resolve fallback, alert, or outcome gaps before playbook update capture.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Relay Fallback and Alerting Validation",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Ticket ID: ${summary.ticketId || "n/a"}`,
  "",
  "## Outcome",
  "",
  `- Post-fallback rejection rate: ${summary.postFallbackRejectionRate ?? "n/a"}`,
  `- Target max rejection rate: ${summary.targetMaxRejectionRate ?? "n/a"}`,
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
  postFallbackRejectionRate: summary.postFallbackRejectionRate,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_RELAY_FALLBACK_ALERTING_INVALID\n")
  process.exitCode = 1
}
