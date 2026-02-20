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

const requirementsPath = resolve(
  process.cwd(),
  getArgValue("--requirements", "docs/security/pqc/02-security-requirements.md"),
)
const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/requirement-traceability-matrix.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-requirement-traceability.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-requirement-traceability.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-requirement-traceability.ndjson"),
)
const operator = getArgValue("--operator", "security-architecture")
const warnOnly = hasFlag("--warn-only")

for (const path of [requirementsPath, inputPath]) {
  if (!existsSync(path)) {
    throw new Error(`Requirement traceability input not found: ${path}`)
  }
}

const requirementsDoc = readFileSync(requirementsPath, "utf8")
const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const rows = Array.isArray(payload?.traceabilityRows) ? payload.traceabilityRows : []
const issues = []

const requirementLines = requirementsDoc
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line.startsWith("- SR-"))

const mustRequirements = requirementLines
  .map(line => {
    const match = line.match(/^-\s*(SR-\d+):\s*(.+)$/)
    if (!match) return null
    return {
      requirementId: match[1],
      statement: match[2],
      isMust: /\bMUST\b/.test(match[2]),
    }
  })
  .filter(Boolean)
  .filter(requirement => requirement.isMust)

const mustIds = mustRequirements.map(requirement => requirement.requirementId)
const rowByRequirement = new Map(
  rows
    .filter(row => row && typeof row === "object")
    .map(row => [
      String(row.requirementId || "")
        .trim()
        .toUpperCase(),
      row,
    ]),
)

if (!payload?.releaseId) {
  issues.push({code: "missing-release-id", detail: "releaseId is required."})
}

const reviewedAt = String(payload?.reviewedAt || "").trim()
if (!reviewedAt || Number.isNaN(Date.parse(reviewedAt))) {
  issues.push({code: "invalid-reviewed-at", detail: "reviewedAt must be an ISO timestamp."})
}

if (mustIds.length === 0) {
  issues.push({
    code: "missing-must-requirements",
    detail: "No MUST requirements were parsed from security requirements.",
  })
}

const missingRequirementIds = []
const mappedRows = []

for (const requirement of mustRequirements) {
  const row = rowByRequirement.get(requirement.requirementId)
  if (!row) {
    missingRequirementIds.push(requirement.requirementId)
    continue
  }

  const implemented = String(row?.implemented || "")
    .trim()
    .toLowerCase()
  const owner = String(row?.owner || "").trim()
  const component = String(row?.component || "").trim()
  const testCoverage = Array.isArray(row?.testCoverage)
    ? row.testCoverage.filter(item => String(item || "").trim())
    : []
  const evidence = Array.isArray(row?.evidence)
    ? row.evidence.filter(item => String(item || "").trim())
    : []
  const exceptions = Array.isArray(row?.exceptions)
    ? row.exceptions.filter(item => String(item || "").trim())
    : []
  const notes = String(row?.notes || "").trim()

  if (!["yes", "partial", "no"].includes(implemented)) {
    issues.push({
      code: "invalid-implemented-status",
      detail: `${requirement.requirementId} implemented must be one of yes|partial|no.`,
    })
  }
  if (!owner) {
    issues.push({code: "missing-owner", detail: `${requirement.requirementId} requires an owner.`})
  }
  if (!component) {
    issues.push({
      code: "missing-component",
      detail: `${requirement.requirementId} requires a component reference.`,
    })
  }
  if (testCoverage.length === 0) {
    issues.push({
      code: "missing-test-coverage",
      detail: `${requirement.requirementId} requires at least one testCoverage reference.`,
    })
  }
  if (evidence.length === 0) {
    issues.push({
      code: "missing-evidence",
      detail: `${requirement.requirementId} requires at least one evidence reference.`,
    })
  }

  mappedRows.push({
    requirementId: requirement.requirementId,
    statement: requirement.statement,
    implemented,
    owner,
    component,
    testCoverage,
    evidence,
    exceptions,
    notes,
  })
}

if (missingRequirementIds.length > 0) {
  issues.push({
    code: "missing-requirement-rows",
    detail: `Missing traceability rows for: ${missingRequirementIds.join(", ")}`,
  })
}

const implementationCounts = mappedRows.reduce(
  (accumulator, row) => {
    if (row.implemented === "yes") accumulator.yes += 1
    if (row.implemented === "partial") accumulator.partial += 1
    if (row.implemented === "no") accumulator.no += 1
    return accumulator
  },
  {yes: 0, partial: 0, no: 0},
)

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  requirementsPath,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  releaseId: String(payload?.releaseId || "").trim() || null,
  reviewedAt: reviewedAt || null,
  mustRequirementCount: mustIds.length,
  mappedRequirementCount: mappedRows.length,
  missingRequirementIds,
  implementationCounts,
  rows: mappedRows,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "Requirement traceability matrix is complete for all MUST controls.",
          "Proceed to no-open-critical-gap verification.",
        ]
      : [
          "Requirement traceability matrix is incomplete.",
          "Resolve missing rows or required references before gap verification.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Requirement Traceability Matrix Validation",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Release ID: ${summary.releaseId || "n/a"}`,
  "",
  "## Coverage",
  "",
  `- MUST requirements parsed: ${summary.mustRequirementCount}`,
  `- Traceability rows mapped: ${summary.mappedRequirementCount}`,
  `- Missing rows: ${summary.missingRequirementIds.length}`,
  `- Implemented yes|partial|no: ${summary.implementationCounts.yes}|${summary.implementationCounts.partial}|${summary.implementationCounts.no}`,
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
  mustRequirementCount: summary.mustRequirementCount,
  mappedRequirementCount: summary.mappedRequirementCount,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_REQUIREMENT_TRACEABILITY_INVALID\n")
  process.exitCode = 1
}
