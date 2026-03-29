import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
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

const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/loader/performance-plan/cache/baseline-runs.json"),
)
const overwrite = ["1", "true", "yes"].includes(
  String(getArgValue("--overwrite", "false")).toLowerCase(),
)

if (existsSync(outputPath) && !overwrite) {
  const existing = JSON.parse(readFileSync(outputPath, "utf8"))
  const runCount = Array.isArray(existing?.runs)
    ? existing.runs.length
    : Array.isArray(existing)
      ? existing.length
      : 0

  process.stdout.write(`LOADER_BASELINE_RUNS_INIT_SKIPPED:${outputPath}\n`)
  process.stdout.write(`LOADER_BASELINE_RUNS_INIT_EXISTING_RUNS:${runCount}\n`)
  process.exit(0)
}

const payload = {
  capturedAt: new Date().toISOString(),
  sessionContext: {
    environment: {
      capturedAt: new Date().toISOString(),
      timezone: "pending",
      viewport: {
        width: null,
        height: null,
      },
      location: {
        origin: "pending",
        pathname: "pending",
      },
      navigator: {
        userAgent: "pending",
        platform: "pending",
        language: "pending",
        hardwareConcurrency: null,
        deviceMemory: null,
        connection: {
          effectiveType: "pending",
          saveData: false,
        },
      },
    },
    relayProfile: "pending",
    accountState: "pending",
    notes: "Populate with captured benchmark runs via window.__loaderBenchmark.exportRuns().",
  },
  runs: [],
}

mkdirSync(dirname(outputPath), {recursive: true})
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")

process.stdout.write(`LOADER_BASELINE_RUNS_INIT_SAVED:${outputPath}\n`)
process.stdout.write("LOADER_BASELINE_RUNS_INIT_RUNS:0\n")
