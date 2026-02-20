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
  getArgValue("--input", "docs/security/pqc/cache/exception-owner-review.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-exception-owner-review.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-exception-owner-review.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-exception-owner-review.ndjson"),
)
const operator = getArgValue("--operator", "security-architecture")
const warnOnly = hasFlag("--warn-only")

if (!existsSync(inputPath)) {
  throw new Error(`Exception owner review input not found: ${inputPath}`)
}

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

const releaseId = String(payload?.releaseId || "").trim()
const reviewedAt = String(payload?.reviewedAt || "").trim()
const reviewOwner = String(payload?.reviewOwner || "").trim()
const exceptions = Array.isArray(payload?.exceptions) ? payload.exceptions : []

if (!releaseId) {
  issues.push({code: "missing-release-id", detail: "releaseId is required."})
}
if (!reviewedAt || Number.isNaN(Date.parse(reviewedAt))) {
  issues.push({code: "invalid-reviewed-at", detail: "reviewedAt must be an ISO timestamp."})
}
if (!reviewOwner) {
  issues.push({code: "missing-review-owner", detail: "reviewOwner is required."})
}
if (exceptions.length === 0) {
  issues.push({
    code: "missing-exceptions",
    detail: "At least one exception record is required for owner review.",
  })
}

const todayMs = Date.now()
const normalizedExceptions = []
let expiredExceptionCount = 0
let openExceptionCount = 0

for (const entry of exceptions) {
  const exceptionId = String(entry?.exceptionId || "").trim()
  const requirementId = String(entry?.requirementId || "")
    .trim()
    .toUpperCase()
  const severity = String(entry?.severity || "")
    .trim()
    .toLowerCase()
  const status = String(entry?.status || "")
    .trim()
    .toLowerCase()
  const owner = String(entry?.owner || "").trim()
  const riskStatement = String(entry?.riskStatement || "").trim()
  const mitigation = String(entry?.mitigation || "").trim()
  const expiryDate = String(entry?.expiryDate || "").trim()
  const ownerReviewedAt = String(entry?.ownerReviewedAt || "").trim()
  const ownerDecision = String(entry?.ownerDecision || "")
    .trim()
    .toLowerCase()
  const renewalRequested = entry?.renewalRequested === true

  if (!exceptionId)
    issues.push({
      code: "missing-exception-id",
      detail: "Each exception entry requires exceptionId.",
    })
  if (!/^SR-\d+$/.test(requirementId)) {
    issues.push({
      code: "invalid-requirement-id",
      detail: `${exceptionId || "(unknown)"} has invalid requirementId.`,
    })
  }
  if (!["low", "medium", "high", "critical"].includes(severity)) {
    issues.push({
      code: "invalid-severity",
      detail: `${exceptionId || "(unknown)"} severity must be low|medium|high|critical.`,
    })
  }
  if (!["open", "approved", "closed"].includes(status)) {
    issues.push({
      code: "invalid-status",
      detail: `${exceptionId || "(unknown)"} status must be open|approved|closed.`,
    })
  }
  if (!owner)
    issues.push({code: "missing-owner", detail: `${exceptionId || "(unknown)"} owner is required.`})
  if (!riskStatement)
    issues.push({
      code: "missing-risk-statement",
      detail: `${exceptionId || "(unknown)"} requires riskStatement.`,
    })
  if (!mitigation)
    issues.push({
      code: "missing-mitigation",
      detail: `${exceptionId || "(unknown)"} requires mitigation.`,
    })
  if (!expiryDate || Number.isNaN(Date.parse(expiryDate))) {
    issues.push({
      code: "invalid-expiry-date",
      detail: `${exceptionId || "(unknown)"} expiryDate must be valid.`,
    })
  }
  if (!ownerReviewedAt || Number.isNaN(Date.parse(ownerReviewedAt))) {
    issues.push({
      code: "invalid-owner-reviewed-at",
      detail: `${exceptionId || "(unknown)"} ownerReviewedAt must be valid.`,
    })
  }
  if (!["proceed-to-approval", "request-closure", "needs-more-work"].includes(ownerDecision)) {
    issues.push({
      code: "invalid-owner-decision",
      detail: `${exceptionId || "(unknown)"} ownerDecision is invalid.`,
    })
  }

  const expiryMs = Date.parse(expiryDate)
  const isExpired = !Number.isNaN(expiryMs) && expiryMs < todayMs
  if (isExpired && !renewalRequested) {
    issues.push({
      code: "expired-without-renewal",
      detail: `${exceptionId || "(unknown)"} expired without renewal; must block release by policy.`,
    })
  }

  if (isExpired) expiredExceptionCount += 1
  if (status !== "closed") openExceptionCount += 1

  normalizedExceptions.push({
    exceptionId,
    requirementId,
    severity,
    status,
    owner,
    ownerDecision,
    expiryDate: expiryDate || null,
    expired: isExpired,
    renewalRequested,
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
  releaseId: releaseId || null,
  reviewedAt: reviewedAt || null,
  reviewOwner: reviewOwner || null,
  reviewedExceptionCount: normalizedExceptions.length,
  openExceptionCount,
  expiredExceptionCount,
  exceptions: normalizedExceptions,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? ["Exception owner review is complete.", "Proceed to approval/closure decision recording."]
      : [
          "Exception owner review has policy or data gaps.",
          "Resolve invalid/expired exception records before decision recording.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Exception Owner Review",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Release ID: ${summary.releaseId || "n/a"}`,
  "",
  "## Review Summary",
  "",
  `- Reviewed exceptions: ${summary.reviewedExceptionCount}`,
  `- Open exceptions: ${summary.openExceptionCount}`,
  `- Expired exceptions: ${summary.expiredExceptionCount}`,
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
  reviewedExceptionCount: summary.reviewedExceptionCount,
  expiredExceptionCount: summary.expiredExceptionCount,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_EXCEPTION_OWNER_REVIEW_INVALID\n")
  process.exitCode = 1
}
