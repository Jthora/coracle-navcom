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

const fallbackPath = resolve(
  process.cwd(),
  getArgValue("--fallback", "docs/security/pqc/cache/rollout-relay-fallback-alerting.json"),
)
const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/relay-playbook-updates.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-relay-playbook-updates.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-relay-playbook-updates.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-relay-playbook-updates.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

for (const path of [fallbackPath, inputPath]) {
  if (!existsSync(path)) {
    throw new Error(`Required relay playbook input not found: ${path}`)
  }
}

const fallback = JSON.parse(readFileSync(fallbackPath, "utf8"))
const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

if (!fallback?.complete) {
  issues.push({
    code: "fallback-not-complete",
    detail: "Fallback/alerting validation must complete first.",
  })
}

const ticketId = String(payload?.ticketId || "").trim()
const publishedAt = String(payload?.publishedAt || "").trim()
const summaryText = String(payload?.summary || "").trim()
const updates = Array.isArray(payload?.updates) ? payload.updates : []

if (!ticketId) issues.push({code: "missing-ticket-id", detail: "ticketId is required."})
if (!publishedAt || Number.isNaN(Date.parse(publishedAt))) {
  issues.push({code: "invalid-published-at", detail: "publishedAt must be ISO timestamp."})
}
if (!summaryText) issues.push({code: "missing-summary", detail: "summary is required."})
if (updates.length === 0)
  issues.push({code: "missing-updates", detail: "At least one playbook update is required."})

for (const [index, item] of updates.entries()) {
  const id = String(item?.id || "").trim()
  const title = String(item?.title || "").trim()
  const owner = String(item?.owner || "").trim()
  const priority = String(item?.priority || "")
    .trim()
    .toLowerCase()
  const dueAt = String(item?.dueAt || "").trim()

  if (
    !id ||
    !title ||
    !owner ||
    !["high", "medium", "low"].includes(priority) ||
    !dueAt ||
    Number.isNaN(Date.parse(dueAt))
  ) {
    issues.push({
      code: "invalid-update-row",
      detail: `updates[${index}] has invalid required fields.`,
    })
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  fallbackPath,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  ticketId: ticketId || null,
  publishedAt: publishedAt || null,
  summary: summaryText || null,
  updateCount: updates.length,
  updates,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "Operator playbook updates captured from relay surge drill.",
          "Feed updates into postmortem and next review cadence.",
        ]
      : [
          "Operator playbook update capture failed.",
          "Resolve update payload issues and rerun capture workflow.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Relay Playbook Updates",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Ticket ID: ${summary.ticketId || "n/a"}`,
  "",
  "## Summary",
  "",
  `- ${summary.summary || "n/a"}`,
  `- Updates: ${summary.updateCount}`,
  "",
  "## Updates",
  "",
  ...(summary.updates.length === 0
    ? ["- none"]
    : summary.updates.map(
        item =>
          `- ${item.id}: ${item.title} | owner=${item.owner} | priority=${item.priority} | due=${item.dueAt}`,
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
  updateCount: summary.updateCount,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_RELAY_PLAYBOOK_UPDATES_INVALID\n")
  process.exitCode = 1
}
