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

const reviewPath = resolve(
  process.cwd(),
  getArgValue("--review", "docs/security/pqc/cache/rollout-exception-owner-review.json"),
)
const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/exception-approval-decisions.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-exception-decision-log.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-exception-decision-log.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-exception-decision-log.ndjson"),
)
const operator = getArgValue("--operator", "security-owner")
const warnOnly = hasFlag("--warn-only")

for (const path of [reviewPath, inputPath]) {
  if (!existsSync(path)) {
    throw new Error(`Exception decision input not found: ${path}`)
  }
}

const review = JSON.parse(readFileSync(reviewPath, "utf8"))
const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

if (!review?.complete) {
  issues.push({
    code: "owner-review-incomplete",
    detail: "Owner review must be complete before approving/closing exceptions.",
  })
}

const releaseId = String(payload?.releaseId || "").trim()
const decidedAt = String(payload?.decidedAt || "").trim()
const securityApprover = String(payload?.securityApprover || "").trim()
const decisions = Array.isArray(payload?.decisions) ? payload.decisions : []

if (!releaseId) issues.push({code: "missing-release-id", detail: "releaseId is required."})
if (!decidedAt || Number.isNaN(Date.parse(decidedAt))) {
  issues.push({code: "invalid-decided-at", detail: "decidedAt must be an ISO timestamp."})
}
if (!securityApprover) {
  issues.push({code: "missing-security-approver", detail: "securityApprover is required."})
}
if (decisions.length === 0) {
  issues.push({code: "missing-decisions", detail: "At least one decision is required."})
}

const reviewExceptions = Array.isArray(review?.exceptions) ? review.exceptions : []
const reviewExceptionIds = new Set(
  reviewExceptions.map(entry => String(entry?.exceptionId || "").trim()).filter(Boolean),
)

const normalizedDecisions = []
let approvedCount = 0
let closedCount = 0
let rejectedCount = 0

for (const decision of decisions) {
  const exceptionId = String(decision?.exceptionId || "").trim()
  const requirementId = String(decision?.requirementId || "")
    .trim()
    .toUpperCase()
  const decisionState = String(decision?.decision || "")
    .trim()
    .toLowerCase()
  const decisionNotes = String(decision?.decisionNotes || "").trim()
  const approvedAt = String(decision?.approvedAt || "").trim()
  const expiresAt = String(decision?.expiresAt || "").trim()
  const closureTicket = String(decision?.closureTicket || "").trim()

  if (!exceptionId)
    issues.push({code: "missing-exception-id", detail: "Each decision must include exceptionId."})
  if (!/^SR-\d+$/.test(requirementId)) {
    issues.push({
      code: "invalid-requirement-id",
      detail: `${exceptionId || "(unknown)"} requirementId is invalid.`,
    })
  }
  if (!["approved", "closed", "rejected"].includes(decisionState)) {
    issues.push({
      code: "invalid-decision",
      detail: `${exceptionId || "(unknown)"} decision must be approved|closed|rejected.`,
    })
  }
  if (!decisionNotes) {
    issues.push({
      code: "missing-decision-notes",
      detail: `${exceptionId || "(unknown)"} decisionNotes are required.`,
    })
  }
  if (!approvedAt || Number.isNaN(Date.parse(approvedAt))) {
    issues.push({
      code: "invalid-approved-at",
      detail: `${exceptionId || "(unknown)"} approvedAt must be valid.`,
    })
  }
  if (!reviewExceptionIds.has(exceptionId)) {
    issues.push({
      code: "exception-not-reviewed",
      detail: `${exceptionId || "(unknown)"} not found in owner review artifact.`,
    })
  }

  if (decisionState === "approved") {
    approvedCount += 1
    if (!expiresAt || Number.isNaN(Date.parse(expiresAt))) {
      issues.push({
        code: "missing-approval-expiry",
        detail: `${exceptionId || "(unknown)"} approved decision requires valid expiresAt.`,
      })
    }
  }
  if (decisionState === "closed") {
    closedCount += 1
    if (!closureTicket) {
      issues.push({
        code: "missing-closure-ticket",
        detail: `${exceptionId || "(unknown)"} closed decision requires closureTicket.`,
      })
    }
  }
  if (decisionState === "rejected") {
    rejectedCount += 1
  }

  normalizedDecisions.push({
    exceptionId,
    requirementId,
    decision: decisionState,
    decisionNotes,
    approvedAt: approvedAt || null,
    expiresAt: expiresAt || null,
    closureTicket: closureTicket || null,
  })
}

const unresolvedOpenExceptions = reviewExceptions
  .filter(
    entry =>
      String(entry?.status || "")
        .trim()
        .toLowerCase() !== "closed",
  )
  .map(entry => String(entry?.exceptionId || "").trim())
  .filter(Boolean)
  .filter(
    exceptionId => !normalizedDecisions.some(decision => decision.exceptionId === exceptionId),
  )

if (unresolvedOpenExceptions.length > 0) {
  issues.push({
    code: "missing-decisions-for-open-exceptions",
    detail: `Open exceptions without final decision: ${unresolvedOpenExceptions.join(", ")}`,
  })
}

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  reviewPath,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  releaseId: releaseId || review?.releaseId || null,
  decidedAt: decidedAt || null,
  securityApprover: securityApprover || null,
  decisionCounts: {
    approved: approvedCount,
    closed: closedCount,
    rejected: rejectedCount,
  },
  unresolvedOpenExceptions,
  decisions: normalizedDecisions,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "Exception decisions are complete and policy-compliant.",
          "Security and QA final sign-off step can be marked complete.",
        ]
      : [
          "Exception decision log is incomplete or invalid.",
          "Resolve missing/invalid decisions before release gate closure.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Exception Decision Log",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Release ID: ${summary.releaseId || "n/a"}`,
  "",
  "## Decision Summary",
  "",
  `- Approved: ${summary.decisionCounts.approved}`,
  `- Closed: ${summary.decisionCounts.closed}`,
  `- Rejected: ${summary.decisionCounts.rejected}`,
  `- Unresolved open exceptions: ${summary.unresolvedOpenExceptions.length}`,
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
  releaseId: summary.releaseId,
  complete: summary.complete,
  issueCount: summary.issues.length,
  approvedCount,
  closedCount,
  rejectedCount,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_EXCEPTION_DECISION_LOG_INVALID\n")
  process.exitCode = 1
}
