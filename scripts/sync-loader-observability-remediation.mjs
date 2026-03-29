import {mkdirSync, readFileSync, writeFileSync} from "node:fs"
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

const toTitleCase = value =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(token => token[0].toUpperCase() + token.slice(1))
    .join(" ")

const diagnosisPath = resolve(
  process.cwd(),
  getArgValue("--diagnosis", "docs/loader/performance-plan/cache/baseline-diagnosability.json"),
)
const outputJsonPath = resolve(
  process.cwd(),
  getArgValue(
    "--output",
    "docs/loader/performance-plan/cache/baseline-observability-remediation.json",
  ),
)
const outputMarkdownPath = resolve(
  process.cwd(),
  getArgValue(
    "--markdown",
    "docs/loader/performance-plan/cache/baseline-observability-remediation.md",
  ),
)
const strictMode = ["1", "true", "yes"].includes(
  String(getArgValue("--strict", "false")).toLowerCase(),
)

const diagnosis = JSON.parse(readFileSync(diagnosisPath, "utf8"))
const blindSpots = Array.isArray(diagnosis?.blindSpots) ? diagnosis.blindSpots : []
const remediationTickets = Array.isArray(diagnosis?.remediationTickets)
  ? diagnosis.remediationTickets
  : []

const remediation = {
  generatedAt: new Date().toISOString(),
  source: diagnosisPath,
  runCount: typeof diagnosis?.runCount === "number" ? diagnosis.runCount : 0,
  unknownRate:
    typeof diagnosis?.diagnostics?.unknownRate === "number"
      ? diagnosis.diagnostics.unknownRate
      : null,
  blindSpotCount: blindSpots.length,
  pass: blindSpots.length === 0,
  tickets: remediationTickets.map(ticket => ({
    id: ticket.id || "LOADER-OBS-UNSPECIFIED",
    title: ticket.title || "Unspecified observability remediation",
    severity: ticket.severity || "unknown",
    recommendation: ticket.recommendation || "No recommendation provided.",
  })),
}

const lines = [
  "# Loader Observability Remediation",
  "",
  `Generated: ${remediation.generatedAt}`,
  `Source: ${diagnosisPath}`,
  `Run count: ${remediation.runCount}`,
  `Blind spots: ${remediation.blindSpotCount}`,
  `Unknown classification rate: ${
    remediation.unknownRate === null ? "n/a" : `${remediation.unknownRate}%`
  }`,
  "",
  "## Remediation Tickets",
  "",
]

if (remediation.tickets.length === 0) {
  lines.push("- No remediation tickets generated. Observability blind spots not detected.")
} else {
  for (const ticket of remediation.tickets) {
    lines.push(
      `- ${ticket.id} [${toTitleCase(ticket.severity)}]: ${ticket.title}`,
      `  - Recommendation: ${ticket.recommendation}`,
    )
  }
}

mkdirSync(dirname(outputJsonPath), {recursive: true})
mkdirSync(dirname(outputMarkdownPath), {recursive: true})

writeFileSync(outputJsonPath, `${JSON.stringify(remediation, null, 2)}\n`, "utf8")
writeFileSync(outputMarkdownPath, `${lines.join("\n")}\n`, "utf8")

process.stdout.write(`LOADER_OBSERVABILITY_REMEDIATION_SAVED:${outputJsonPath}\n`)
process.stdout.write(`LOADER_OBSERVABILITY_REMEDIATION_MARKDOWN_SAVED:${outputMarkdownPath}\n`)
process.stdout.write(`LOADER_OBSERVABILITY_REMEDIATION_PASS:${remediation.pass}\n`)
process.stdout.write(`LOADER_OBSERVABILITY_REMEDIATION_STRICT:${strictMode}\n`)

if (!remediation.pass && strictMode) {
  process.exitCode = 1
}
