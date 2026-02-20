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

const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/rollout-telemetry.json"),
)
const outputJson = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/rollout-readiness.json"),
)
const outputMd = resolve(
  process.cwd(),
  getArgValue("--output-md", "docs/security/pqc/cache/rollout-readiness.md"),
)
const warnOnly = hasFlag("--warn-only")

const thresholds = {
  secureSendSuccessRateMin: Number.parseFloat(getArgValue("--secure-success-min", "0.97")),
  downgradeRateMax: Number.parseFloat(getArgValue("--downgrade-rate-max", "0.20")),
  decryptFailureRateMax: Number.parseFloat(getArgValue("--decrypt-failure-rate-max", "0.05")),
  relayRejectRateMax: Number.parseFloat(getArgValue("--relay-reject-rate-max", "0.10")),
  groupRekeyP95MsMax: Number.parseFloat(getArgValue("--group-rekey-p95-max", "25")),
}

if (!existsSync(inputPath)) {
  throw new Error(`Telemetry input file not found: ${inputPath}`)
}

const telemetry = JSON.parse(readFileSync(inputPath, "utf8"))
const metrics = telemetry?.metrics || {}

const checks = [
  {
    key: "secureSendSuccessRate",
    label: "Secure send success rate",
    comparator: "min",
    target: thresholds.secureSendSuccessRateMin,
    value: metrics.secureSendSuccessRate,
  },
  {
    key: "downgradeRate",
    label: "Downgrade rate",
    comparator: "max",
    target: thresholds.downgradeRateMax,
    value: metrics.downgradeRate,
  },
  {
    key: "decryptFailureRate",
    label: "Decrypt failure rate",
    comparator: "max",
    target: thresholds.decryptFailureRateMax,
    value: metrics.decryptFailureRate,
  },
  {
    key: "relayRejectRate",
    label: "Relay reject rate",
    comparator: "max",
    target: thresholds.relayRejectRateMax,
    value: metrics.relayRejectRate,
  },
  {
    key: "groupRekeyP95Ms",
    label: "Group rekey p95 (ms)",
    comparator: "max",
    target: thresholds.groupRekeyP95MsMax,
    value: metrics.groupRekeyP95Ms,
  },
]

const evaluate = check => {
  if (check.value === null || check.value === undefined || check.value === "") {
    return {
      ...check,
      status: "missing",
      pass: false,
      value: null,
      reason: "metric-missing",
    }
  }

  const numeric = Number(check.value)

  if (!Number.isFinite(numeric)) {
    return {
      ...check,
      status: "missing",
      pass: false,
      value: check.value ?? null,
      reason: "metric-missing",
    }
  }

  const pass = check.comparator === "min" ? numeric >= check.target : numeric <= check.target

  return {
    ...check,
    value: numeric,
    pass,
    status: pass ? "pass" : "fail",
    reason: pass ? "within-threshold" : "threshold-exceeded",
  }
}

const rows = checks.map(evaluate)
const failed = rows.filter(row => row.status === "fail")
const missing = rows.filter(row => row.status === "missing")
const ready = failed.length === 0 && missing.length === 0

const summary = {
  generatedAt: new Date().toISOString(),
  inputPath,
  outputJson,
  outputMd,
  warnOnly,
  window: telemetry?.window || null,
  thresholds,
  ready,
  rows,
  failed,
  missing,
  guidance: ready
    ? ["Rollout telemetry checks passed for this window.", "Proceed with next cohort gate review."]
    : [
        "Rollout telemetry checks are not ready for gate expansion.",
        "Populate missing metrics and remediate failed thresholds before enabling broader cohorts.",
      ],
}

mkdirSync(dirname(outputJson), {recursive: true})
writeFileSync(outputJson, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

const markdown = [
  "# PQC Rollout Readiness Summary",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Input: ${summary.inputPath}`,
  `Ready: ${summary.ready ? "yes" : "no"}`,
  "",
  "| Metric | Comparator | Target | Value | Status |",
  "| --- | --- | ---: | ---: | --- |",
  ...summary.rows.map(row => {
    const comparator = row.comparator === "min" ? ">=" : "<="
    const value = Number.isFinite(Number(row.value)) ? Number(row.value).toString() : "n/a"
    return `| ${row.label} | ${comparator} | ${row.target} | ${value} | ${row.status} |`
  }),
  "",
  "## Guidance",
  ...summary.guidance.map(item => `- ${item}`),
  "",
].join("\n")

mkdirSync(dirname(outputMd), {recursive: true})
writeFileSync(outputMd, `${markdown}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!ready && !warnOnly) {
  process.stderr.write("PQC_ROLLOUT_READINESS_NOT_READY\n")
  process.exitCode = 1
}
