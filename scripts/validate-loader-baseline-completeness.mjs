import {mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"

const REQUIRED_SURFACES = ["feed", "intel map", "notifications", "groups", "bootstrap"]

const SURFACE_ALIASES = {
  map: "intel map",
  "intel-map": "intel map",
  intel_map: "intel map",
  intelmap: "intel map",
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

const toTitleCaseSurface = surface => {
  if (surface === "feed") return "Feed"
  if (surface === "intel map") return "Intel Map"
  if (surface === "notifications") return "Notifications"
  if (surface === "groups") return "Groups"
  if (surface === "bootstrap") return "Bootstrap"

  return surface
    .split(/\s+/)
    .filter(Boolean)
    .map(token => token[0].toUpperCase() + token.slice(1))
    .join(" ")
}

const inputPath = resolve(
  process.cwd(),
  getArgValue("--input", "docs/loader/performance-plan/cache/baseline-runs.json"),
)
const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/loader/performance-plan/cache/baseline-completeness.json"),
)
const markdownPath = resolve(
  process.cwd(),
  getArgValue("--markdown", "docs/loader/performance-plan/cache/baseline-completeness.md"),
)
const requiredRuns = Number(getArgValue("--required-runs", "10"))
const strictMode = ["1", "true", "yes"].includes(
  String(getArgValue("--strict", "false")).toLowerCase(),
)

const payload = JSON.parse(readFileSync(inputPath, "utf8"))
const runs = Array.isArray(payload) ? payload : Array.isArray(payload.runs) ? payload.runs : []

const counts = new Map()

for (const run of runs) {
  const surface = normalizeSurface(run?.surface)
  counts.set(surface, (counts.get(surface) || 0) + 1)
}

const perSurface = REQUIRED_SURFACES.map(surface => {
  const runCount = counts.get(surface) || 0

  return {
    surface,
    runCount,
    requiredRuns,
    shortfall: Math.max(0, requiredRuns - runCount),
    pass: runCount >= requiredRuns,
  }
})

const missingSurfaces = perSurface.filter(item => !item.pass)

const result = {
  generatedAt: new Date().toISOString(),
  source: inputPath,
  runCount: runs.length,
  requiredRunsPerSurface: requiredRuns,
  pass: missingSurfaces.length === 0,
  surfaces: perSurface,
  issues: missingSurfaces.map(item => ({
    type: "insufficient-runs",
    surface: item.surface,
    runCount: item.runCount,
    requiredRuns,
    shortfall: item.shortfall,
    message: `${item.surface} has ${item.runCount}/${requiredRuns} runs captured.`,
  })),
}

const lines = [
  "# Loader Baseline Completeness",
  "",
  `Generated: ${result.generatedAt}`,
  `Source: ${inputPath}`,
  `Total runs: ${result.runCount}`,
  `Required runs per surface: ${requiredRuns}`,
  "",
  "| Surface | Runs | Required | Status |",
  "|---|---:|---:|---|",
  ...perSurface.map(
    item =>
      `| ${toTitleCaseSurface(item.surface)} | ${item.runCount} | ${item.requiredRuns} | ${item.pass ? "Pass" : `Missing ${item.shortfall}`} |`,
  ),
]

if (result.issues.length > 0) {
  lines.push("", "Issues:")

  for (const issue of result.issues) {
    lines.push(`- ${toTitleCaseSurface(issue.surface)}: ${issue.message}`)
  }
}

mkdirSync(dirname(outputPath), {recursive: true})
mkdirSync(dirname(markdownPath), {recursive: true})

writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8")

process.stdout.write(`LOADER_BASELINE_COMPLETENESS_SAVED:${outputPath}\n`)
process.stdout.write(`LOADER_BASELINE_COMPLETENESS_MARKDOWN_SAVED:${markdownPath}\n`)
process.stdout.write(`LOADER_BASELINE_COMPLETENESS_PASS:${result.pass}\n`)
process.stdout.write(`LOADER_BASELINE_COMPLETENESS_STRICT:${strictMode}\n`)

if (!result.pass && strictMode) {
  process.exitCode = 1
}
