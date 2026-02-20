import {existsSync, readFileSync} from "node:fs"
import {resolve} from "node:path"

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

const hasFlag = name => process.argv.includes(name)

const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/security/pqc/cache/power-metrics.ndjson"),
)
const label = getArgValue("--label", "pqc-sustained")
const warnOnly = hasFlag("--warn-only")
const requireImportedValidation = hasFlag("--require-imported-validation")
const maxPairAgeMinutes = Number.parseFloat(getArgValue("--max-pair-age-minutes", "0"))

const parseCsv = value =>
  value
    .split(",")
    .map(token => token.trim())
    .filter(Boolean)

const requiredProfiles = parseCsv(getArgValue("--profiles", "android-low-end,android-mid"))
const requiredPhases = parseCsv(getArgValue("--phases", "pre,post"))

const readEntries = () => {
  if (!existsSync(inputPath)) {
    return []
  }

  const content = readFileSync(inputPath, "utf8").trim()

  if (!content) {
    return []
  }

  return content
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

const entries = readEntries().filter(entry => {
  if (entry?.label !== label) {
    return false
  }

  return entry?.mode === "android"
})

const latestByProfilePhase = new Map()

for (const entry of entries) {
  const profile = entry?.profile
  const phase = entry?.phase

  if (!profile || !phase) {
    continue
  }

  const key = `${profile}:${phase}`
  const current = latestByProfilePhase.get(key)

  if (!current || new Date(entry.timestamp).getTime() > new Date(current.timestamp).getTime()) {
    latestByProfilePhase.set(key, entry)
  }
}

const matrix = requiredProfiles.map(profile => {
  const phases = requiredPhases.map(phase => {
    const snapshot = latestByProfilePhase.get(`${profile}:${phase}`) || null

    return {
      phase,
      present: Boolean(snapshot),
      timestamp: snapshot?.timestamp || null,
      source: snapshot?.source || null,
      importedValidation: snapshot?.importedValidation || null,
    }
  })

  return {
    profile,
    phases,
  }
})

const prePostDiagnostics = matrix.map(row => {
  const pre = row.phases.find(phase => phase.phase === "pre") || null
  const post = row.phases.find(phase => phase.phase === "post") || null

  const hasPair = Boolean(pre?.present && post?.present)
  const preMs = pre?.timestamp ? new Date(pre.timestamp).getTime() : NaN
  const postMs = post?.timestamp ? new Date(post.timestamp).getTime() : NaN
  const orderValid =
    hasPair && Number.isFinite(preMs) && Number.isFinite(postMs) ? postMs >= preMs : null
  const ageMinutes =
    hasPair && Number.isFinite(preMs) && Number.isFinite(postMs)
      ? Math.abs(postMs - preMs) / (1000 * 60)
      : null
  const ageValid =
    maxPairAgeMinutes > 0 && Number.isFinite(ageMinutes) ? ageMinutes <= maxPairAgeMinutes : null

  return {
    profile: row.profile,
    hasPair,
    orderValid,
    ageMinutes,
    maxPairAgeMinutes: maxPairAgeMinutes > 0 ? maxPairAgeMinutes : null,
    ageValid,
  }
})

const missing = []

for (const row of matrix) {
  for (const phase of row.phases) {
    if (!phase.present) {
      missing.push({
        profile: row.profile,
        phase: phase.phase,
      })
    }
  }
}

const invalidPairing = []

for (const diagnostic of prePostDiagnostics) {
  if (!diagnostic.hasPair) {
    continue
  }

  if (diagnostic.orderValid === false) {
    invalidPairing.push({
      profile: diagnostic.profile,
      reason: "post-before-pre",
      ageMinutes: diagnostic.ageMinutes,
    })
    continue
  }

  if (diagnostic.ageValid === false) {
    invalidPairing.push({
      profile: diagnostic.profile,
      reason: "pair-age-exceeds-limit",
      ageMinutes: diagnostic.ageMinutes,
      maxPairAgeMinutes,
    })
  }
}

const importedValidationIssues = []

if (requireImportedValidation) {
  for (const row of matrix) {
    for (const phase of row.phases) {
      if (!phase.present) {
        continue
      }

      if (phase.source !== "imported-dumpsys-file") {
        importedValidationIssues.push({
          profile: row.profile,
          phase: phase.phase,
          reason: "non-imported-source",
          source: phase.source,
        })
        continue
      }

      const imported = phase.importedValidation
      const validImportedPayload =
        imported &&
        Number.isFinite(imported.level) &&
        Number.isFinite(imported.temperature) &&
        Number.isFinite(imported.voltage) &&
        typeof imported.status === "string" &&
        imported.status.trim() !== "" &&
        imported.placeholderAccepted !== true

      if (!validImportedPayload) {
        importedValidationIssues.push({
          profile: row.profile,
          phase: phase.phase,
          reason: "missing-or-invalid-imported-validation",
        })
      }
    }
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  inputPath,
  label,
  requiredProfiles,
  requiredPhases,
  androidSnapshotCount: entries.length,
  matrix,
  prePostDiagnostics,
  missing,
  invalidPairing,
  importedValidationRequired: requireImportedValidation,
  importedValidationIssues,
  complete:
    missing.length === 0 &&
    invalidPairing.length === 0 &&
    (!requireImportedValidation || importedValidationIssues.length === 0),
  notes: [
    "Stage 4.2.2.1.3 requires pre/post Android evidence for low-end and mid profiles.",
    "Capture snapshots with phase/profile metadata before running final analyzer commands.",
    maxPairAgeMinutes > 0
      ? `Configured pair-age ceiling: ${maxPairAgeMinutes} minute(s).`
      : "Pair-age ceiling disabled (set --max-pair-age-minutes to enforce freshness).",
    requireImportedValidation
      ? "Imported validation enforcement enabled (source/importedValidation metadata required)."
      : "Imported validation enforcement disabled.",
  ],
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (!summary.complete && !warnOnly) {
  process.exit(1)
}
