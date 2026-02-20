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
  getArgValue("--input", "docs/security/pqc/cache/rollout-feedback-collection.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-feedback-triage.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-feedback-triage.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-feedback-triage.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

if (!existsSync(inputPath)) {
  throw new Error(`Feedback collection artifact not found: ${inputPath}`)
}

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const rows = Array.isArray(payload?.rows) ? payload.rows : []

const classFromCategory = category => {
  switch (
    String(category || "")
      .trim()
      .toLowerCase()
  ) {
    case "security":
      return "security"
    case "performance":
      return "perf"
    case "interop":
      return "interop"
    default:
      return null
  }
}

const classFromEvidence = text => {
  const normalized = String(text || "").toLowerCase()

  if (!normalized) {
    return null
  }

  if (
    normalized.includes("decrypt") ||
    normalized.includes("crypto") ||
    normalized.includes("signature")
  ) {
    return "security"
  }

  if (
    normalized.includes("latency") ||
    normalized.includes("slow") ||
    normalized.includes("throughput")
  ) {
    return "perf"
  }

  if (
    normalized.includes("relay") ||
    normalized.includes("fallback") ||
    normalized.includes("compat")
  ) {
    return "interop"
  }

  return null
}

const findings = []
const issues = []

rows.forEach((row, index) => {
  const categoryTag = classFromCategory(row.category)
  const evidenceTag = classFromEvidence(`${row.summary || ""} ${row.evidence || ""}`)
  const classTag = categoryTag || evidenceTag
  const confidence = categoryTag ? "high" : evidenceTag ? "medium" : "low"

  if (!classTag) {
    issues.push({
      code: "unclassified-issue",
      row: index,
      detail: `Issue ${row.issueId || `at index ${index}`} could not be mapped to security/perf/interop class.`,
    })
  }

  findings.push({
    issueId: row.issueId,
    title: row.title,
    reporter: row.reporter,
    severity: row.severity,
    status: row.status,
    category: row.category,
    classTag: classTag || "unclassified",
    confidence,
    rationale: categoryTag
      ? `Derived from category=${row.category}`
      : evidenceTag
        ? "Derived from summary/evidence keyword match"
        : "No deterministic class mapping found",
  })
})

if (rows.length === 0) {
  issues.push({
    code: "no-feedback-rows",
    row: null,
    detail: "No feedback rows found in collection artifact.",
  })
}

const counts = {
  security: findings.filter(item => item.classTag === "security").length,
  perf: findings.filter(item => item.classTag === "perf").length,
  interop: findings.filter(item => item.classTag === "interop").length,
  unclassified: findings.filter(item => item.classTag === "unclassified").length,
}

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  classifiedCount: findings.length,
  counts,
  issues,
  complete: issues.length === 0,
  findings,
  guidance:
    issues.length === 0
      ? [
          "All collected feedback issues are tagged to security/perf/interop classes.",
          "Proceed to Stage 5.2.2.2.3 milestone feed integration.",
        ]
      : [
          "One or more issues are unclassified.",
          "Add deterministic category context or update classifier mapping, then rerun.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC External Opt-In Feedback Class Tagging",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Classified Count: ${summary.classifiedCount}`,
  "",
  "## Class Counts",
  "",
  `- security: ${summary.counts.security}`,
  `- perf: ${summary.counts.perf}`,
  `- interop: ${summary.counts.interop}`,
  `- unclassified: ${summary.counts.unclassified}`,
  "",
  "## Validation Issues",
  "",
  ...(summary.issues.length === 0
    ? ["- none"]
    : summary.issues.map(item => `- ${item.code}: ${item.detail}`)),
  "",
  "## Tagged Issues",
  "",
  ...(summary.findings.length === 0
    ? ["- none"]
    : summary.findings.map(
        item =>
          `- ${item.issueId}: class=${item.classTag}, confidence=${item.confidence}, severity=${item.severity}, status=${item.status}`,
      )),
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
  classifiedCount: summary.classifiedCount,
  counts: summary.counts,
  complete: summary.complete,
  issueCount: summary.issues.length,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_FEEDBACK_TRIAGE_INCOMPLETE\n")
  process.exitCode = 1
}
