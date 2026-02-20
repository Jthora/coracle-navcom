import {spawnSync} from "node:child_process"
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

const profile = getArgValue("--profile", "desktop-baseline")
const dmIterations = Math.max(1, Number.parseInt(getArgValue("--dm-iterations", "200"), 10) || 200)
const groupIterations = Math.max(
  1,
  Number.parseInt(getArgValue("--group-iterations", "200"), 10) || 200,
)
const nodeOptions = getArgValue("--node-options", "")

const env = {
  ...process.env,
  PQC_PRINT_BASELINE: "1",
  PQC_DM_BENCH_ITERATIONS: String(dmIterations),
  PQC_GROUP_BENCH_ITERATIONS: String(groupIterations),
}

if (nodeOptions) {
  env.NODE_OPTIONS = [process.env.NODE_OPTIONS, nodeOptions].filter(Boolean).join(" ")
}

const vitestArgs = [
  "-f",
  "PQC_PERF_RESOURCE:elapsed=%e user=%U sys=%S maxrss_kb=%M",
  "pnpm",
  "vitest",
  "--run",
  "tests/unit/engine/pqc/dm-latency-benchmark.spec.ts",
  "tests/unit/engine/pqc/group-rekey-latency-benchmark.spec.ts",
  "-t",
  "benchmarks DM encrypt/decrypt with strict-vs-compatibility overhead output|captures add/remove/churn benchmark summaries",
]

const result = spawnSync("/usr/bin/time", vitestArgs, {
  cwd: process.cwd(),
  env,
  encoding: "utf8",
})

if ((result.status || 0) !== 0) {
  process.stdout.write(result.stdout || "")
  process.stderr.write(result.stderr || "")
  process.exit(result.status || 1)
}

const combinedOutput = `${result.stdout || ""}\n${result.stderr || ""}`
const dmLine = combinedOutput.split("\n").find(line => line.trim().startsWith("PQC_DM_BASELINE:"))
const groupLine = combinedOutput
  .split("\n")
  .find(line => line.trim().startsWith("PQC_GROUP_REKEY_BASELINE:"))
const resourceLine = combinedOutput
  .split("\n")
  .find(line => line.trim().startsWith("PQC_PERF_RESOURCE:"))

if (!dmLine || !groupLine || !resourceLine) {
  process.stdout.write(result.stdout || "")
  process.stderr.write(result.stderr || "")
  throw new Error("Failed to capture PQC baseline or resource metrics from benchmark output.")
}

const parseResourceMetrics = line => {
  const payload = line.split(":").slice(1).join(":").trim()
  const metrics = {}

  for (const token of payload.split(/\s+/)) {
    const [key, value] = token.split("=")

    if (!key || !value) {
      continue
    }

    metrics[key] = Number.parseFloat(value)
  }

  return metrics
}

const snapshot = {
  timestamp: new Date().toISOString(),
  profile,
  dmIterations,
  groupIterations,
  nodeOptions: nodeOptions || null,
  resource: parseResourceMetrics(resourceLine),
  dm: JSON.parse(dmLine.split(":").slice(1).join(":")),
  group: JSON.parse(groupLine.split(":").slice(1).join(":")),
}

const reportPath = resolve(process.cwd(), "docs/security/pqc/cache/perf-profiles.json")
mkdirSync(dirname(reportPath), {recursive: true})

const existing = existsSync(reportPath)
  ? JSON.parse(readFileSync(reportPath, "utf8"))
  : {profiles: []}

const next = {
  ...existing,
  profiles: [...(Array.isArray(existing.profiles) ? existing.profiles : []), snapshot],
}

writeFileSync(reportPath, `${JSON.stringify(next, null, 2)}\n`, "utf8")

process.stdout.write(result.stdout || "")
process.stderr.write(result.stderr || "")
process.stdout.write(`\nPQC_PERF_PROFILE:${JSON.stringify(snapshot)}\n`)
process.stdout.write(`PQC_PERF_PROFILE_SAVED:${reportPath}\n`)
