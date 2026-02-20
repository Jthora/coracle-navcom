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
const userBehaviorPath = resolve(
  process.cwd(),
  getArgValue("--user-behavior", "docs/security/pqc/cache/rollout-kill-switch-user-behavior.json"),
)
const recoveryPath = resolve(
  process.cwd(),
  getArgValue("--recovery", "docs/security/pqc/cache/kill-switch-recovery-checklist.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-kill-switch-recovery.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-kill-switch-recovery.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-kill-switch-recovery.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

for (const path of [executionPath, userBehaviorPath, recoveryPath]) {
  if (!existsSync(path)) {
    throw new Error(`Required kill-switch recovery input not found: ${path}`)
  }
}

const execution = JSON.parse(readFileSync(executionPath, "utf8"))
const userBehavior = JSON.parse(readFileSync(userBehaviorPath, "utf8"))
const recovery = JSON.parse(readFileSync(recoveryPath, "utf8"))

const issues = []

if (!execution?.complete || !execution?.killSwitchApplied) {
  issues.push({
    code: "execution-not-valid",
    detail: "Kill-switch execution must be complete before recovery validation.",
  })
}

if (!userBehavior?.complete) {
  issues.push({
    code: "user-behavior-not-valid",
    detail: "User-behavior verification must be complete before recovery validation.",
  })
}

const restoredFlags = recovery?.restoredFlags || {}
const smokeChecks = recovery?.smokeChecks || {}

if (restoredFlags?.pqc_strict_default !== true) {
  issues.push({
    code: "strict-default-not-restored",
    detail: "restoredFlags.pqc_strict_default must be true after re-enable.",
  })
}

const requiredSmokeChecks = [
  "dmPathPass",
  "groupPathPass",
  "alertsBelowThreshold",
  "keyLifecycleConsistent",
]

for (const key of requiredSmokeChecks) {
  if (smokeChecks[key] !== true) {
    issues.push({
      code: "recovery-smoke-failed",
      detail: `smokeChecks.${key} must be true.`,
    })
  }
}

const reEnabledAt = String(recovery?.reEnabledAt || "").trim()
if (!reEnabledAt || Number.isNaN(Date.parse(reEnabledAt))) {
  issues.push({
    code: "invalid-reenabled-at",
    detail: "reEnabledAt must be an ISO timestamp.",
  })
}

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  executionPath,
  userBehaviorPath,
  recoveryPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  ticketId: recovery?.ticketId || execution?.ticketId || null,
  reEnabledAt: reEnabledAt || null,
  restoredFlags,
  smokeChecks,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "Kill-switch recovery verification passed after re-enable.",
          "Kill-switch path validation task is complete for this drill window.",
        ]
      : [
          "Kill-switch recovery verification failed.",
          "Resolve restoration/smoke-check failures and rerun recovery verification.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Kill-Switch Recovery Verification",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Ticket ID: ${summary.ticketId || "n/a"}`,
  `Re-enabled At: ${summary.reEnabledAt || "n/a"}`,
  "",
  "## Recovery Smoke Checks",
  "",
  `- DM path pass: ${smokeChecks?.dmPathPass === true ? "yes" : "no"}`,
  `- Group path pass: ${smokeChecks?.groupPathPass === true ? "yes" : "no"}`,
  `- Alerts below threshold: ${smokeChecks?.alertsBelowThreshold === true ? "yes" : "no"}`,
  `- Key lifecycle consistent: ${smokeChecks?.keyLifecycleConsistent === true ? "yes" : "no"}`,
  `- Strict default restored: ${restoredFlags?.pqc_strict_default === true ? "yes" : "no"}`,
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
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_KILL_SWITCH_RECOVERY_INVALID\n")
  process.exitCode = 1
}
