import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
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

const readinessPath = resolve(
  process.cwd(),
  getArgValue("--readiness", "docs/security/pqc/cache/rollout-readiness.json"),
)
const telemetryPath = resolve(
  process.cwd(),
  getArgValue("--telemetry", "docs/security/pqc/cache/rollout-telemetry.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-error-triage.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-error-triage.md"),
)
const topN = Number.parseInt(getArgValue("--top", "5"), 10)
const warnOnly = hasFlag("--warn-only")

const OWNER_DIRECTORY = {
  "Messaging Foundations": "messaging-foundations@navcom.local",
  "Crypto Runtime": "crypto-runtime@navcom.local",
  "Relay Integrations": "relay-integrations@navcom.local",
  "Group Systems": "group-systems@navcom.local",
  "Release Operations": "release-operations@navcom.local",
}

const READINESS_CLASS_MAP = {
  secureSendSuccessRate: {
    id: "secure-send-success-rate-degraded",
    label: "Secure send success rate degraded",
    owner: "Messaging Foundations",
    severity: "high",
  },
  downgradeRate: {
    id: "downgrade-rate-elevated",
    label: "Downgrade rate elevated",
    owner: "Messaging Foundations",
    severity: "medium",
  },
  decryptFailureRate: {
    id: "decrypt-failure-rate-elevated",
    label: "Decrypt failure rate elevated",
    owner: "Crypto Runtime",
    severity: "high",
  },
  relayRejectRate: {
    id: "relay-reject-rate-elevated",
    label: "Relay reject rate elevated",
    owner: "Relay Integrations",
    severity: "medium",
  },
  groupRekeyP95Ms: {
    id: "group-rekey-latency-elevated",
    label: "Group rekey latency elevated",
    owner: "Group Systems",
    severity: "medium",
  },
}

const normalizeNumeric = value => {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const normalizeSeverity = value => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (
    normalized === "critical" ||
    normalized === "high" ||
    normalized === "medium" ||
    normalized === "low"
  ) {
    return normalized
  }
  return "medium"
}

const severityWeight = severity => {
  if (severity === "critical") return 4
  if (severity === "high") return 3
  if (severity === "medium") return 2
  return 1
}

if (!existsSync(readinessPath)) {
  throw new Error(`Rollout readiness file not found: ${readinessPath}`)
}

if (!existsSync(telemetryPath)) {
  throw new Error(`Rollout telemetry file not found: ${telemetryPath}`)
}

const readiness = JSON.parse(readFileSync(readinessPath, "utf8"))
const telemetry = JSON.parse(readFileSync(telemetryPath, "utf8"))

const telemetryClasses = Array.isArray(telemetry?.errorClasses) ? telemetry.errorClasses : []

const normalizedTelemetryClasses = telemetryClasses.map(item => {
  const owner = item?.owner || "Release Operations"
  const rate = normalizeNumeric(item?.rate)
  const count = normalizeNumeric(item?.count)

  return {
    source: "telemetry",
    id: item?.id || "unclassified-telemetry-error",
    label: item?.label || "Unclassified telemetry error",
    owner,
    ownerContact: OWNER_DIRECTORY[owner] || OWNER_DIRECTORY["Release Operations"],
    severity: normalizeSeverity(item?.severity),
    count,
    rate,
    notes: item?.notes || "",
    reasons: [],
  }
})

const readinessRows = Array.isArray(readiness?.rows) ? readiness.rows : []
const readinessIssues = readinessRows.filter(
  row => row?.status === "fail" || row?.status === "missing",
)

const derivedReadinessClasses = readinessIssues.map(row => {
  const fallback = {
    id: `${row.key || "unknown-metric"}-issue`,
    label: `${row.label || row.key || "Unknown metric"} issue`,
    owner: "Release Operations",
    severity: "medium",
  }
  const mapped = READINESS_CLASS_MAP[row?.key] || fallback

  return {
    source: "readiness",
    id: mapped.id,
    label: mapped.label,
    owner: mapped.owner,
    ownerContact: OWNER_DIRECTORY[mapped.owner] || OWNER_DIRECTORY["Release Operations"],
    severity: mapped.severity,
    count: row?.status === "fail" ? 1 : 0,
    rate: normalizeNumeric(row?.value),
    notes: row?.reason || "",
    reasons: [
      {
        metric: row?.key || null,
        status: row?.status || "missing",
        reason: row?.reason || "unknown",
        target: normalizeNumeric(row?.target),
        value: normalizeNumeric(row?.value),
      },
    ],
  }
})

const classMap = new Map()

for (const item of [...normalizedTelemetryClasses, ...derivedReadinessClasses]) {
  const existing = classMap.get(item.id)

  if (!existing) {
    classMap.set(item.id, item)
    continue
  }

  classMap.set(item.id, {
    ...existing,
    label: existing.label || item.label,
    owner: existing.owner || item.owner,
    ownerContact: existing.ownerContact || item.ownerContact,
    severity:
      severityWeight(existing.severity) >= severityWeight(item.severity)
        ? existing.severity
        : item.severity,
    count: (existing.count || 0) + (item.count || 0),
    rate: existing.rate ?? item.rate,
    notes: [existing.notes, item.notes].filter(Boolean).join("; "),
    reasons: [...(existing.reasons || []), ...(item.reasons || [])],
  })
}

const triageRows = [...classMap.values()]
  .map(item => ({
    ...item,
    owner: item.owner || "Release Operations",
    ownerContact: item.ownerContact || OWNER_DIRECTORY["Release Operations"],
    count: normalizeNumeric(item.count),
    rate: normalizeNumeric(item.rate),
    severity: normalizeSeverity(item.severity),
  }))
  .sort((left, right) => {
    const leftCount = left.count ?? -1
    const rightCount = right.count ?? -1

    if (leftCount !== rightCount) {
      return rightCount - leftCount
    }

    const leftRate = left.rate ?? -1
    const rightRate = right.rate ?? -1

    if (leftRate !== rightRate) {
      return rightRate - leftRate
    }

    const severityDiff = severityWeight(right.severity) - severityWeight(left.severity)

    if (severityDiff !== 0) {
      return severityDiff
    }

    return left.label.localeCompare(right.label)
  })

const selectedRows = triageRows.slice(0, Number.isFinite(topN) && topN > 0 ? topN : 5)

const unowned = selectedRows.filter(item => !item.owner || item.owner === "Release Operations")
const summary = {
  generatedAt: new Date().toISOString(),
  readinessPath,
  telemetryPath,
  outputJsonPath,
  outputMdPath,
  topN,
  warnOnly,
  readyForOwnerReview: selectedRows.length > 0,
  rows: selectedRows,
  unownedCount: unowned.length,
  ownerDirectory: OWNER_DIRECTORY,
  guidance:
    selectedRows.length === 0
      ? ["No error classes available. Populate telemetry.errorClasses before triage."]
      : [
          "Review top error classes with listed owners during daily dogfood standup.",
          "Open owner-tracked remediation items for high-severity classes.",
          "Re-run readiness and triage after remediation to confirm error reduction.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Rollout Error Triage",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Readiness Input: ${summary.readinessPath}`,
  `Telemetry Input: ${summary.telemetryPath}`,
  `Rows Included: ${summary.rows.length}`,
  "",
  "| Rank | Error Class | Severity | Count | Rate | Owner | Contact | Sources |",
  "| ---: | --- | --- | ---: | ---: | --- | --- | --- |",
  ...summary.rows.map((row, index) => {
    const count = row.count === null ? "n/a" : String(row.count)
    const rate = row.rate === null ? "n/a" : String(row.rate)
    const sources = row.source || "mixed"
    return `| ${index + 1} | ${row.label} | ${row.severity} | ${count} | ${rate} | ${row.owner} | ${row.ownerContact} | ${sources} |`
  }),
  "",
  "## Guidance",
  ...summary.guidance.map(item => `- ${item}`),
  "",
].join("\n")

mkdirSync(dirname(outputMdPath), {recursive: true})
writeFileSync(outputMdPath, `${markdown}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (summary.unownedCount > 0 && !warnOnly) {
  process.stderr.write(`PQC_ROLLOUT_TRIAGE_UNOWNED:${summary.unownedCount}\n`)
  process.exitCode = 1
}
