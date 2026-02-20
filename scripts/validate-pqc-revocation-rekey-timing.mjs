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

const triagePath = resolve(
  process.cwd(),
  getArgValue("--triage", "docs/security/pqc/cache/rollout-compromise-triage.json"),
)
const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/compromise-revocation-rekey-timing.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-compromise-revocation-timing.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-compromise-revocation-timing.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-compromise-revocation-timing.ndjson"),
)
const operator = getArgValue("--operator", "security-response")
const warnOnly = hasFlag("--warn-only")

for (const path of [triagePath, inputPath]) {
  if (!existsSync(path)) {
    throw new Error(`Required compromise timing input not found: ${path}`)
  }
}

const triage = JSON.parse(readFileSync(triagePath, "utf8"))
const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

if (!triage?.complete) {
  issues.push({
    code: "triage-not-complete",
    detail: "Compromise triage must be complete before timing validation.",
  })
}

const ticketId = String(payload?.ticketId || "").trim()
const targets = payload?.targets || {}
const events = payload?.events || {}
const validation = payload?.validation || {}

const detectedAtMs = Date.parse(String(events?.detectedAt || ""))
const revokedAtMs = Date.parse(String(events?.revokedAt || ""))
const forcedRotationAtMs = Date.parse(String(events?.forcedRotationGuidanceAt || ""))
const epochAdvancedAtMs = Date.parse(String(events?.groupEpochAdvancedAt || ""))

if (!ticketId) {
  issues.push({code: "missing-ticket-id", detail: "ticketId is required."})
}

const maxRevocationSeconds = Number(targets?.maxRevocationSeconds)
const maxForcedRotationSeconds = Number(targets?.maxForcedRotationSeconds)
const maxEpochAdvanceSeconds = Number(targets?.maxEpochAdvanceSeconds)

for (const [key, value] of [
  ["maxRevocationSeconds", maxRevocationSeconds],
  ["maxForcedRotationSeconds", maxForcedRotationSeconds],
  ["maxEpochAdvanceSeconds", maxEpochAdvanceSeconds],
]) {
  if (!Number.isFinite(value) || value <= 0) {
    issues.push({code: "invalid-threshold", detail: `targets.${key} must be a positive number.`})
  }
}

for (const [key, value] of [
  ["detectedAt", detectedAtMs],
  ["revokedAt", revokedAtMs],
  ["forcedRotationGuidanceAt", forcedRotationAtMs],
  ["groupEpochAdvancedAt", epochAdvancedAtMs],
]) {
  if (Number.isNaN(value)) {
    issues.push({code: "invalid-timestamp", detail: `events.${key} must be an ISO timestamp.`})
  }
}

const revocationDelaySeconds = Number.isNaN(revokedAtMs - detectedAtMs)
  ? null
  : Math.round((revokedAtMs - detectedAtMs) / 1000)
const forcedRotationDelaySeconds = Number.isNaN(forcedRotationAtMs - detectedAtMs)
  ? null
  : Math.round((forcedRotationAtMs - detectedAtMs) / 1000)
const epochAdvanceDelaySeconds = Number.isNaN(epochAdvancedAtMs - detectedAtMs)
  ? null
  : Math.round((epochAdvancedAtMs - detectedAtMs) / 1000)

if (revocationDelaySeconds !== null && revocationDelaySeconds < 0) {
  issues.push({code: "invalid-order", detail: "revokedAt must be after detectedAt."})
}
if (forcedRotationDelaySeconds !== null && forcedRotationDelaySeconds < 0) {
  issues.push({code: "invalid-order", detail: "forcedRotationGuidanceAt must be after detectedAt."})
}
if (epochAdvanceDelaySeconds !== null && epochAdvanceDelaySeconds < 0) {
  issues.push({code: "invalid-order", detail: "groupEpochAdvancedAt must be after detectedAt."})
}

if (
  revocationDelaySeconds !== null &&
  Number.isFinite(maxRevocationSeconds) &&
  revocationDelaySeconds > maxRevocationSeconds
) {
  issues.push({
    code: "revocation-sla-exceeded",
    detail: `Revocation delay ${revocationDelaySeconds}s exceeds ${maxRevocationSeconds}s.`,
  })
}
if (
  forcedRotationDelaySeconds !== null &&
  Number.isFinite(maxForcedRotationSeconds) &&
  forcedRotationDelaySeconds > maxForcedRotationSeconds
) {
  issues.push({
    code: "forced-rotation-sla-exceeded",
    detail: `Forced rotation guidance delay ${forcedRotationDelaySeconds}s exceeds ${maxForcedRotationSeconds}s.`,
  })
}
if (
  epochAdvanceDelaySeconds !== null &&
  Number.isFinite(maxEpochAdvanceSeconds) &&
  epochAdvanceDelaySeconds > maxEpochAdvanceSeconds
) {
  issues.push({
    code: "epoch-advance-sla-exceeded",
    detail: `Epoch advance delay ${epochAdvanceDelaySeconds}s exceeds ${maxEpochAdvanceSeconds}s.`,
  })
}

if (validation?.excludedCompromisedKeysFromSendPath !== true) {
  issues.push({
    code: "send-path-exclusion-failed",
    detail: "validation.excludedCompromisedKeysFromSendPath must be true.",
  })
}
if (validation?.userRemediationCommunicationSent !== true) {
  issues.push({
    code: "missing-user-remediation-comms",
    detail: "validation.userRemediationCommunicationSent must be true.",
  })
}

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  triagePath,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  ticketId: ticketId || triage?.ticketId || null,
  thresholds: {
    maxRevocationSeconds,
    maxForcedRotationSeconds,
    maxEpochAdvanceSeconds,
  },
  delays: {
    revocationDelaySeconds,
    forcedRotationDelaySeconds,
    epochAdvanceDelaySeconds,
  },
  validation,
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "Revocation and rekey timing validation passed.",
          "Proceed to publish corrective actions from drill outcomes.",
        ]
      : [
          "Revocation and rekey timing validation failed.",
          "Resolve SLA/order/coverage gaps before publishing corrective actions.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Compromise Revocation and Rekey Timing Validation",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Ticket ID: ${summary.ticketId || "n/a"}`,
  "",
  "## Timing Delays",
  "",
  `- Revocation delay (s): ${summary.delays.revocationDelaySeconds ?? "n/a"}`,
  `- Forced rotation guidance delay (s): ${summary.delays.forcedRotationDelaySeconds ?? "n/a"}`,
  `- Epoch advance delay (s): ${summary.delays.epochAdvanceDelaySeconds ?? "n/a"}`,
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
  delays: summary.delays,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_COMPROMISE_REKEY_TIMING_INVALID\n")
  process.exitCode = 1
}
