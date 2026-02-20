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

const gapsPath = resolve(
  process.cwd(),
  getArgValue("--gaps", "docs/security/pqc/cache/rollout-requirement-gap-verification.json"),
)
const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/security-qa-signoff-approvals.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-security-qa-signoff.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-security-qa-signoff.md"),
)
const auditPath = resolve(
  process.cwd(),
  getArgValue("--audit", "docs/security/pqc/cache/rollout-security-qa-signoff.ndjson"),
)
const operator = getArgValue("--operator", "release-management")
const warnOnly = hasFlag("--warn-only")

for (const path of [gapsPath, inputPath]) {
  if (!existsSync(path)) {
    throw new Error(`Security/QA sign-off input not found: ${path}`)
  }
}

const gapVerification = JSON.parse(readFileSync(gapsPath, "utf8"))
const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const issues = []

if (!gapVerification?.complete) {
  issues.push({
    code: "gap-verification-incomplete",
    detail: "MUST-gap verification must be complete before sign-off recording.",
  })
}

const releaseId = String(payload?.releaseId || "").trim()
if (!releaseId) {
  issues.push({code: "missing-release-id", detail: "releaseId is required."})
}

const approvedAt = String(payload?.approvedAt || "").trim()
if (!approvedAt || Number.isNaN(Date.parse(approvedAt))) {
  issues.push({code: "invalid-approved-at", detail: "approvedAt must be an ISO timestamp."})
}

const validateApproval = (approvalName, value) => {
  if (!value || typeof value !== "object") {
    issues.push({code: "missing-approval", detail: `${approvalName} approval object is required.`})
    return {
      approved: false,
      approver: null,
      role: null,
      approvedAt: null,
      evidenceCount: 0,
      notes: null,
    }
  }

  const approved = value.approved === true
  const approver = String(value.approver || "").trim()
  const role = String(value.role || "").trim()
  const approvalTimestamp = String(value.approvedAt || "").trim()
  const evidence = Array.isArray(value.evidence)
    ? value.evidence.filter(item => String(item || "").trim())
    : []
  const notes = String(value.notes || "").trim()

  if (!approved) {
    issues.push({code: "approval-not-granted", detail: `${approvalName} approval must be granted.`})
  }
  if (!approver) {
    issues.push({code: "missing-approver", detail: `${approvalName} approver is required.`})
  }
  if (!role) {
    issues.push({code: "missing-role", detail: `${approvalName} role is required.`})
  }
  if (!approvalTimestamp || Number.isNaN(Date.parse(approvalTimestamp))) {
    issues.push({
      code: "invalid-approval-timestamp",
      detail: `${approvalName} approvedAt must be an ISO timestamp.`,
    })
  }
  if (evidence.length === 0) {
    issues.push({
      code: "missing-approval-evidence",
      detail: `${approvalName} approval requires at least one evidence item.`,
    })
  }

  return {
    approved,
    approver: approver || null,
    role: role || null,
    approvedAt: approvalTimestamp || null,
    evidenceCount: evidence.length,
    notes: notes || null,
  }
}

const approvals = payload?.approvals || {}
const securityApproval = validateApproval("security", approvals.security)
const qaApproval = validateApproval("qa", approvals.qa)

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  gapsPath,
  inputPath,
  outputJsonPath,
  outputMdPath,
  auditPath,
  releaseId: releaseId || gapVerification?.releaseId || null,
  approvedAt: approvedAt || null,
  approvals: {
    security: securityApproval,
    qa: qaApproval,
  },
  complete: issues.length === 0,
  issues,
  guidance:
    issues.length === 0
      ? [
          "Security and QA sign-offs are recorded for production gate.",
          "Requirement gate task is complete.",
        ]
      : [
          "Security and QA sign-off record is incomplete.",
          "Resolve approval and evidence gaps before release gate closure.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Security and QA Sign-off Record",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Complete: ${summary.complete ? "yes" : "no"}`,
  `Release ID: ${summary.releaseId || "n/a"}`,
  "",
  "## Approval Status",
  "",
  `- Security approval: ${summary.approvals.security.approved ? "approved" : "not approved"}`,
  `- QA approval: ${summary.approvals.qa.approved ? "approved" : "not approved"}`,
  `- Security evidence items: ${summary.approvals.security.evidenceCount}`,
  `- QA evidence items: ${summary.approvals.qa.evidenceCount}`,
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
  securityApproved: summary.approvals.security.approved,
  qaApproved: summary.approvals.qa.approved,
}

mkdirSync(dirname(auditPath), {recursive: true})
appendFileSync(auditPath, `${JSON.stringify(auditEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.stderr.write("PQC_SECURITY_QA_SIGNOFF_INVALID\n")
  process.exitCode = 1
}
