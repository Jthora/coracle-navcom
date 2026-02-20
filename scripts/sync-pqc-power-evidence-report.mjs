import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

const START = "<!-- PQC_POWER_EVIDENCE_START -->"
const END = "<!-- PQC_POWER_EVIDENCE_END -->"

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

const reportPath = resolve(
  process.cwd(),
  getArgValue("--report", "docs/security/pqc/performance-baseline-report.md"),
)
const summaryPath = resolve(
  process.cwd(),
  getArgValue("--summary", "docs/security/pqc/cache/power-evidence-summary.json"),
)

if (!existsSync(reportPath)) {
  throw new Error(`Report file not found: ${reportPath}`)
}

if (!existsSync(summaryPath)) {
  throw new Error(`Summary file not found: ${summaryPath}`)
}

const report = readFileSync(reportPath, "utf8")
const summary = JSON.parse(readFileSync(summaryPath, "utf8"))

const rows = Array.isArray(summary.rows) ? summary.rows : []

const tableRows = rows
  .map(row => {
    const profile = row.profile || "unknown"
    const present = row.present ? "yes" : "no"
    const sampleCount = Number.isFinite(row.sampleCount) ? row.sampleCount : 0
    const pairing = row.pairingStrategy || "n/a"
    const complete = row.complete ? "yes" : "no"

    return `| ${profile} | ${present} | ${sampleCount} | ${pairing} | ${complete} |`
  })
  .join("\n")

const missingItems = Array.isArray(summary.missing) ? summary.missing : []
const missingLines =
  missingItems.length === 0
    ? "- none"
    : missingItems
        .map(
          item =>
            `- ${item.profile}: ${item.reason} (sampleCount=${item.sampleCount}, pairingStrategy=${item.pairingStrategy || "n/a"})`,
        )
        .join("\n")

const generatedBlock = [
  START,
  "## Power Evidence Snapshot (Auto-Generated)",
  "",
  `Generated At: ${summary.generatedAt || "unknown"}`,
  `Overall Complete: ${summary.complete ? "yes" : "no"}`,
  `Android Required Complete: ${summary.requiredComplete ? "yes" : "no"}`,
  "",
  "| Profile | Summary Present | Sample Count | Pairing Strategy | Complete |",
  "| --- | --- | ---: | --- | --- |",
  tableRows || "| n/a | no | 0 | n/a | no |",
  "",
  "Missing evidence:",
  missingLines,
  END,
  "",
].join("\n")

let next = report

if (report.includes(START) && report.includes(END)) {
  const pattern = new RegExp(`${START}[\\s\\S]*?${END}\\n?`, "m")
  next = report.replace(pattern, generatedBlock)
} else {
  next = `${report.trimEnd()}\n\n${generatedBlock}`
}

writeFileSync(reportPath, next, "utf8")

process.stdout.write(`PQC_POWER_REPORT_SYNCED:${reportPath}\n`)
