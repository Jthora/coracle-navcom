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

const executionPath = resolve(
  process.cwd(),
  getArgValue("--execution", "docs/security/pqc/cache/rollout-kill-switch-execution.json"),
)
const observationsPath = resolve(
  process.cwd(),
  getArgValue("--observations", "docs/security/pqc/cache/kill-switch-user-observations.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-kill-switch-user-behavior.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-kill-switch-user-behavior.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-kill-switch-user-behavior.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

if (!existsSync(executionPath)) {
  throw new Error(`Kill-switch execution artifact not found: ${executionPath}`)
}

if (!existsSync(observationsPath)) {
  throw new Error(`User-observation checklist not found: ${observationsPath}`)
}

const execution = JSON.parse(readFileSync(executionPath, "utf8"))
const observations = JSON.parse(readFileSync(observationsPath, "utf8"))

const issues = []

if (!execution?.complete || !execution?.killSwitchApplied) {
  issues.push({
    code: "execution-not-valid",
    detail: "Kill-switch execution must be complete and applied before behavior verification.",
  })
}

const checks = observations?.checks || {}
const requiredTrueChecks = [
  "dmSendAvailable",
  "groupSendAvailable",
  "fallbackIndicatorVisible",
  "trustIndicatorUpdated",
]

for (const key of requiredTrueChecks) {
  if (checks[key] !== true) {
    issues.push({
      code: "behavior-check-failed",
      detail: `observations.checks.${key} must be true.`,
    })
  }
}

if (checks?.unexpectedCrash !== false) {
  issues.push({
    code: "unexpected-crash",
    detail: "observations.checks.unexpectedCrash must be false.",
  })
}

const errorCount = Number(observations?.errorCount)
if (!Number.isFinite(errorCount) || errorCount < 0) {
  issues.push({
    code: "invalid-error-count",
    detail: "errorCount must be a non-negative number.",
  })
}

if (Number.isFinite(errorCount) && errorCount > 0) {
  issues.push({
    code: "nonzero-error-count",
    detail: `Observed errorCount=${errorCount}; expected 0 during behavior verification drill.`,
  })
}

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  executionPath,
  observationsPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  ticketId: observations?.ticketId || execution?.ticketId || null,
  observer: observations?.observer || null,
  observedAt: observations?.observedAt || null,
  checks,
  errorCount: Number.isFinite(errorCount) ? errorCount : null,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "User-facing behavior verification passed after kill-switch disable.",
          "Proceed to recovery verification after re-enabling strict defaults.",
        ]
      : [
          "User-facing behavior verification failed.",
          "Remediate behavior gaps and rerun verification before progressing recovery checks.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Kill-Switch User Behavior Verification",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Ticket ID: ${summary.ticketId || "n/a"}`,
  "",
  "## Observed Checks",
  "",
  `- DM send available: ${checks?.dmSendAvailable === true ? "yes" : "no"}`,
  `- Group send available: ${checks?.groupSendAvailable === true ? "yes" : "no"}`,
  `- Fallback indicator visible: ${checks?.fallbackIndicatorVisible === true ? "yes" : "no"}`,
  `- Trust indicator updated: ${checks?.trustIndicatorUpdated === true ? "yes" : "no"}`,
  `- Unexpected crash: ${checks?.unexpectedCrash === false ? "no" : "yes"}`,
  `- Error count: ${summary.errorCount ?? "n/a"}`,
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
  errorCount: summary.errorCount,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_KILL_SWITCH_USER_BEHAVIOR_INVALID\n")
  process.exitCode = 1
}
