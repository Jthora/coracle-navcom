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

const traceabilityPath = resolve(
  process.cwd(),
  getArgValue("--traceability", "docs/security/pqc/cache/rollout-requirement-traceability.json"),
)
const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/requirement-gap-review.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-requirement-gap-verification.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-requirement-gap-verification.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-requirement-gap-verification.ndjson"),
)
const operator = getArgValue("--operator", "security-architecture")
const warnOnly = hasFlag("--warn-only")

for (const path of [traceabilityPath, inputPath]) {
  if (!existsSync(path)) {
    throw new Error(`MUST-gap verification input not found: ${path}`)
  }
}

const traceability = JSON.parse(readFileSync(traceabilityPath, "utf8"))
const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

if (!traceability?.complete) {
  issues.push({
    code: "traceability-incomplete",
    detail: "Requirement traceability must be complete before MUST-gap verification.",
  })
}

const releaseId = String(payload?.releaseId || "").trim()
if (!releaseId) {
  issues.push({code: "missing-release-id", detail: "releaseId is required."})
}

const reviewedAt = String(payload?.reviewedAt || "").trim()
if (!reviewedAt || Number.isNaN(Date.parse(reviewedAt))) {
  issues.push({code: "invalid-reviewed-at", detail: "reviewedAt must be an ISO timestamp."})
}

const openCriticalRequirementGaps = Number(payload?.openCriticalRequirementGaps)
if (!Number.isFinite(openCriticalRequirementGaps) || openCriticalRequirementGaps < 0) {
  issues.push({
    code: "invalid-open-critical-count",
    detail: "openCriticalRequirementGaps must be a non-negative number.",
  })
}

const unresolvedMustIds = Array.isArray(payload?.unresolvedMustIds)
  ? payload.unresolvedMustIds
      .map(item =>
        String(item || "")
          .trim()
          .toUpperCase(),
      )
      .filter(Boolean)
  : []

const rows = Array.isArray(traceability?.rows) ? traceability.rows : []
const uncoveredMustIds = rows
  .filter(
    row =>
      String(row?.implemented || "")
        .trim()
        .toLowerCase() !== "yes",
  )
  .map(row =>
    String(row?.requirementId || "")
      .trim()
      .toUpperCase(),
  )

if (openCriticalRequirementGaps > 0) {
  issues.push({
    code: "critical-gaps-remain",
    detail: `openCriticalRequirementGaps reported as ${openCriticalRequirementGaps}; expected 0 for release gate.`,
  })
}

if (unresolvedMustIds.length > 0) {
  issues.push({
    code: "unresolved-must-ids",
    detail: `unresolvedMustIds contains: ${unresolvedMustIds.join(", ")}`,
  })
}

if (uncoveredMustIds.length > 0) {
  issues.push({
    code: "traceability-not-fully-implemented",
    detail: `Non-yes implementation status for MUST requirements: ${uncoveredMustIds.join(", ")}`,
  })
}

const acceptedExceptions = Array.isArray(payload?.acceptedExceptions)
  ? payload.acceptedExceptions
  : []
if (acceptedExceptions.length > 0) {
  const unapproved = acceptedExceptions.filter(exception => {
    const approved = exception?.approved === true
    const expiresAt = String(exception?.expiresAt || "").trim()
    return !approved || (expiresAt && Number.isNaN(Date.parse(expiresAt)))
  })

  if (unapproved.length > 0) {
    issues.push({
      code: "invalid-exceptions",
      detail:
        "acceptedExceptions entries must be approved and use valid expiresAt timestamps when present.",
    })
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  traceabilityPath,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  releaseId: releaseId || traceability?.releaseId || null,
  reviewedAt: reviewedAt || null,
  openCriticalRequirementGaps,
  unresolvedMustIds,
  uncoveredMustIds,
  acceptedExceptionCount: acceptedExceptions.length,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "No open critical MUST requirement gaps detected.",
          "Proceed to security and QA sign-off recording.",
        ]
      : [
          "Critical MUST requirement gaps remain or verification input is invalid.",
          "Resolve unresolved MUST controls before sign-off.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC MUST Requirement Gap Verification",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Release ID: ${summary.releaseId || "n/a"}`,
  "",
  "## Gap Status",
  "",
  `- Open critical requirement gaps: ${summary.openCriticalRequirementGaps}`,
  `- Unresolved MUST IDs: ${summary.unresolvedMustIds.length}`,
  `- MUST IDs with non-yes implementation: ${summary.uncoveredMustIds.length}`,
  `- Accepted exception count: ${summary.acceptedExceptionCount}`,
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
  openCriticalRequirementGaps: summary.openCriticalRequirementGaps,
  unresolvedMustCount: summary.unresolvedMustIds.length,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_MUST_REQUIREMENT_GAPS_INVALID\n")
  process.exitCode = 1
}
