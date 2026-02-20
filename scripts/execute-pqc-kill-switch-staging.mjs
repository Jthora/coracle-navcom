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

const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/kill-switch-staging-checklist.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-kill-switch-execution.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-kill-switch-execution.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-kill-switch-execution.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

if (!existsSync(inputPath)) {
  throw new Error(`Kill-switch staging checklist not found: ${inputPath}`)
}

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

const environment = String(payload?.environment || "")
  .trim()
  .toLowerCase()
const ticketId = String(payload?.ticketId || "").trim()
const triggerReason = String(payload?.triggerReason || "").trim()
const executedAt = String(payload?.executedAt || "").trim()

if (environment !== "staging") {
  issues.push({
    code: "invalid-environment",
    detail: "Kill-switch drill must be executed in staging.",
  })
}

if (!ticketId) {
  issues.push({code: "missing-ticket-id", detail: "ticketId is required."})
}

if (!triggerReason) {
  issues.push({code: "missing-trigger-reason", detail: "triggerReason is required."})
}

if (!executedAt || Number.isNaN(Date.parse(executedAt))) {
  issues.push({code: "invalid-executed-at", detail: "executedAt must be an ISO timestamp."})
}

const preFlags = payload?.preFlags || {}
const postFlags = payload?.postFlags || {}

const requiredFlagKeys = [
  "pqc_enabled",
  "pqc_dm_enabled",
  "pqc_groups_enabled",
  "pqc_strict_default",
  "pqc_chunking_enabled",
]

for (const key of requiredFlagKeys) {
  if (typeof preFlags[key] !== "boolean") {
    issues.push({code: "missing-pre-flag", detail: `preFlags.${key} must be boolean.`})
  }

  if (typeof postFlags[key] !== "boolean") {
    issues.push({code: "missing-post-flag", detail: `postFlags.${key} must be boolean.`})
  }
}

const killSwitchApplied =
  preFlags?.pqc_strict_default === true &&
  postFlags?.pqc_strict_default === false &&
  postFlags?.pqc_enabled === true &&
  postFlags?.pqc_dm_enabled === true &&
  postFlags?.pqc_groups_enabled === true

if (!killSwitchApplied) {
  issues.push({
    code: "kill-switch-not-applied",
    detail: "Expected strict default to be disabled while PQC base flags remain enabled.",
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
  triggerReason: triggerReason || null,
  executedAt: executedAt || null,
  killSwitchApplied,
  complete: issues.length === 0,
  issues,
  preFlags,
  postFlags,
  guidance:
    issues.length === 0
      ? [
          "Kill-switch execution validated in staging.",
          "Proceed to user-facing behavior verification while disable state is active.",
        ]
      : [
          "Kill-switch execution validation failed.",
          "Correct checklist inputs and rerun execution validation before continuing.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Kill-Switch Staging Execution",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Environment: ${summary.environment || "n/a"}`,
  `Ticket ID: ${summary.ticketId || "n/a"}`,
  "",
  "## Execution Checks",
  "",
  `- Kill-switch applied: ${summary.killSwitchApplied ? "yes" : "no"}`,
  `- Executed at: ${summary.executedAt || "n/a"}`,
  `- Trigger reason: ${summary.triggerReason || "n/a"}`,
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
  environment: summary.environment,
  ticketId: summary.ticketId,
  complete: summary.complete,
  killSwitchApplied: summary.killSwitchApplied,
  issueCount: summary.issues.length,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_KILL_SWITCH_EXECUTION_INVALID\n")
  process.exitCode = 1
}
