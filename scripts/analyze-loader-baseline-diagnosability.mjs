import {mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"

const SCENARIO_MARGIN_RATIO = 1.2

const SYNTHETIC_SCENARIOS = [
  {
    id: "network-dominant",
    expected: "network_delay",
    segments: {
      networkMs: 3200,
      reductionMs: 420,
      renderMs: 380,
      settleTailMs: 350,
    },
  },
  {
    id: "reduction-dominant",
    expected: "reduction_delay",
    segments: {
      networkMs: 420,
      reductionMs: 2800,
      renderMs: 390,
      settleTailMs: 250,
    },
  },
  {
    id: "render-dominant",
    expected: "render_delay",
    segments: {
      networkMs: 460,
      reductionMs: 510,
      renderMs: 2900,
      settleTailMs: 260,
    },
  },
]

const BLIND_SPOT_DEFINITIONS = [
  {
    id: "missing-reducer-phase",
    severity: "high",
    title: "Reducer span missing from runs",
    recommendation:
      "Ensure reducer_start and reducer_end are emitted for every feed/notifications reduction pass.",
    ticketHint: "LOADER-OBS-001",
  },
  {
    id: "missing-first-ten",
    severity: "medium",
    title: "first_10_rendered missing on feed runs",
    recommendation:
      "Confirm first_10_rendered emits once per feed reload on both snapshot and stream paths.",
    ticketHint: "LOADER-OBS-002",
  },
  {
    id: "high-unknown-classification-rate",
    severity: "medium",
    title: "High unknown bottleneck classification rate",
    recommendation:
      "Add missing phase spans so at least network/reduction/render segments are available for each run.",
    ticketHint: "LOADER-OBS-003",
  },
]

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

const toPercent = (count, total) => {
  if (total === 0) {
    return 0
  }

  return Math.round((count / total) * 1000) / 10
}

const loadJson = path => JSON.parse(readFileSync(path, "utf8"))

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

const classifySegments = segments => {
  const ranked = [
    {key: "network_delay", value: segments.networkMs},
    {key: "reduction_delay", value: segments.reductionMs},
    {key: "render_delay", value: segments.renderMs},
  ].filter(item => typeof item.value === "number" && item.value >= 0)

  if (ranked.length < 2) {
    return "unknown"
  }

  ranked.sort((left, right) => right.value - left.value)

  const [first, second] = ranked

  if (second.value === 0 && first.value > 0) {
    return first.key
  }

  if (second.value > 0 && first.value / second.value >= SCENARIO_MARGIN_RATIO) {
    return first.key
  }

  return "mixed"
}

const getRunSegments = metrics => {
  const lookup = getPhaseLookup(metrics)

  const firstEvent = lookup.get("first_event")
  const firstTen = lookup.get("first_10_rendered")
  const exhausted = lookup.get("query_exhausted")
  const reducerStart = lookup.get("reducer_start")
  const reducerEnd = lookup.get("reducer_end")

  const networkMs = typeof firstEvent?.elapsedMs === "number" ? firstEvent.elapsedMs : null
  const renderMs =
    typeof firstEvent?.elapsedMs === "number" && typeof firstTen?.elapsedMs === "number"
      ? firstTen.elapsedMs - firstEvent.elapsedMs
      : null
  const reductionMs =
    typeof reducerStart?.elapsedMs === "number" && typeof reducerEnd?.elapsedMs === "number"
      ? reducerEnd.elapsedMs - reducerStart.elapsedMs
      : null
  const settleTailMs =
    typeof firstTen?.elapsedMs === "number" && typeof exhausted?.elapsedMs === "number"
      ? exhausted.elapsedMs - firstTen.elapsedMs
      : null

  return {
    networkMs: typeof networkMs === "number" && networkMs >= 0 ? networkMs : null,
    reductionMs: typeof reductionMs === "number" && reductionMs >= 0 ? reductionMs : null,
    renderMs: typeof renderMs === "number" && renderMs >= 0 ? renderMs : null,
    settleTailMs: typeof settleTailMs === "number" && settleTailMs >= 0 ? settleTailMs : null,
  }
}

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
const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/loader/performance-plan/cache/baseline-diagnosability.json"),
)
const markdownPath = resolve(
  process.cwd(),
  getArgValue("--markdown", "docs/loader/performance-plan/cache/baseline-diagnosability.md"),
)

const runsPayload = loadJson(runsPath)
const validationPayload = loadJson(validationPath)
const runs = Array.isArray(runsPayload)
  ? runsPayload
  : Array.isArray(runsPayload.runs)
    ? runsPayload.runs
    : []

const classificationCounts = {
  network_delay: 0,
  reduction_delay: 0,
  render_delay: 0,
  mixed: 0,
  unknown: 0,
}

const segmentSamples = {
  networkMs: [],
  reductionMs: [],
  renderMs: [],
  settleTailMs: [],
}

const missingReducerBySurface = new Map()
const missingFirstTenBySurface = new Map()
const perRun = []

for (const [index, run] of runs.entries()) {
  const metrics = Array.isArray(run?.metrics) ? run.metrics : []
  const segments = getRunSegments(metrics)
  const classification = classifySegments(segments)
  const surface = typeof run?.surface === "string" ? run.surface : "unknown"
  const label = typeof run?.label === "string" ? run.label : `run-${index + 1}`

  classificationCounts[classification] += 1

  if (segments.networkMs !== null) segmentSamples.networkMs.push(segments.networkMs)
  if (segments.reductionMs !== null) segmentSamples.reductionMs.push(segments.reductionMs)
  if (segments.renderMs !== null) segmentSamples.renderMs.push(segments.renderMs)
  if (segments.settleTailMs !== null) segmentSamples.settleTailMs.push(segments.settleTailMs)

  if (segments.reductionMs === null) {
    missingReducerBySurface.set(surface, (missingReducerBySurface.get(surface) || 0) + 1)
  }

  if (segments.renderMs === null && surface === "feed") {
    missingFirstTenBySurface.set(surface, (missingFirstTenBySurface.get(surface) || 0) + 1)
  }

  perRun.push({
    runIndex: index,
    surface,
    label,
    classification,
    segments,
  })
}

const syntheticScenarioChecks = SYNTHETIC_SCENARIOS.map(scenario => {
  const actual = classifySegments(scenario.segments)

  return {
    id: scenario.id,
    expected: scenario.expected,
    actual,
    pass: actual === scenario.expected,
  }
})

const syntheticScenarioPass = syntheticScenarioChecks.every(item => item.pass)
const unknownRate = toPercent(classificationCounts.unknown, runs.length)

const blindSpots = []

if (Array.from(missingReducerBySurface.values()).some(count => count > 0)) {
  blindSpots.push({
    ...BLIND_SPOT_DEFINITIONS[0],
    evidence: {
      missingRunsBySurface: Object.fromEntries(missingReducerBySurface.entries()),
    },
  })
}

if (Array.from(missingFirstTenBySurface.values()).some(count => count > 0)) {
  blindSpots.push({
    ...BLIND_SPOT_DEFINITIONS[1],
    evidence: {
      missingRunsBySurface: Object.fromEntries(missingFirstTenBySurface.entries()),
    },
  })
}

if (unknownRate > 20) {
  blindSpots.push({
    ...BLIND_SPOT_DEFINITIONS[2],
    evidence: {
      unknownClassificationRate: unknownRate,
    },
  })
}

const diagnosis = {
  generatedAt: new Date().toISOString(),
  source: {
    runs: runsPath,
    validation: validationPath,
  },
  runCount: runs.length,
  validationPass: Boolean(validationPayload?.pass),
  diagnostics: {
    classificationCounts,
    unknownRate,
    segmentSummary: {
      networkMs: summarizeSeries(segmentSamples.networkMs),
      reductionMs: summarizeSeries(segmentSamples.reductionMs),
      renderMs: summarizeSeries(segmentSamples.renderMs),
      settleTailMs: summarizeSeries(segmentSamples.settleTailMs),
    },
  },
  syntheticScenarioChecks: {
    pass: syntheticScenarioPass,
    marginRatio: SCENARIO_MARGIN_RATIO,
    results: syntheticScenarioChecks,
  },
  blindSpots,
  remediationTickets: blindSpots.map(spot => ({
    id: spot.ticketHint,
    title: spot.title,
    severity: spot.severity,
    recommendation: spot.recommendation,
  })),
  perRun,
}

const lines = [
  "# Loader Baseline Diagnosability",
  "",
  `Generated: ${diagnosis.generatedAt}`,
  `Runs: ${diagnosis.runCount}`,
  `Validation pass: ${diagnosis.validationPass}`,
  "",
  "## Classification Counts",
  "",
  `- network_delay: ${classificationCounts.network_delay}`,
  `- reduction_delay: ${classificationCounts.reduction_delay}`,
  `- render_delay: ${classificationCounts.render_delay}`,
  `- mixed: ${classificationCounts.mixed}`,
  `- unknown: ${classificationCounts.unknown} (${unknownRate}%)`,
  "",
  "## Synthetic Scenario Checks",
  "",
  `- pass: ${syntheticScenarioPass}`,
  ...syntheticScenarioChecks.map(
    item => `- ${item.id}: expected=${item.expected}, actual=${item.actual}, pass=${item.pass}`,
  ),
  "",
  "## Blind Spots",
  "",
]

if (blindSpots.length === 0) {
  lines.push("- None detected from available baseline traces.")
} else {
  for (const spot of blindSpots) {
    lines.push(
      `- ${spot.severity.toUpperCase()} ${spot.id}: ${spot.title} (${spot.ticketHint})`,
      `  - Recommendation: ${spot.recommendation}`,
    )
  }
}

mkdirSync(dirname(outputPath), {recursive: true})
mkdirSync(dirname(markdownPath), {recursive: true})

writeFileSync(outputPath, `${JSON.stringify(diagnosis, null, 2)}\n`, "utf8")
writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8")

process.stdout.write(`LOADER_DIAGNOSABILITY_SAVED:${outputPath}\n`)
process.stdout.write(`LOADER_DIAGNOSABILITY_MARKDOWN_SAVED:${markdownPath}\n`)
process.stdout.write(`LOADER_DIAGNOSABILITY_SYNTHETIC_PASS:${syntheticScenarioPass}\n`)
process.stdout.write(`LOADER_DIAGNOSABILITY_BLIND_SPOTS:${blindSpots.length}\n`)
