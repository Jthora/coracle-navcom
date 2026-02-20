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
  getArgValue("--input", "docs/security/pqc/cache/rollout-feedback-triage.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-feedback-milestone-plan.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-feedback-milestone-plan.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-feedback-milestone-plan.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

if (!existsSync(inputPath)) {
  throw new Error(`Feedback triage artifact not found: ${inputPath}`)
}

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const findings = Array.isArray(payload?.findings) ? payload.findings : []

const ownerByClass = {
  security: "Crypto Runtime",
  perf: "Performance Engineering",
  interop: "Relay Integrations",
}

const milestoneBySeverity = {
  P1: "immediate-patch",
  P2: "next-patch-train",
  P3: "next-minor",
  P4: "next-minor",
}

const normalizationIssue = []

const items = findings.map((finding, index) => {
  const classTag = String(finding?.classTag || "")
    .trim()
    .toLowerCase()
  const severity = String(finding?.severity || "P3")
    .trim()
    .toUpperCase()
  const issueId = String(finding?.issueId || `UNTRACKED-${index + 1}`).trim()

  const supportedClass = classTag === "security" || classTag === "perf" || classTag === "interop"

  if (!supportedClass) {
    normalizationIssue.push({
      code: "unsupported-class-tag",
      row: index,
      detail: `Issue ${issueId} has unsupported classTag='${classTag || "empty"}'.`,
    })
  }

  if (!["P1", "P2", "P3", "P4"].includes(severity)) {
    normalizationIssue.push({
      code: "unsupported-severity",
      row: index,
      detail: `Issue ${issueId} has unsupported severity='${severity}'.`,
    })
  }

  const normalizedSeverity = ["P1", "P2", "P3", "P4"].includes(severity) ? severity : "P3"
  const normalizedClass = supportedClass ? classTag : "interop"
  const owner = ownerByClass[normalizedClass]
  const milestone = milestoneBySeverity[normalizedSeverity]
  const urgency =
    normalizedSeverity === "P1" ? "critical" : normalizedSeverity === "P2" ? "high" : "normal"

  return {
    issueId,
    title: String(finding?.title || "").trim(),
    classTag: normalizedClass,
    severity: normalizedSeverity,
    status: String(finding?.status || "open")
      .trim()
      .toLowerCase(),
    owner,
    milestone,
    urgency,
    acceptanceGate:
      normalizedClass === "security"
        ? "security-regression-pass"
        : normalizedClass === "perf"
          ? "performance-budget-pass"
          : "interop-matrix-pass",
  }
})

if (items.length === 0) {
  normalizationIssue.push({
    code: "no-triage-findings",
    row: null,
    detail: "No tagged feedback findings were available for milestone planning.",
  })
}

const countsByMilestone = {
  "immediate-patch": items.filter(item => item.milestone === "immediate-patch").length,
  "next-patch-train": items.filter(item => item.milestone === "next-patch-train").length,
  "next-minor": items.filter(item => item.milestone === "next-minor").length,
}

const countsByClass = {
  security: items.filter(item => item.classTag === "security").length,
  perf: items.filter(item => item.classTag === "perf").length,
  interop: items.filter(item => item.classTag === "interop").length,
}

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  complete: normalizationIssue.length === 0,
  countsByMilestone,
  countsByClass,
  issueCount: items.length,
  normalizationIssue,
  items,
  guidance:
    normalizationIssue.length === 0
      ? [
          "Milestone feed generated from tagged feedback issues.",
          "Attach this artifact to the next milestone planning meeting and tracker update.",
        ]
      : [
          "Milestone feed includes normalization issues.",
          "Fix unsupported class/severity values in triage output and rerun planner.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Feedback Milestone Feed",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Issue Count: ${summary.issueCount}`,
  "",
  "## Milestone Counts",
  "",
  `- immediate-patch: ${summary.countsByMilestone["immediate-patch"]}`,
  `- next-patch-train: ${summary.countsByMilestone["next-patch-train"]}`,
  `- next-minor: ${summary.countsByMilestone["next-minor"]}`,
  "",
  "## Class Counts",
  "",
  `- security: ${summary.countsByClass.security}`,
  `- perf: ${summary.countsByClass.perf}`,
  `- interop: ${summary.countsByClass.interop}`,
  "",
  "## Planned Items",
  "",
  ...(summary.items.length === 0
    ? ["- none"]
    : summary.items.map(
        item =>
          `- ${item.issueId}: milestone=${item.milestone}, owner=${item.owner}, class=${item.classTag}, severity=${item.severity}, gate=${item.acceptanceGate}`,
      )),
  "",
  "## Validation Issues",
  "",
  ...(summary.normalizationIssue.length === 0
    ? ["- none"]
    : summary.normalizationIssue.map(issue => `- ${issue.code}: ${issue.detail}`)),
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
  countsByMilestone: summary.countsByMilestone,
  countsByClass: summary.countsByClass,
  normalizationIssueCount: summary.normalizationIssue.length,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_FEEDBACK_MILESTONE_FEED_INCOMPLETE\n")
  process.exitCode = 1
}
