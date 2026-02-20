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
  getArgValue("--input", "docs/security/pqc/cache/external-opt-in-feedback-submissions.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-feedback-collection.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-feedback-collection.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-feedback-collection.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

if (!existsSync(inputPath)) {
  throw new Error(`Feedback submissions file not found: ${inputPath}`)
}

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const submissions = Array.isArray(payload?.issues) ? payload.issues : []

const allowedCategories = new Set(["security", "performance", "interop", "ux", "other"])
const allowedSeverities = new Set(["P1", "P2", "P3", "P4"])
const allowedStatuses = new Set(["open", "triaged", "resolved"])

const normalizeIssue = issue => ({
  issueId: String(issue?.issueId || "").trim(),
  title: String(issue?.title || "").trim(),
  reporter: String(issue?.reporter || "").trim(),
  category: String(issue?.category || "")
    .trim()
    .toLowerCase(),
  severity: String(issue?.severity || "")
    .trim()
    .toUpperCase(),
  status: String(issue?.status || "")
    .trim()
    .toLowerCase(),
  summary: String(issue?.summary || "").trim(),
  evidence: String(issue?.evidence || "").trim(),
  createdAt: String(issue?.createdAt || "").trim(),
  notes: String(issue?.notes || "").trim(),
})

const seemsPlaceholder = value => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()

  if (!normalized) {
    return true
  }

  return (
    normalized.includes("<") ||
    normalized.includes("todo") ||
    normalized.includes("tbd") ||
    normalized.includes("replace") ||
    normalized.includes("example")
  )
}

const rows = submissions.map(normalizeIssue)

const issues = []

rows.forEach((row, index) => {
  const prefix = `issues[${index}]`

  if (!row.issueId) {
    issues.push({code: "missing-issue-id", row: index, detail: `${prefix}.issueId is required.`})
  }

  if (!row.title) {
    issues.push({code: "missing-title", row: index, detail: `${prefix}.title is required.`})
  }

  if (!row.reporter) {
    issues.push({code: "missing-reporter", row: index, detail: `${prefix}.reporter is required.`})
  }

  if (!allowedCategories.has(row.category)) {
    issues.push({
      code: "invalid-category",
      row: index,
      detail: `${prefix}.category must be one of security/performance/interop/ux/other.`,
    })
  }

  if (!allowedSeverities.has(row.severity)) {
    issues.push({
      code: "invalid-severity",
      row: index,
      detail: `${prefix}.severity must be one of P1/P2/P3/P4.`,
    })
  }

  if (!allowedStatuses.has(row.status)) {
    issues.push({
      code: "invalid-status",
      row: index,
      detail: `${prefix}.status must be one of open/triaged/resolved.`,
    })
  }

  if (!row.summary) {
    issues.push({code: "missing-summary", row: index, detail: `${prefix}.summary is required.`})
  }

  if (!row.evidence) {
    issues.push({code: "missing-evidence", row: index, detail: `${prefix}.evidence is required.`})
  }

  if (!row.createdAt || Number.isNaN(Date.parse(row.createdAt))) {
    issues.push({
      code: "invalid-created-at",
      row: index,
      detail: `${prefix}.createdAt must be ISO-8601 timestamp.`,
    })
  }

  if ([row.issueId, row.title, row.summary, row.evidence].some(seemsPlaceholder)) {
    issues.push({
      code: "placeholder-content",
      row: index,
      detail: `${prefix} still contains placeholder/template content.`,
    })
  }
})

if (rows.length === 0) {
  issues.push({
    code: "no-issues",
    row: null,
    detail: "No issue submissions were provided.",
  })
}

const byCategory = {
  security: rows.filter(row => row.category === "security").length,
  performance: rows.filter(row => row.category === "performance").length,
  interop: rows.filter(row => row.category === "interop").length,
  ux: rows.filter(row => row.category === "ux").length,
  other: rows.filter(row => row.category === "other").length,
}

const bySeverity = {
  P1: rows.filter(row => row.severity === "P1").length,
  P2: rows.filter(row => row.severity === "P2").length,
  P3: rows.filter(row => row.severity === "P3").length,
  P4: rows.filter(row => row.severity === "P4").length,
}

const summary = {
  generatedAt: new Date().toISOString(),
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  operator,
  warnOnly,
  issueCount: rows.length,
  byCategory,
  bySeverity,
  issues,
  complete: issues.length === 0,
  rows,
  guidance:
    issues.length === 0
      ? [
          "Feedback submissions are valid and ready for triage tagging.",
          "Proceed to Stage 5.2.2.2.2 classification and routing.",
        ]
      : [
          "Feedback collection has validation issues.",
          "Fix submission template fields and placeholders, then rerun collection.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC External Opt-In Feedback Collection",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Issue Count: ${summary.issueCount}`,
  "",
  "## Category Counts",
  "",
  `- security: ${summary.byCategory.security}`,
  `- performance: ${summary.byCategory.performance}`,
  `- interop: ${summary.byCategory.interop}`,
  `- ux: ${summary.byCategory.ux}`,
  `- other: ${summary.byCategory.other}`,
  "",
  "## Severity Counts",
  "",
  `- P1: ${summary.bySeverity.P1}`,
  `- P2: ${summary.bySeverity.P2}`,
  `- P3: ${summary.bySeverity.P3}`,
  `- P4: ${summary.bySeverity.P4}`,
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
  issueCount: summary.issueCount,
  complete: summary.complete,
  validationIssueCount: summary.issues.length,
  byCategory: summary.byCategory,
  bySeverity: summary.bySeverity,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_FEEDBACK_COLLECTION_INVALID\n")
  process.exitCode = 1
}
