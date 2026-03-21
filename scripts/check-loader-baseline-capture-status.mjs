import {mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"

const REQUIRED_SURFACES = ["feed", "intel map", "notifications", "groups", "bootstrap"]

const SURFACE_ALIASES = {
  map: "intel map",
  "intel-map": "intel map",
  intel_map: "intel map",
  intelmap: "intel map",
}

const SURFACE_LABELS = {
  feed: "Feed",
  "intel map": "Intel Map",
  notifications: "Notifications",
  groups: "Groups",
  bootstrap: "Bootstrap",
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

const normalizeSurface = value => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "unknown"

  return SURFACE_ALIASES[normalized] || normalized
}

const toLabel = surface => SURFACE_LABELS[surface] || surface

const toPercent = (value, total) => {
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
  getArgValue("--output", "docs/loader/performance-plan/cache/baseline-capture-status.json"),
)
const markdownPath = resolve(
  process.cwd(),
  getArgValue("--markdown", "docs/loader/performance-plan/cache/baseline-capture-status.md"),
)
const requiredRuns = Number(getArgValue("--required-runs", "10"))
const briefMode = ["1", "true", "yes"].includes(
  String(getArgValue("--brief", "false")).toLowerCase(),
)
const surfaceOrder = new Map(REQUIRED_SURFACES.map((surface, index) => [surface, index]))

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const runs = Array.isArray(payload) ? payload : Array.isArray(payload.runs) ? payload.runs : []

const counts = new Map()

for (const run of runs) {
  const surface = normalizeSurface(run?.surface)
  counts.set(surface, (counts.get(surface) || 0) + 1)
}

const surfaces = REQUIRED_SURFACES.map(surface => {
  const runCount = counts.get(surface) || 0
  const remainingRuns = Math.max(0, requiredRuns - runCount)

  return {
    surface,
    label: toLabel(surface),
    runCount,
    requiredRuns,
    remainingRuns,
    complete: remainingRuns === 0,
    completionPercent: toPercent(runCount, requiredRuns),
  }
})

const totalRequiredRuns = requiredRuns * REQUIRED_SURFACES.length
const remainingRuns = surfaces.reduce((total, item) => total + item.remainingRuns, 0)
const completeSurfaceCount = surfaces.filter(item => item.complete).length

const result = {
  generatedAt: new Date().toISOString(),
  source: inputPath,
  requiredRunsPerSurface: requiredRuns,
  totalRequiredRuns,
  totalCapturedRuns: runs.length,
  remainingRuns,
  completionPercent: toPercent(runs.length, totalRequiredRuns),
  completeSurfaceCount,
  totalSurfaceCount: REQUIRED_SURFACES.length,
  pass: remainingRuns === 0,
  surfaces,
  nextActions: surfaces
    .filter(item => !item.complete)
    .sort((left, right) => right.remainingRuns - left.remainingRuns)
    .map(item => `Capture ${item.remainingRuns} additional runs for ${item.label}`),
}

const prioritizedRemaining = surfaces
  .filter(item => !item.complete)
  .sort((left, right) => {
    if (right.remainingRuns !== left.remainingRuns) {
      return right.remainingRuns - left.remainingRuns
    }

    return (
      (surfaceOrder.get(left.surface) ?? Number.MAX_SAFE_INTEGER) -
      (surfaceOrder.get(right.surface) ?? Number.MAX_SAFE_INTEGER)
    )
  })

const nextTarget = prioritizedRemaining[0]

result.nextTarget = nextTarget
  ? {
      surface: nextTarget.surface,
      label: nextTarget.label,
      remainingRuns: nextTarget.remainingRuns,
      runCount: nextTarget.runCount,
      requiredRuns: nextTarget.requiredRuns,
    }
  : null

const lines = [
  "# Loader Baseline Capture Status",
  "",
  `Generated: ${result.generatedAt}`,
  `Source: ${inputPath}`,
  `Progress: ${result.totalCapturedRuns}/${result.totalRequiredRuns} runs (${result.completionPercent}%)`,
  `Surfaces complete: ${result.completeSurfaceCount}/${result.totalSurfaceCount}`,
  "",
  "| Surface | Runs | Required | Remaining | Completion |",
  "|---|---:|---:|---:|---:|",
  ...surfaces.map(
    item =>
      `| ${item.label} | ${item.runCount} | ${item.requiredRuns} | ${item.remainingRuns} | ${item.completionPercent}% |`,
  ),
]

if (result.nextActions.length > 0) {
  lines.push("", "Next actions:")

  for (const action of result.nextActions) {
    lines.push(`- ${action}`)
  }
}

mkdirSync(dirname(outputPath), {recursive: true})
mkdirSync(dirname(markdownPath), {recursive: true})

writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8")

process.stdout.write(`LOADER_BASELINE_CAPTURE_STATUS_SAVED:${outputPath}\n`)
process.stdout.write(`LOADER_BASELINE_CAPTURE_STATUS_MARKDOWN_SAVED:${markdownPath}\n`)
process.stdout.write(`LOADER_BASELINE_CAPTURE_STATUS_PASS:${result.pass}\n`)

if (nextTarget) {
  process.stdout.write(
    `LOADER_BASELINE_CAPTURE_STATUS_NEXT_TARGET:${nextTarget.surface}:${nextTarget.runCount}/${nextTarget.requiredRuns}:remaining=${nextTarget.remainingRuns}\n`,
  )
}

if (briefMode) {
  const summary = nextTarget
    ? `next=${nextTarget.surface} remaining=${nextTarget.remainingRuns} progress=${result.totalCapturedRuns}/${result.totalRequiredRuns} surfaces=${result.completeSurfaceCount}/${result.totalSurfaceCount}`
    : `next=none remaining=0 progress=${result.totalCapturedRuns}/${result.totalRequiredRuns} surfaces=${result.completeSurfaceCount}/${result.totalSurfaceCount}`

  process.stdout.write(`LOADER_BASELINE_CAPTURE_STATUS_BRIEF:${summary}\n`)
}
