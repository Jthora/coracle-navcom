import {spawnSync} from "node:child_process"
import {mkdirSync, writeFileSync} from "node:fs"
import {dirname, join} from "node:path"

const strictMode = process.argv.includes("--strict")
const jsonMode = process.argv.includes("--json")

const outputArg = process.argv.find(arg => arg.startsWith("--output="))
const outputDirArg = process.argv.find(arg => arg.startsWith("--output-dir="))
const explicitOutputPath = outputArg ? outputArg.slice("--output=".length) : null
const outputDir = outputDirArg ? outputDirArg.slice("--output-dir=".length) : null
const generatedAt = new Date().toISOString()
const timestampToken = generatedAt.replace(/[:.]/g, "-")
const outputPath =
  explicitOutputPath ||
  (outputDir ? join(outputDir, `groups-ops-doctor-summary-${timestampToken}.json`) : null)

const checks = [
  {name: "ops-status", command: ["pnpm", "groups:ops:status"]},
  {name: "stage3-validate", command: ["pnpm", "groups:stage3:ops:validate"]},
  {name: "stage4-validate", command: ["pnpm", "groups:stage4:rollout:validate"]},
  {name: "stage3-sync-summary-dry", command: ["pnpm", "groups:stage3:ops:sync-summary:dry"]},
  {name: "stage4-sync-summary-dry", command: ["pnpm", "groups:stage4:rollout:sync-summary:dry"]},
  {
    name: "ops-runstamp-dry",
    command: ["node", "scripts/sync-groups-ops-runstamp-into-tracker.mjs", "--dry-run"],
  },
]

if (strictMode) {
  checks.splice(1, 0, {name: "ops-status-strict", command: ["pnpm", "groups:ops:status:strict"]})
}

const results = []

for (const check of checks) {
  const [bin, ...args] = check.command
  const res = spawnSync(bin, args, {encoding: "utf8", stdio: "pipe"})
  const exitCode = typeof res.status === "number" ? res.status : 1

  const stdout = (res.stdout || "").trim()
  const stderr = (res.stderr || "").trim()
  const tail = [...stdout.split("\n"), ...stderr.split("\n")]
    .map(line => line.trim())
    .filter(Boolean)
    .slice(-3)

  results.push({
    name: check.name,
    command: check.command.join(" "),
    ok: exitCode === 0,
    exitCode,
    tail,
  })

  if (!jsonMode) {
    console.log(
      `${exitCode === 0 ? "✅" : "❌"} ${check.name} (${check.command.join(" ")}) exit=${exitCode}`,
    )

    for (const line of tail) {
      console.log(`   ${line}`)
    }
  }
}

const failed = results.filter(result => !result.ok)
const summary = {
  generatedAt,
  strictMode,
  jsonMode,
  outputPath,
  checkCount: results.length,
  failedCount: failed.length,
  failedChecks: failed.map(result => result.name),
  allPassed: failed.length === 0,
}

const payload = {
  ...summary,
  checks: results,
}

if (outputPath) {
  mkdirSync(dirname(outputPath), {recursive: true})
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
}

if (jsonMode) {
  console.log(JSON.stringify(payload))
} else {
  console.log("")
  console.log("Groups Ops Doctor Summary")
  console.log("-------------------------")
  console.log(JSON.stringify(summary, null, 2))

  if (outputPath) {
    console.log("")
    console.log(`Doctor summary written: ${outputPath}`)
  }
}

if (strictMode && failed.length > 0) {
  process.exit(1)
}

process.exit(0)
