import {mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"

const REQUIRED_PHASES_BY_SURFACE = {
  default: ["query_start", "first_event", "query_exhausted"],
  feed: ["query_start", "first_event", "first_10_rendered", "query_exhausted"],
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

const percentile = (values, p) => {
  if (values.length === 0) {
    return null
  }

  const sorted = [...values].sort((left, right) => left - right)
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)

  if (lower === upper) {
    return Math.round(sorted[lower])
  }

  const weight = index - lower

  return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight)
}

const summarizeSeries = values => ({
  count: values.length,
  p50: percentile(values, 0.5),
  p95: percentile(values, 0.95),
})

const getRequiredPhases = surface =>
  REQUIRED_PHASES_BY_SURFACE[surface] || REQUIRED_PHASES_BY_SURFACE.default

const getPhaseLookup = metrics => {
  const lookup = new Map()

  for (const metric of metrics) {
    const phase = metric?.phase

    if (typeof phase !== "string") {
      continue
    }

    if (!lookup.has(phase)) {
      lookup.set(phase, metric)
    }
  }

  return lookup
}

const isChronological = metrics => {
  let previousTimestamp = Number.NEGATIVE_INFINITY

  for (const metric of metrics) {
    const timestamp = metric?.timestamp

    if (typeof timestamp !== "number") {
      continue
    }

    if (timestamp < previousTimestamp) {
      return false
    }

    previousTimestamp = timestamp
  }

  return true
}

const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/loader/performance-plan/cache/baseline-runs.json"),
)
const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/loader/performance-plan/cache/baseline-telemetry-validation.json"),
)
const strictMode = ["1", "true", "yes"].includes(
  String(getArgValue("--strict", "false")).toLowerCase(),
)

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const runs = Array.isArray(payload) ? payload : Array.isArray(payload.runs) ? payload.runs : []

const phaseSlices = {
  queryToFirstEvent: [],
  firstEventToFirstTen: [],
  firstTenToExhausted: [],
  queryToExhausted: [],
}

const result = {
  generatedAt: new Date().toISOString(),
  source: inputPath,
  runCount: runs.length,
  pass: true,
  issues: [],
  counts: {
    missingPhases: 0,
    nonMonotonicTimestamps: 0,
    duplicateRunLabels: 0,
  },
  sliceSummary: {},
}

const seenRunKeys = new Set()

for (const [index, run] of runs.entries()) {
  const surface = typeof run?.surface === "string" ? run.surface : "unknown"
  const label = typeof run?.label === "string" ? run.label : `run-${index + 1}`
  const runKey = `${surface}:${label}`

  if (seenRunKeys.has(runKey)) {
    result.counts.duplicateRunLabels += 1
    result.issues.push({
      type: "duplicate-run-label",
      runIndex: index,
      surface,
      label,
      message: "Duplicate surface+label pair detected.",
    })
  }

  seenRunKeys.add(runKey)

  const metrics = Array.isArray(run?.metrics) ? run.metrics : []

  if (metrics.length === 0) {
    result.counts.missingPhases += 1
    result.issues.push({
      type: "empty-metrics",
      runIndex: index,
      surface,
      label,
      message: "Run has no metrics.",
    })
    continue
  }

  if (!isChronological(metrics)) {
    result.counts.nonMonotonicTimestamps += 1
    result.issues.push({
      type: "non-monotonic-timestamps",
      runIndex: index,
      surface,
      label,
      message: "Metric timestamps are not monotonic.",
    })
  }

  const lookup = getPhaseLookup(metrics)
  const requiredPhases = getRequiredPhases(surface)

  for (const phase of requiredPhases) {
    if (!lookup.has(phase)) {
      result.counts.missingPhases += 1
      result.issues.push({
        type: "missing-phase",
        runIndex: index,
        surface,
        label,
        phase,
        message: `Missing required phase ${phase}.`,
      })
    }
  }

  const firstEvent = lookup.get("first_event")
  const firstTen = lookup.get("first_10_rendered")
  const exhausted = lookup.get("query_exhausted")

  if (typeof firstEvent?.elapsedMs === "number") {
    phaseSlices.queryToFirstEvent.push(firstEvent.elapsedMs)
  }

  if (typeof exhausted?.elapsedMs === "number") {
    phaseSlices.queryToExhausted.push(exhausted.elapsedMs)
  }

  if (typeof firstEvent?.elapsedMs === "number" && typeof firstTen?.elapsedMs === "number") {
    const delta = firstTen.elapsedMs - firstEvent.elapsedMs

    if (delta >= 0) {
      phaseSlices.firstEventToFirstTen.push(delta)
    } else {
      result.issues.push({
        type: "negative-phase-delta",
        runIndex: index,
        surface,
        label,
        message: "first_10_rendered elapsedMs is lower than first_event elapsedMs.",
      })
    }
  }

  if (typeof firstTen?.elapsedMs === "number" && typeof exhausted?.elapsedMs === "number") {
    const delta = exhausted.elapsedMs - firstTen.elapsedMs

    if (delta >= 0) {
      phaseSlices.firstTenToExhausted.push(delta)
    } else {
      result.issues.push({
        type: "negative-phase-delta",
        runIndex: index,
        surface,
        label,
        message: "query_exhausted elapsedMs is lower than first_10_rendered elapsedMs.",
      })
    }
  }
}

result.sliceSummary = {
  queryToFirstEvent: summarizeSeries(phaseSlices.queryToFirstEvent),
  firstEventToFirstTen: summarizeSeries(phaseSlices.firstEventToFirstTen),
  firstTenToExhausted: summarizeSeries(phaseSlices.firstTenToExhausted),
  queryToExhausted: summarizeSeries(phaseSlices.queryToExhausted),
}

if (result.issues.length > 0) {
  result.pass = false
}

mkdirSync(dirname(outputPath), {recursive: true})
writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")

process.stdout.write(`LOADER_TELEMETRY_VALIDATION_SAVED:${outputPath}\n`)
process.stdout.write(`LOADER_TELEMETRY_VALIDATION_PASS:${result.pass}\n`)
process.stdout.write(`LOADER_TELEMETRY_VALIDATION_STRICT:${strictMode}\n`)

if (!result.pass && strictMode) {
  process.exitCode = 1
}
