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

const checkpointPath = resolve(
  process.cwd(),
  getArgValue("--checkpoint", "docs/security/pqc/cache/rollout-beta-checkpoint.json"),
)
const approvedUsersPath = resolve(
  process.cwd(),
  getArgValue("--approved-users", "docs/security/pqc/cache/external-opt-in-approved-users.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-opt-in-enablement.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-opt-in-enablement.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-opt-in-enablement.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

const parseCsv = value =>
  value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)

const flags = parseCsv(getArgValue("--flags", "pqc_enabled,pqc_dm_enabled,pqc_groups_enabled"))

if (!existsSync(checkpointPath)) {
  throw new Error(`Checkpoint file not found: ${checkpointPath}`)
}

if (!existsSync(approvedUsersPath)) {
  throw new Error(
    `Approved users file not found: ${approvedUsersPath}. Create it using docs/security/pqc/cache/external-opt-in-approved-users.json template.`,
  )
}

const checkpoint = JSON.parse(readFileSync(checkpointPath, "utf8"))
const approvedPayload = JSON.parse(readFileSync(approvedUsersPath, "utf8"))

const approvedUsers = Array.isArray(approvedPayload?.users) ? approvedPayload.users : []
const pubkeyPattern = /^[0-9a-f]{64}$/i

const invalidUsers = approvedUsers
  .map((user, index) => ({user, index}))
  .filter(({user}) => {
    const pubkey = typeof user?.pubkey === "string" ? user.pubkey.trim() : ""
    return !pubkeyPattern.test(pubkey)
  })
  .map(({index, user}) => ({
    index,
    pubkey: user?.pubkey || null,
    reason: "invalid-pubkey",
  }))

const blockedReasons = []

if (!checkpoint?.readyForExternalBeta) {
  blockedReasons.push({
    code: "checkpoint-not-ready",
    detail: checkpoint?.recommendation || "hold-populate-readiness-metrics",
  })
}

if (approvedUsers.length === 0) {
  blockedReasons.push({
    code: "approved-users-empty",
    detail: "No approved external users were provided.",
  })
}

if (invalidUsers.length > 0) {
  blockedReasons.push({
    code: "invalid-approved-users",
    detail: `${invalidUsers.length} approved users have invalid pubkeys.`,
  })
}

const enablementRows = approvedUsers.map(user => {
  const pubkey = typeof user?.pubkey === "string" ? user.pubkey.trim() : ""
  const externalId = typeof user?.externalId === "string" ? user.externalId.trim() : ""
  const cohort = typeof user?.cohort === "string" ? user.cohort.trim() : "external-opt-in-beta"

  return {
    pubkey,
    externalId: externalId || null,
    cohort,
    flags,
    status: blockedReasons.length === 0 ? "ready-to-enable" : "blocked",
  }
})

const summary = {
  generatedAt: new Date().toISOString(),
  checkpointPath,
  approvedUsersPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  operator,
  warnOnly,
  checkpointReady: Boolean(checkpoint?.readyForExternalBeta),
  recommendation: checkpoint?.recommendation || "hold-populate-readiness-metrics",
  cohortId: approvedPayload?.cohortId || "external-opt-in-beta",
  ticketId: approvedPayload?.ticketId || null,
  requestedBy: approvedPayload?.requestedBy || null,
  approvedBy: approvedPayload?.approvedBy || null,
  flags,
  approvedUserCount: approvedUsers.length,
  invalidUsers,
  blockedReasons,
  executable: blockedReasons.length === 0,
  rows: enablementRows,
  guidance:
    blockedReasons.length === 0
      ? [
          "Proceed to enable listed flags for approved external users in the flag control plane.",
          "Record completion confirmation in the rollout change ticket.",
          "Continue daily readiness/triage/checkpoint monitoring during beta expansion.",
        ]
      : [
          "Do not enable external opt-in flags yet.",
          "Resolve blocked reasons, then rerun enablement workflow.",
          "Keep checkpoint and instruction artifacts up to date before cohort changes.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC External Opt-In Enablement Plan",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Executable: ${summary.executable ? "yes" : "no"}`,
  `Operator: ${summary.operator}`,
  `Recommendation: ${summary.recommendation}`,
  `Cohort ID: ${summary.cohortId}`,
  "",
  "## Inputs",
  "",
  `- Approved users file: ${summary.approvedUsersPath}`,
  `- Ticket ID: ${summary.ticketId || "n/a"}`,
  `- Requested By: ${summary.requestedBy || "n/a"}`,
  `- Approved By: ${summary.approvedBy || "n/a"}`,
  "",
  "## Flag Set",
  "",
  ...summary.flags.map(flag => `- ${flag}`),
  "",
  "## Approved User Rows",
  "",
  "| # | Pubkey | External ID | Cohort | Status |",
  "| ---: | --- | --- | --- | --- |",
  ...summary.rows.map((row, index) => {
    const pubkey = row.pubkey || "invalid"
    const externalId = row.externalId || "n/a"
    return `| ${index + 1} | ${pubkey} | ${externalId} | ${row.cohort} | ${row.status} |`
  }),
  "",
  "## Blocked Reasons",
  "",
  ...(summary.blockedReasons.length === 0
    ? ["- none"]
    : summary.blockedReasons.map(reason => `- ${reason.code}: ${reason.detail}`)),
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
  executable: summary.executable,
  checkpointReady: summary.checkpointReady,
  recommendation: summary.recommendation,
  approvedUserCount: summary.approvedUserCount,
  invalidUserCount: summary.invalidUsers.length,
  blockedReasonCount: summary.blockedReasons.length,
  ticketId: summary.ticketId,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.executable && !warnOnly) {
  process.stderr.write("PQC_EXTERNAL_OPT_IN_ENABLEMENT_BLOCKED\n")
  process.exitCode = 1
}
