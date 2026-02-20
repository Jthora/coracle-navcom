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

const cohortsPath = resolve(
  process.cwd(),
  getArgValue("--cohorts", "docs/security/pqc/cache/internal-dogfood-cohorts.json"),
)
const readinessPath = resolve(
  process.cwd(),
  getArgValue("--readiness", "docs/security/pqc/cache/rollout-readiness.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-internal-cohort-enablement.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-internal-cohort-enablement.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-internal-cohort-enablement.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

const parseCsv = value =>
  value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)

const flags = parseCsv(
  getArgValue("--flags", "pqc_enabled,pqc_dm_enabled,pqc_groups_enabled,pqc_chunking_enabled"),
)

if (!existsSync(cohortsPath)) {
  throw new Error(`Internal cohorts file not found: ${cohortsPath}`)
}

const cohortsPayload = JSON.parse(readFileSync(cohortsPath, "utf8"))
const cohorts = Array.isArray(cohortsPayload?.cohorts) ? cohortsPayload.cohorts : []

const readiness = existsSync(readinessPath) ? JSON.parse(readFileSync(readinessPath, "utf8")) : null
const readinessReady = Boolean(readiness?.ready)

const pubkeyPattern = /^[0-9a-f]{64}$/i
const issues = []

const rows = cohorts.map((cohort, index) => {
  const cohortId = String(cohort?.cohortId || "").trim()
  const ticketId = String(cohort?.ticketId || "").trim()
  const owner = String(cohort?.owner || "release-operations").trim()
  const stage = Number.isInteger(cohort?.stage) ? cohort.stage : index + 1
  const users = Array.isArray(cohort?.users) ? cohort.users : []

  if (!cohortId) {
    issues.push({
      code: "missing-cohort-id",
      row: index,
      detail: `cohorts[${index}].cohortId is required.`,
    })
  }

  if (!ticketId) {
    issues.push({
      code: "missing-ticket-id",
      row: index,
      detail: `cohorts[${index}].ticketId is required.`,
    })
  }

  if (users.length === 0) {
    issues.push({
      code: "cohort-users-empty",
      row: index,
      detail: `cohorts[${index}] must include at least one user.`,
    })
  }

  const invalidUsers = users
    .map((user, userIndex) => ({user, userIndex}))
    .filter(({user}) => {
      const pubkey = String(user?.pubkey || "").trim()
      return !pubkeyPattern.test(pubkey)
    })
    .map(({userIndex, user}) => ({
      userIndex,
      pubkey: String(user?.pubkey || "").trim() || null,
      reason: "invalid-pubkey",
    }))

  if (invalidUsers.length > 0) {
    issues.push({
      code: "cohort-invalid-users",
      row: index,
      detail: `cohorts[${index}] has ${invalidUsers.length} invalid pubkeys.`,
    })
  }

  const normalizedUsers = users.map((user, userIndex) => ({
    pubkey: String(user?.pubkey || "").trim(),
    alias: String(user?.alias || `internal-user-${userIndex + 1}`).trim(),
    role: String(user?.role || "member").trim(),
    valid: pubkeyPattern.test(String(user?.pubkey || "").trim()),
  }))

  return {
    cohortId: cohortId || `cohort-${index + 1}`,
    ticketId: ticketId || null,
    owner,
    stage,
    flags,
    userCount: normalizedUsers.length,
    invalidUserCount: invalidUsers.length,
    status: invalidUsers.length === 0 && normalizedUsers.length > 0 ? "ready-to-enable" : "blocked",
    users: normalizedUsers,
  }
})

if (rows.length === 0) {
  issues.push({
    code: "no-cohorts",
    row: null,
    detail: "No internal dogfood cohorts were provided.",
  })
}

const enabledCandidates = rows.filter(row => row.status === "ready-to-enable")

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  cohortsPath,
  readinessPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  rolloutWindow: cohortsPayload?.rolloutWindow || "internal-dogfood-window",
  requestedBy: cohortsPayload?.requestedBy || null,
  approvedBy: cohortsPayload?.approvedBy || null,
  readinessReady,
  flags,
  cohortCount: rows.length,
  enableableCohortCount: enabledCandidates.length,
  userCount: rows.reduce((total, row) => total + row.userCount, 0),
  invalidUserCount: rows.reduce((total, row) => total + row.invalidUserCount, 0),
  complete: issues.length === 0,
  issues,
  rows,
  guidance:
    issues.length === 0
      ? [
          "Apply listed flags for enableable internal cohorts in cohort-stage order.",
          "Run baseline expansion confirmation before adding additional internal cohorts.",
          "Keep readiness telemetry refreshed daily during dogfood expansion.",
        ]
      : [
          "Internal cohort payload has validation issues.",
          "Fix cohort/user schema errors and rerun internal enablement planner.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Internal Dogfood Cohort Enablement",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Readiness Ready Snapshot: ${summary.readinessReady ? "yes" : "no"}`,
  `Rollout Window: ${summary.rolloutWindow}`,
  "",
  "## Inputs",
  "",
  `- Requested By: ${summary.requestedBy || "n/a"}`,
  `- Approved By: ${summary.approvedBy || "n/a"}`,
  `- Cohort Count: ${summary.cohortCount}`,
  `- Total Users: ${summary.userCount}`,
  "",
  "## Flag Set",
  "",
  ...summary.flags.map(flag => `- ${flag}`),
  "",
  "## Cohorts",
  "",
  "| # | Cohort | Stage | Ticket | Owner | Users | Invalid Users | Status |",
  "| ---: | --- | ---: | --- | --- | ---: | ---: | --- |",
  ...summary.rows.map(
    (row, index) =>
      `| ${index + 1} | ${row.cohortId} | ${row.stage} | ${row.ticketId || "n/a"} | ${row.owner} | ${row.userCount} | ${row.invalidUserCount} | ${row.status} |`,
  ),
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
  rolloutWindow: summary.rolloutWindow,
  cohortCount: summary.cohortCount,
  enableableCohortCount: summary.enableableCohortCount,
  userCount: summary.userCount,
  invalidUserCount: summary.invalidUserCount,
  readinessReady: summary.readinessReady,
  complete: summary.complete,
  issueCount: summary.issues.length,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_INTERNAL_DOGFOOD_COHORTS_INVALID\n")
  process.exitCode = 1
}
