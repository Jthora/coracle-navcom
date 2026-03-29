import {mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"

const SEVERITY_SCORE = {
  high: 3,
  medium: 2,
  low: 1,
}

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

const toStatus = value => (value ? "Pass" : "Fail")

const loadJson = path => JSON.parse(readFileSync(path, "utf8"))

const runsPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/loader/performance-plan/cache/baseline-runs.json"),
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
const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json"),
)
const markdownPath = resolve(
  process.cwd(),
  getArgValue("--markdown", "docs/loader/performance-plan/cache/baseline-telemetry-usefulness.md"),
)
const strictMode = ["1", "true", "yes"].includes(
  String(getArgValue("--strict", "false")).toLowerCase(),
)

const runsPayload = loadJson(runsPath)
const validation = loadJson(validationPath)
const diagnosis = loadJson(diagnosisPath)

const runs = Array.isArray(runsPayload)
  ? runsPayload
  : Array.isArray(runsPayload.runs)
    ? runsPayload.runs
    : []
const runCount = runs.length

const segmentSummary = diagnosis?.diagnostics?.segmentSummary || {}
const hasNetworkGranularity = Number(segmentSummary?.networkMs?.count || 0) > 0
const hasReductionGranularity = Number(segmentSummary?.reductionMs?.count || 0) > 0
const hasRenderGranularity = Number(segmentSummary?.renderMs?.count || 0) > 0
const unknownRate = Number(diagnosis?.diagnostics?.unknownRate ?? 100)

const classificationCounts = diagnosis?.diagnostics?.classificationCounts || {}
const classifierDistinguishes =
  Number(classificationCounts.network_delay || 0) > 0 ||
  Number(classificationCounts.reduction_delay || 0) > 0 ||
  Number(classificationCounts.render_delay || 0) > 0

const blindSpots = Array.isArray(diagnosis?.blindSpots) ? diagnosis.blindSpots : []
const rankedBlindSpots = [...blindSpots].sort((left, right) => {
  const scoreDiff = (SEVERITY_SCORE[right?.severity] || 0) - (SEVERITY_SCORE[left?.severity] || 0)

  if (scoreDiff !== 0) {
    return scoreDiff
  }

  return String(left?.id || "").localeCompare(String(right?.id || ""))
})

const remediationTickets = Array.isArray(diagnosis?.remediationTickets)
  ? diagnosis.remediationTickets
  : []

const checks = [
  {
    id: "2.2.2.1.1",
    label: "Validate event ordering across phases",
    pass:
      Boolean(validation?.pass) && Number(validation?.counts?.nonMonotonicTimestamps || 0) === 0,
    evidence: {
      validationPass: Boolean(validation?.pass),
      nonMonotonicTimestamps: Number(validation?.counts?.nonMonotonicTimestamps || 0),
      missingPhases: Number(validation?.counts?.missingPhases || 0),
    },
  },
  {
    id: "2.2.2.1.2",
    label: "Test known synthetic slow scenarios",
    pass: Boolean(diagnosis?.syntheticScenarioChecks?.pass),
    evidence: {
      syntheticScenarioPass: Boolean(diagnosis?.syntheticScenarioChecks?.pass),
      scenarioCount: Array.isArray(diagnosis?.syntheticScenarioChecks?.results)
        ? diagnosis.syntheticScenarioChecks.results.length
        : 0,
    },
  },
  {
    id: "2.2.2.1.3",
    label: "Confirm metric granularity supports diagnosis",
    pass:
      runCount > 0 &&
      hasNetworkGranularity &&
      hasReductionGranularity &&
      hasRenderGranularity &&
      unknownRate <= 20 &&
      classifierDistinguishes,
    evidence: {
      runCount,
      hasNetworkGranularity,
      hasReductionGranularity,
      hasRenderGranularity,
      unknownRate,
      classifierDistinguishes,
    },
  },
  {
    id: "2.2.2.2.1",
    label: "List missing timers and counters",
    pass: true,
    evidence: {
      blindSpotCount: blindSpots.length,
      blindSpotIds: blindSpots.map(spot => spot.id),
    },
  },
  {
    id: "2.2.2.2.2",
    label: "Rank blind spots by debugging impact",
    pass: true,
    evidence: {
      rankedBlindSpots: rankedBlindSpots.map(spot => ({
        id: spot.id,
        severity: spot.severity,
        title: spot.title,
      })),
    },
  },
  {
    id: "2.2.2.2.3",
    label: "Create remediation tickets",
    pass: blindSpots.length === remediationTickets.length,
    evidence: {
      blindSpotCount: blindSpots.length,
      remediationTicketCount: remediationTickets.length,
      remediationTicketIds: remediationTickets.map(ticket => ticket.id),
    },
  },
]

const overallPass = checks.every(check => check.pass)

const result = {
  generatedAt: new Date().toISOString(),
  pass: overallPass,
  source: {
    runs: runsPath,
    validation: validationPath,
    diagnosis: diagnosisPath,
  },
  runCount,
  checks,
  blindSpots: rankedBlindSpots,
  remediationTickets,
}

const lines = [
  "# Loader Baseline Telemetry Usefulness Assessment",
  "",
  `Generated: ${result.generatedAt}`,
  `Runs: ${result.runCount}`,
  `Overall status: ${toStatus(result.pass)}`,
  "",
  "## Checklist",
  "",
  ...checks.map(check => `- ${check.id} ${check.label}: ${toStatus(check.pass)}`),
  "",
  "## Ranked Blind Spots",
  "",
]

if (rankedBlindSpots.length === 0) {
  lines.push("- None.")
} else {
  for (const [index, spot] of rankedBlindSpots.entries()) {
    lines.push(
      `- ${index + 1}. [${String(spot.severity || "unknown").toUpperCase()}] ${spot.id}: ${spot.title}`,
    )
  }
}

lines.push("", "## Remediation Tickets", "")

if (remediationTickets.length === 0) {
  lines.push("- None.")
} else {
  for (const ticket of remediationTickets) {
    lines.push(`- ${ticket.id}: ${ticket.title}`)
  }
}

mkdirSync(dirname(outputPath), {recursive: true})
mkdirSync(dirname(markdownPath), {recursive: true})

writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8")

process.stdout.write(`LOADER_TELEMETRY_USEFULNESS_SAVED:${outputPath}\n`)
process.stdout.write(`LOADER_TELEMETRY_USEFULNESS_MARKDOWN_SAVED:${markdownPath}\n`)
process.stdout.write(`LOADER_TELEMETRY_USEFULNESS_PASS:${result.pass}\n`)
process.stdout.write(`LOADER_TELEMETRY_USEFULNESS_STRICT:${strictMode}\n`)

if (!result.pass && strictMode) {
  process.exitCode = 1
}
