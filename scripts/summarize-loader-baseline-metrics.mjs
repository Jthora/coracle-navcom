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

const summarize = values => ({
  count: values.length,
  p50: percentile(values, 0.5),
  p95: percentile(values, 0.95),
})

const toPercentage = (value, total) => {
  if (total === 0) {
    return 0
  }

  return Math.round((value / total) * 1000) / 10
}

const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/loader/performance-plan/cache/baseline-runs.json"),
)
const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/loader/performance-plan/cache/baseline-summary.json"),
)
const markdownPath = resolve(
  process.cwd(),
  getArgValue("--markdown", "docs/loader/performance-plan/cache/baseline-summary.md"),
)

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const runs = Array.isArray(payload) ? payload : Array.isArray(payload.runs) ? payload.runs : []

const bySurface = new Map()

for (const run of runs) {
  const metrics = Array.isArray(run.metrics) ? run.metrics : []

  for (const metric of metrics) {
    const phase = metric?.phase

    if (!["first_event", "first_10_rendered", "query_exhausted"].includes(phase)) {
      continue
    }

    if (typeof metric.elapsedMs !== "number") {
      continue
    }

    const surface = run.surface || metric.surface || "unknown"

    if (!bySurface.has(surface)) {
      bySurface.set(surface, {
        firstEvent: [],
        firstTenRendered: [],
        settle: [],
      })
    }

    const bucket = bySurface.get(surface)

    if (phase === "first_event") {
      bucket.firstEvent.push(metric.elapsedMs)
    } else if (phase === "first_10_rendered") {
      bucket.firstTenRendered.push(metric.elapsedMs)
    } else if (phase === "query_exhausted") {
      bucket.settle.push(metric.elapsedMs)
    }
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  source: inputPath,
  runCount: runs.length,
  surfaces: {},
}

const lines = [
  "# Loader Baseline Summary",
  "",
  `Generated: ${summary.generatedAt}`,
  `Source: ${inputPath}`,
  `Runs: ${runs.length}`,
  "",
  "| Surface | first_event p50/p95 (ms) | first_10_rendered p50/p95 (ms) | settle p50/p95 (ms) | settle >5s rate |",
  "|---|---:|---:|---:|---:|",
]

for (const [surface, bucket] of Array.from(bySurface.entries()).sort(([left], [right]) =>
  left.localeCompare(right),
)) {
  const firstEvent = summarize(bucket.firstEvent)
  const firstTenRendered = summarize(bucket.firstTenRendered)
  const settle = summarize(bucket.settle)
  const settleSlowCount = bucket.settle.filter(value => value > 5000).length
  const settleSlowRate = toPercentage(settleSlowCount, bucket.settle.length)

  summary.surfaces[surface] = {
    firstEvent,
    firstTenRendered,
    settle,
    settleOver5sRate: settleSlowRate,
  }

  const firstEventCell = firstEvent.count > 0 ? `${firstEvent.p50}/${firstEvent.p95}` : "Pending"
  const firstTenCell =
    firstTenRendered.count > 0 ? `${firstTenRendered.p50}/${firstTenRendered.p95}` : "Pending"
  const settleCell = settle.count > 0 ? `${settle.p50}/${settle.p95}` : "Pending"
  const slowRateCell = settle.count > 0 ? `${settleSlowRate}%` : "Pending"

  lines.push(
    `| ${surface} | ${firstEventCell} | ${firstTenCell} | ${settleCell} | ${slowRateCell} |`,
  )
}

if (bySurface.size === 0) {
  lines.push("| Pending | Pending | Pending | Pending | Pending |")
}

lines.push(
  "",
  "Notes:",
  "- settle >5s rate is used as a temporary slow-state proxy until stage_slow bucket events are emitted.",
)

mkdirSync(dirname(outputPath), {recursive: true})
mkdirSync(dirname(markdownPath), {recursive: true})

writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")
writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8")

process.stdout.write(`LOADER_BASELINE_SUMMARY_SAVED:${outputPath}\n`)
process.stdout.write(`LOADER_BASELINE_MARKDOWN_SAVED:${markdownPath}\n`)
