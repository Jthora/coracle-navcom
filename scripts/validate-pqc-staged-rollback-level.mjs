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

const level = Number.parseInt(getArgValue("--level", "1"), 10)
const warnOnly = hasFlag("--warn-only")
const operator = getArgValue("--operator", "release-operations")

if (![1, 2, 3].includes(level)) {
  throw new Error(`Invalid rollback level: ${level}. Expected one of 1,2,3.`)
}

const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", `docs/security/pqc/cache/rollback-level${level}-checklist.json`),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", `docs/security/pqc/cache/rollout-rollback-level${level}.json`),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", `docs/security/pqc/cache/rollout-rollback-level${level}.md`),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", `docs/security/pqc/cache/rollout-rollback-level${level}.ndjson`),
)

const previousLevelPath =
  level > 1
    ? resolve(
        process.cwd(),
        getArgValue(
          "--previous",
          `docs/security/pqc/cache/rollout-rollback-level${level - 1}.json`,
        ),
      )
    : null

const levelExpectations = {
  1: {
    requiredSmokeChecks: ["dmPathPass", "groupPathPass", "noPolicyCrash"],
    guidanceOk: [
      "Rollback level 1 validated: strict defaults disabled while PQC paths remain active.",
      "Proceed to rollback level 2 validation when operationally required.",
    ],
    guidanceFail: [
      "Rollback level 1 validation failed.",
      "Correct flag/smoke-check drift and rerun level 1 validation.",
    ],
  },
  2: {
    requiredSmokeChecks: ["receivePathPass", "fallbackSendPathPass", "noHybridSendAttempt"],
    guidanceOk: [
      "Rollback level 2 validated: hybrid send disabled while receive support remains active.",
      "Proceed to rollback level 3 validation only when full PQ disable is required.",
    ],
    guidanceFail: [
      "Rollback level 2 validation failed.",
      "Correct send/receive policy drift and rerun level 2 validation.",
    ],
  },
  3: {
    requiredSmokeChecks: ["classicalDmPass", "classicalGroupPass", "pqDisabledIndicatorsVisible"],
    guidanceOk: [
      "Rollback level 3 validated: PQ features disabled and classical behavior restored.",
      "Document restoration prerequisites before re-enablement.",
    ],
    guidanceFail: [
      "Rollback level 3 validation failed.",
      "Resolve classical-path or PQ-disable inconsistencies and rerun level 3 validation.",
    ],
  },
}

if (!existsSync(inputPath)) {
  throw new Error(`Rollback checklist not found: ${inputPath}`)
}

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

const environment = String(payload?.environment || "")
  .trim()
  .toLowerCase()
const ticketId = String(payload?.ticketId || "").trim()
const triggerReason = String(payload?.triggerReason || "").trim()
const executedAt = String(payload?.executedAt || "").trim()
const impact = String(payload?.impact || "").trim()
const restorationPrerequisites = Array.isArray(payload?.restorationPrerequisites)
  ? payload.restorationPrerequisites.filter(item => typeof item === "string" && item.trim())
  : []

if (environment !== "staging") {
  issues.push({code: "invalid-environment", detail: "Rollback drills must be executed in staging."})
}

if (!ticketId) {
  issues.push({code: "missing-ticket-id", detail: "ticketId is required."})
}

if (!triggerReason) {
  issues.push({code: "missing-trigger-reason", detail: "triggerReason is required."})
}

if (!executedAt || Number.isNaN(Date.parse(executedAt))) {
  issues.push({code: "invalid-executed-at", detail: "executedAt must be an ISO timestamp."})
}

if (!impact) {
  issues.push({code: "missing-impact", detail: "impact summary is required."})
}

if (restorationPrerequisites.length === 0) {
  issues.push({
    code: "missing-restoration-prerequisites",
    detail: "restorationPrerequisites must include at least one prerequisite.",
  })
}

if (previousLevelPath) {
  if (!existsSync(previousLevelPath)) {
    issues.push({
      code: "missing-previous-level-artifact",
      detail: `Previous rollback artifact required before level ${level}: ${previousLevelPath}`,
    })
  } else {
    const previous = JSON.parse(readFileSync(previousLevelPath, "utf8"))

    if (!previous?.complete) {
      issues.push({
        code: "previous-level-incomplete",
        detail: `Rollback level ${level - 1} must be complete before validating level ${level}.`,
      })
    }
  }
}

const preFlags = payload?.preFlags || {}
const postFlags = payload?.postFlags || {}
const transportPolicy = payload?.transportPolicy || {}
const smokeChecks = payload?.smokeChecks || {}

const requiredFlagKeys = [
  "pqc_enabled",
  "pqc_dm_enabled",
  "pqc_groups_enabled",
  "pqc_strict_default",
  "pqc_chunking_enabled",
]

for (const key of requiredFlagKeys) {
  if (typeof preFlags[key] !== "boolean") {
    issues.push({code: "missing-pre-flag", detail: `preFlags.${key} must be boolean.`})
  }

  if (typeof postFlags[key] !== "boolean") {
    issues.push({code: "missing-post-flag", detail: `postFlags.${key} must be boolean.`})
  }
}

if (level === 1) {
  if (postFlags?.pqc_strict_default !== false) {
    issues.push({
      code: "rollback-level1-strict-default",
      detail: "Level 1 requires postFlags.pqc_strict_default=false.",
    })
  }

  if (
    postFlags?.pqc_enabled !== true ||
    postFlags?.pqc_dm_enabled !== true ||
    postFlags?.pqc_groups_enabled !== true
  ) {
    issues.push({
      code: "rollback-level1-base-flags",
      detail: "Level 1 requires PQC base flags to remain enabled.",
    })
  }
}

if (level === 2) {
  if (
    postFlags?.pqc_enabled !== true ||
    postFlags?.pqc_dm_enabled !== true ||
    postFlags?.pqc_groups_enabled !== true
  ) {
    issues.push({
      code: "rollback-level2-base-flags",
      detail: "Level 2 requires PQC base flags to remain enabled.",
    })
  }

  if (transportPolicy?.hybridSendEnabled !== false) {
    issues.push({
      code: "rollback-level2-hybrid-send",
      detail: "Level 2 requires transportPolicy.hybridSendEnabled=false.",
    })
  }

  if (transportPolicy?.hybridReceiveEnabled !== true) {
    issues.push({
      code: "rollback-level2-hybrid-receive",
      detail: "Level 2 requires transportPolicy.hybridReceiveEnabled=true.",
    })
  }
}

if (level === 3) {
  if (
    postFlags?.pqc_enabled !== false ||
    postFlags?.pqc_dm_enabled !== false ||
    postFlags?.pqc_groups_enabled !== false
  ) {
    issues.push({
      code: "rollback-level3-disable-pq",
      detail: "Level 3 requires pqc_enabled, pqc_dm_enabled, and pqc_groups_enabled to be false.",
    })
  }

  if (transportPolicy?.classicalDefault !== true) {
    issues.push({
      code: "rollback-level3-classical-default",
      detail: "Level 3 requires transportPolicy.classicalDefault=true.",
    })
  }
}

for (const key of levelExpectations[level].requiredSmokeChecks) {
  if (smokeChecks[key] !== true) {
    issues.push({
      code: "rollback-smoke-failed",
      detail: `smokeChecks.${key} must be true for rollback level ${level}.`,
    })
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  level,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  previousLevelPath,
  environment,
  ticketId: ticketId || null,
  triggerReason: triggerReason || null,
  executedAt: executedAt || null,
  impact: impact || null,
  restorationPrerequisites,
  preFlags,
  postFlags,
  transportPolicy,
  smokeChecks,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? levelExpectations[level].guidanceOk
      : levelExpectations[level].guidanceFail,
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  `# PQC Rollback Level ${level} Validation`,
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Ticket ID: ${summary.ticketId || "n/a"}`,
  `Environment: ${summary.environment || "n/a"}`,
  "",
  "## Rollback Summary",
  "",
  `- Level: ${summary.level}`,
  `- Executed at: ${summary.executedAt || "n/a"}`,
  `- Trigger reason: ${summary.triggerReason || "n/a"}`,
  `- Impact: ${summary.impact || "n/a"}`,
  "",
  "## Restoration Prerequisites",
  "",
  ...(summary.restorationPrerequisites.length === 0
    ? ["- none"]
    : summary.restorationPrerequisites.map(item => `- ${item}`)),
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
  level: summary.level,
  ticketId: summary.ticketId,
  complete: summary.complete,
  issueCount: summary.issues.length,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write(`PQC_ROLLBACK_LEVEL${level}_INVALID\n`)
  process.exitCode = 1
}
