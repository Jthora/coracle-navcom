import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"

const getArgValue = (name, fallback) => {
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

const loadJson = path => {
  if (!existsSync(path)) {
    return null
  }

  return JSON.parse(readFileSync(path, "utf8"))
}

const toStatus = value => (value ? "Pass" : "Fail")

const completenessPath = resolve(
  process.cwd(),
  getArgValue("--completeness", "docs/loader/performance-plan/cache/baseline-completeness.json"),
)
const validationPath = resolve(
  process.cwd(),
  getArgValue(
    "--validation",
    "docs/loader/performance-plan/cache/baseline-telemetry-validation.json",
  ),
)
const diagnosisPath = resolve(
  process.cwd(),
  getArgValue("--diagnosis", "docs/loader/performance-plan/cache/baseline-diagnosability.json"),
)
const usefulnessPath = resolve(
  process.cwd(),
  getArgValue(
    "--usefulness",
    "docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json",
  ),
)
const remediationPath = resolve(
  process.cwd(),
  getArgValue(
    "--remediation",
    "docs/loader/performance-plan/cache/baseline-observability-remediation.json",
  ),
)
const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/loader/performance-plan/cache/baseline-issue-review.json"),
)
const markdownPath = resolve(
  process.cwd(),
  getArgValue("--markdown", "docs/loader/performance-plan/cache/baseline-issue-review.md"),
)
const strictMode = ["1", "true", "yes"].includes(
  String(getArgValue("--strict", "false")).toLowerCase(),
)

const completeness = loadJson(completenessPath)
const validation = loadJson(validationPath)
const diagnosis = loadJson(diagnosisPath)
const usefulness = loadJson(usefulnessPath)
const remediation = loadJson(remediationPath)

const missingArtifacts = [
  ["completeness", completenessPath, completeness],
  ["validation", validationPath, validation],
  ["diagnosis", diagnosisPath, diagnosis],
  ["usefulness", usefulnessPath, usefulness],
  ["remediation", remediationPath, remediation],
]
  .filter(([, , payload]) => !payload)
  .map(([key, path]) => ({key, path}))

const completenessIssues = Array.isArray(completeness?.issues) ? completeness.issues.length : null
const validationIssues = Array.isArray(validation?.issues) ? validation.issues.length : null
const diagnosisBlindSpots = Array.isArray(diagnosis?.blindSpots)
  ? diagnosis.blindSpots.length
  : null
const usefulnessChecks = Array.isArray(usefulness?.checks) ? usefulness.checks.length : null
const usefulnessPassedChecks = Array.isArray(usefulness?.checks)
  ? usefulness.checks.filter(check => check.pass).length
  : null
const remediationTickets = Array.isArray(remediation?.tickets) ? remediation.tickets.length : null

const gates = {
  completeness: completeness ? Boolean(completeness.pass) : null,
  telemetryValidation: validation ? Boolean(validation.pass) : null,
  diagnosability: diagnosis
    ? Array.isArray(diagnosis?.blindSpots)
      ? diagnosis.blindSpots.length === 0
      : null
    : null,
  telemetryUsefulness: usefulness ? Boolean(usefulness.pass) : null,
  observabilityRemediation: remediation ? Boolean(remediation.pass) : null,
}

const pass = missingArtifacts.length === 0 && Object.values(gates).every(value => value === true)

const result = {
  generatedAt: new Date().toISOString(),
  pass,
  source: {
    completeness: completenessPath,
    validation: validationPath,
    diagnosis: diagnosisPath,
    usefulness: usefulnessPath,
    remediation: remediationPath,
  },
  missingArtifacts,
  gates,
  counts: {
    completenessIssues,
    validationIssues,
    diagnosisBlindSpots,
    usefulnessChecks,
    usefulnessPassedChecks,
    remediationTickets,
  },
  blockers: [
    ...(completeness && completeness.pass === false
      ? [
          {
            type: "completeness",
            message: `Baseline completeness has ${completenessIssues ?? "n/a"} issues.`,
          },
        ]
      : []),
    ...(validation && validation.pass === false
      ? [
          {
            type: "telemetry-validation",
            message: `Telemetry validation has ${validationIssues ?? "n/a"} issues.`,
          },
        ]
      : []),
    ...(diagnosis && diagnosisBlindSpots !== null && diagnosisBlindSpots > 0
      ? [
          {
            type: "diagnosability",
            message: `Diagnosability identified ${diagnosisBlindSpots} blind spots.`,
          },
        ]
      : []),
    ...(usefulness && usefulness.pass === false
      ? [
          {
            type: "telemetry-usefulness",
            message: `Telemetry usefulness checklist passed ${
              usefulnessPassedChecks ?? "n/a"
            }/${usefulnessChecks ?? "n/a"} checks.`,
          },
        ]
      : []),
    ...(remediation && remediation.pass === false
      ? [
          {
            type: "remediation",
            message: `Observability remediation has ${remediationTickets ?? "n/a"} tickets remaining.`,
          },
        ]
      : []),
    ...missingArtifacts.map(artifact => ({
      type: "missing-artifact",
      message: `Missing required artifact: ${artifact.key} (${artifact.path})`,
    })),
  ],
}

const lines = [
  "# Loader Baseline Issue Review",
  "",
  `Generated: ${result.generatedAt}`,
  `Overall status: ${toStatus(result.pass)}`,
  "",
  "## Gate Summary",
  "",
  `- Completeness: ${gates.completeness === null ? "Missing" : toStatus(gates.completeness)}`,
  `- Telemetry validation: ${
    gates.telemetryValidation === null ? "Missing" : toStatus(gates.telemetryValidation)
  }`,
  `- Diagnosability: ${gates.diagnosability === null ? "Missing" : toStatus(gates.diagnosability)}`,
  `- Telemetry usefulness: ${
    gates.telemetryUsefulness === null ? "Missing" : toStatus(gates.telemetryUsefulness)
  }`,
  `- Observability remediation: ${
    gates.observabilityRemediation === null ? "Missing" : toStatus(gates.observabilityRemediation)
  }`,
  "",
  "## Counts",
  "",
  `- completeness issues: ${completenessIssues === null ? "n/a" : completenessIssues}`,
  `- validation issues: ${validationIssues === null ? "n/a" : validationIssues}`,
  `- diagnosis blind spots: ${diagnosisBlindSpots === null ? "n/a" : diagnosisBlindSpots}`,
  `- usefulness checklist: ${
    usefulnessChecks === null || usefulnessPassedChecks === null
      ? "n/a"
      : `${usefulnessPassedChecks}/${usefulnessChecks}`
  }`,
  `- remediation tickets: ${remediationTickets === null ? "n/a" : remediationTickets}`,
  "",
  "## Blockers",
  "",
]

if (result.blockers.length === 0) {
  lines.push("- None. Issue review gates passed.")
} else {
  for (const blocker of result.blockers) {
    lines.push(`- [${blocker.type}] ${blocker.message}`)
  }
}

mkdirSync(dirname(outputPath), {recursive: true})
mkdirSync(dirname(markdownPath), {recursive: true})

writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8")

process.stdout.write(`LOADER_BASELINE_ISSUE_REVIEW_SAVED:${outputPath}\n`)
process.stdout.write(`LOADER_BASELINE_ISSUE_REVIEW_MARKDOWN_SAVED:${markdownPath}\n`)
process.stdout.write(`LOADER_BASELINE_ISSUE_REVIEW_PASS:${result.pass}\n`)
process.stdout.write(`LOADER_BASELINE_ISSUE_REVIEW_STRICT:${strictMode}\n`)

if (!result.pass && strictMode) {
  process.exitCode = 1
}
