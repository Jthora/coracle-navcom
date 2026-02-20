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
  getArgValue("--input", "docs/security/pqc/cache/rollout-telemetry.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-daily-monitor.json"),
)
const outputMdPath = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-daily-monitor.md"),
)
const historyPath = resolve(
  process.cwd(),
  getArgValue("--history", "docs/security/pqc/cache/rollout-daily-monitor.ndjson"),
)
const operator = getArgValue("--operator", "release-operations")
const warnOnly = hasFlag("--warn-only")

const secureSuccessMin = Number.parseFloat(getArgValue("--secure-success-min", "0.97"))
const downgradeRateMax = Number.parseFloat(getArgValue("--downgrade-rate-max", "0.20"))

if (!existsSync(inputPath)) {
  throw new Error(`Telemetry file not found: ${inputPath}`)
}

const telemetry = JSON.parse(readFileSync(inputPath, "utf8"))
const metrics = telemetry?.metrics || {}
const errorClasses = Array.isArray(telemetry?.errorClasses) ? telemetry.errorClasses : []

const toNumber = value => {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const secureSendSuccessRate = toNumber(metrics?.secureSendSuccessRate)
const downgradeRate = toNumber(metrics?.downgradeRate)

const requirements = [
  {
    key: "secureSendSuccessRate",
    label: "Secure send success rate",
    value: secureSendSuccessRate,
    comparator: "min",
    target: secureSuccessMin,
  },
  {
    key: "downgradeRate",
    label: "Downgrade rate",
    value: downgradeRate,
    comparator: "max",
    target: downgradeRateMax,
  },
]

const evaluations = requirements.map(requirement => {
  if (requirement.value === null) {
    return {
      ...requirement,
      pass: false,
      status: "missing",
      reason: "metric-missing",
    }
  }

  const pass =
    requirement.comparator === "min"
      ? requirement.value >= requirement.target
      : requirement.value <= requirement.target

  return {
    ...requirement,
    pass,
    status: pass ? "pass" : "fail",
    reason: pass ? "within-threshold" : "threshold-exceeded",
  }
})

const readHistoryEntries = () => {
  if (!existsSync(historyPath)) {
    return []
  }

  const raw = readFileSync(historyPath, "utf8").trim()

  if (!raw) {
    return []
  }

  return raw
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

const history = readHistoryEntries()
const previous = history.length > 0 ? history[history.length - 1] : null

const computeDelta = (current, prior) => {
  if (typeof current !== "number" || typeof prior !== "number") {
    return null
  }

  return Number((current - prior).toFixed(6))
}

const secureSuccessDelta = computeDelta(secureSendSuccessRate, previous?.secureSendSuccessRate)
const downgradeRateDelta = computeDelta(downgradeRate, previous?.downgradeRate)

const downgradeTopClasses = errorClasses
  .map(item => ({
    id: String(item?.id || "unclassified").trim(),
    label: String(item?.label || "Unclassified").trim(),
    rate: toNumber(item?.rate),
    count: toNumber(item?.count),
    owner: String(item?.owner || "Release Operations").trim(),
  }))
  .sort((left, right) => {
    const leftRate = left.rate ?? -1
    const rightRate = right.rate ?? -1

    if (leftRate !== rightRate) {
      return rightRate - leftRate
    }

    const leftCount = left.count ?? -1
    const rightCount = right.count ?? -1

    if (leftCount !== rightCount) {
      return rightCount - leftCount
    }

    return left.label.localeCompare(right.label)
  })
  .slice(0, 3)

const missing = evaluations.filter(item => item.status === "missing")
const failed = evaluations.filter(item => item.status === "fail")

const summary = {
  generatedAt: new Date().toISOString(),
  operator,
  warnOnly,
  inputPath,
  outputJsonPath,
  outputMdPath,
  historyPath,
  window: telemetry?.window || null,
  thresholds: {
    secureSuccessMin,
    downgradeRateMax,
  },
  secureSendSuccessRate,
  downgradeRate,
  deltas: {
    secureSuccessDelta,
    downgradeRateDelta,
  },
  evaluations,
  missing,
  failed,
  ready: missing.length === 0 && failed.length === 0,
  downgradeTopClasses,
  guidance:
    missing.length === 0 && failed.length === 0
      ? [
          "Daily secure success and downgrade metrics satisfy monitoring thresholds.",
          "Continue telemetry collection and monitor trend deltas before cohort expansion.",
        ]
      : [
          "Daily secure success/downgrade monitoring is not ready.",
          "Populate missing telemetry metrics and remediate threshold failures before expansion.",
        ],
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
writeFileSync(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Rollout Daily Telemetry Monitor",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Operator: ${summary.operator}`,
  `Ready: ${summary.ready ? "yes" : "no"}`,
  summary.window
    ? `Window: ${summary.window.start} to ${summary.window.end} (${summary.window.label})`
    : "Window: unavailable",
  "",
  "## Core Metrics",
  "",
  `- Secure send success rate: ${summary.secureSendSuccessRate ?? "n/a"}`,
  `- Downgrade rate: ${summary.downgradeRate ?? "n/a"}`,
  `- Secure success delta vs previous: ${summary.deltas.secureSuccessDelta ?? "n/a"}`,
  `- Downgrade rate delta vs previous: ${summary.deltas.downgradeRateDelta ?? "n/a"}`,
  "",
  "## Threshold Evaluation",
  "",
  "| Metric | Comparator | Target | Value | Status |",
  "| --- | --- | ---: | ---: | --- |",
  ...summary.evaluations.map(row => {
    const comparator = row.comparator === "min" ? ">=" : "<="
    const value = row.value === null ? "n/a" : String(row.value)
    return `| ${row.label} | ${comparator} | ${row.target} | ${value} | ${row.status} |`
  }),
  "",
  "## Top Downgrade/Error Classes",
  "",
  ...(summary.downgradeTopClasses.length === 0
    ? ["- none"]
    : summary.downgradeTopClasses.map(
        item =>
          `- ${item.id}: rate=${item.rate ?? "n/a"}, count=${item.count ?? "n/a"}, owner=${item.owner}`,
      )),
  "",
  "## Guidance",
  ...summary.guidance.map(item => `- ${item}`),
  "",
].join("\n")

mkdirSync(dirname(outputMdPath), {recursive: true})
writeFileSync(outputMdPath, `${markdown}\n`, "utf8")

const historyEntry = {
  generatedAt: summary.generatedAt,
  operator: summary.operator,
  window: summary.window,
  secureSendSuccessRate: summary.secureSendSuccessRate,
  downgradeRate: summary.downgradeRate,
  secureSuccessDelta,
  downgradeRateDelta,
  ready: summary.ready,
  missingCount: summary.missing.length,
  failedCount: summary.failed.length,
}

mkdirSync(dirname(historyPath), {recursive: true})
appendFileSync(historyPath, `${JSON.stringify(historyEntry)}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.ready && !warnOnly) {
  process.stderr.write("PQC_ROLLOUT_DAILY_MONITOR_NOT_READY\n")
  process.exitCode = 1
}
