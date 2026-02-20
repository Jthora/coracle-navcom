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

const timingPath = resolve(
  process.cwd(),
  getArgValue("--timing", "docs/security/pqc/cache/rollout-compromise-revocation-timing.json"),
)
const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/compromise-corrective-actions.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue(
    "--output-json",
    "docs/security/pqc/cache/rollout-compromise-corrective-actions.json",
  ),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-compromise-corrective-actions.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-compromise-corrective-actions.ndjson"),
)
const operator = getArgValue("--operator", "security-response")
const warnOnly = hasFlag("--warn-only")

for (const path of [timingPath, inputPath]) {
  if (!existsSync(path)) {
    throw new Error(`Required corrective-action input not found: ${path}`)
  }
}

const timing = JSON.parse(readFileSync(timingPath, "utf8"))
const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

if (!timing?.complete) {
  issues.push({
    code: "timing-not-complete",
    detail: "Timing validation must be complete before publishing actions.",
  })
}

const ticketId = String(payload?.ticketId || "").trim()
const publishedAt = String(payload?.publishedAt || "").trim()
const summaryText = String(payload?.summary || "").trim()
const actions = Array.isArray(payload?.actions) ? payload.actions : []

if (!ticketId) {
  issues.push({code: "missing-ticket-id", detail: "ticketId is required."})
}
if (!publishedAt || Number.isNaN(Date.parse(publishedAt))) {
  issues.push({code: "invalid-published-at", detail: "publishedAt must be an ISO timestamp."})
}
if (!summaryText) {
  issues.push({code: "missing-summary", detail: "summary is required."})
}
if (actions.length === 0) {
  issues.push({code: "missing-actions", detail: "At least one corrective action is required."})
}

const invalidActions = []
for (const [index, action] of actions.entries()) {
  const id = String(action?.id || "").trim()
  const title = String(action?.title || "").trim()
  const owner = String(action?.owner || "").trim()
  const priority = String(action?.priority || "")
    .trim()
    .toLowerCase()
  const dueAt = String(action?.dueAt || "").trim()

  const actionIssues = []
  if (!id) actionIssues.push("id")
  if (!title) actionIssues.push("title")
  if (!owner) actionIssues.push("owner")
  if (!["high", "medium", "low"].includes(priority)) actionIssues.push("priority")
  if (!dueAt || Number.isNaN(Date.parse(dueAt))) actionIssues.push("dueAt")

  if (actionIssues.length > 0) {
    invalidActions.push({index, fields: actionIssues})
  }
}

if (invalidActions.length > 0) {
  issues.push({
    code: "invalid-actions",
    detail: `Corrective actions have invalid fields: ${JSON.stringify(invalidActions)}`,
  })
}

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  timingPath,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  ticketId: ticketId || timing?.ticketId || null,
  publishedAt: publishedAt || null,
  summary: summaryText || null,
  actionCount: actions.length,
  actions,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "Corrective actions published from compromise drill.",
          "Use these actions as postmortem prevention backlog inputs.",
        ]
      : [
          "Corrective-action publication validation failed.",
          "Resolve action payload gaps and rerun publication workflow.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Compromise Corrective Actions",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Ticket ID: ${summary.ticketId || "n/a"}`,
  `Published At: ${summary.publishedAt || "n/a"}`,
  "",
  "## Summary",
  "",
  `- ${summary.summary || "n/a"}`,
  `- Actions: ${summary.actionCount}`,
  "",
  "## Actions",
  "",
  ...(summary.actions.length === 0
    ? ["- none"]
    : summary.actions.map(
        action =>
          `- ${action.id}: ${action.title} | owner=${action.owner} | priority=${action.priority} | due=${action.dueAt}`,
      )),
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
  actionCount: summary.actionCount,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_COMPROMISE_CORRECTIVE_ACTIONS_INVALID\n")
  process.exitCode = 1
}
