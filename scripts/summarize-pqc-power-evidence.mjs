import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"
import {mkdirSync} from "node:fs"

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

const parseProfileArg = value =>
  value
    .split(",")
    .map(token => token.trim())
    .filter(Boolean)

const profiles = parseProfileArg(
  getArgValue("--profiles", "desktop-baseline,android-low-end,android-mid"),
)
const requiredProfiles = parseProfileArg(
  getArgValue("--required-profiles", "android-low-end,android-mid"),
)
const inputDir = resolve(process.cwd(), getArgValue("--input-dir", "docs/security/pqc/cache"))
const outputJson = resolve(
  process.cwd(),
  getArgValue("--output-json", "docs/security/pqc/cache/power-evidence-summary.json"),
)
const outputMarkdown = resolve(
  process.cwd(),
  getArgValue("--output-markdown", "docs/security/pqc/cache/power-evidence-summary.md"),
)

const readSummary = profile => {
  const filePath = resolve(inputDir, `power-metrics-summary-${profile}.json`)

  if (!existsSync(filePath)) {
    return {
      profile,
      sourcePath: filePath,
      present: false,
      complete: false,
      reason: "missing-summary-file",
      sampleCount: 0,
      pairingStrategy: null,
      deltas: null,
    }
  }

  const payload = JSON.parse(readFileSync(filePath, "utf8"))
  const sampleCount = Number.isFinite(payload.sampleCount) ? payload.sampleCount : 0
  const pairingStrategy = payload.pairingStrategy ?? null
  const complete = sampleCount >= 2 && pairingStrategy === "phase-matched"

  return {
    profile,
    sourcePath: filePath,
    present: true,
    complete,
    reason: complete ? null : "insufficient-phase-matched-samples",
    sampleCount,
    pairingStrategy,
    generatedAt: payload.generatedAt ?? null,
    deltas: payload.deltas ?? null,
  }
}

const rows = profiles.map(readSummary)
const missing = rows.filter(row => !row.complete)
const rowByProfile = new Map(rows.map(row => [row.profile, row]))

const requiredMissing = requiredProfiles
  .map(profile => {
    const row = rowByProfile.get(profile)

    if (!row) {
      return {
        profile,
        reason: "missing-required-profile-row",
        sampleCount: 0,
        pairingStrategy: null,
      }
    }

    if (!row.complete) {
      return {
        profile,
        reason: row.reason,
        sampleCount: row.sampleCount,
        pairingStrategy: row.pairingStrategy,
      }
    }

    return null
  })
  .filter(Boolean)

const summary = {
  generatedAt: new Date().toISOString(),
  profiles,
  requiredProfiles,
  complete: missing.length === 0,
  requiredComplete: requiredMissing.length === 0,
  rows,
  missing: missing.map(entry => ({
    profile: entry.profile,
    reason: entry.reason,
    sampleCount: entry.sampleCount,
    pairingStrategy: entry.pairingStrategy,
  })),
  requiredMissing,
  notes: [
    "A profile is complete when sampleCount >= 2 and pairingStrategy is phase-matched.",
    "Android low-end and mid profiles must be complete to close Stage 4.2.2.1.3.",
  ],
}

const markdownLines = [
  "# PQC Power Evidence Summary",
  "",
  `Generated At: ${summary.generatedAt}`,
  `Overall Complete: ${summary.complete ? "yes" : "no"}`,
  `Android Required Complete: ${summary.requiredComplete ? "yes" : "no"}`,
  "",
  "| Profile | Summary Present | Sample Count | Pairing Strategy | Complete |",
  "| --- | --- | ---: | --- | --- |",
  ...rows.map(
    row =>
      `| ${row.profile} | ${row.present ? "yes" : "no"} | ${row.sampleCount} | ${row.pairingStrategy || "n/a"} | ${row.complete ? "yes" : "no"} |`,
  ),
  "",
]

if (!summary.complete) {
  markdownLines.push("## Missing Evidence", "")
  for (const entry of summary.missing) {
    markdownLines.push(
      `- ${entry.profile}: ${entry.reason} (sampleCount=${entry.sampleCount}, pairingStrategy=${entry.pairingStrategy || "n/a"})`,
    )
  }
  markdownLines.push("")
}

if (!summary.requiredComplete) {
  markdownLines.push("## Missing Required Evidence", "")
  for (const entry of summary.requiredMissing) {
    markdownLines.push(
      `- ${entry.profile}: ${entry.reason} (sampleCount=${entry.sampleCount}, pairingStrategy=${entry.pairingStrategy || "n/a"})`,
    )
  }
  markdownLines.push("")
}

mkdirSync(dirname(outputJson), {recursive: true})
mkdirSync(dirname(outputMarkdown), {recursive: true})
writeFileSync(outputJson, `${JSON.stringify(summary, null, 2)}\n`, "utf8")
writeFileSync(outputMarkdown, `${markdownLines.join("\n")}\n`, "utf8")

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
process.stdout.write(`PQC_POWER_EVIDENCE_JSON:${outputJson}\n`)
process.stdout.write(`PQC_POWER_EVIDENCE_MD:${outputMarkdown}\n`)
