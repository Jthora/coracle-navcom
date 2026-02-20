import {spawnSync} from "node:child_process"

const getArgValue = (name, fallback = "") => {
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

const label = getArgValue("--label", "pqc-sustained")
const workloadCommand = getArgValue("--workload-cmd", "")
const dryRun = hasFlag("--dry-run")

if (!workloadCommand && !dryRun) {
  throw new Error("Missing required --workload-cmd argument for non-dry execution.")
}

const runCommand = command => {
  process.stdout.write(`\nPQC_ANDROID_EVIDENCE_STEP:${command}\n`)

  if (dryRun) {
    return {status: 0}
  }

  const result = spawnSync(command, {
    cwd: process.cwd(),
    shell: true,
    encoding: "utf8",
  })

  process.stdout.write(result.stdout || "")
  process.stderr.write(result.stderr || "")

  if ((result.status || 0) !== 0) {
    throw new Error(`Command failed (${result.status || 1}): ${command}`)
  }

  return result
}

const passLowEnd = [
  "node scripts/run-pqc-android-power-pass.mjs",
  "--profile=android-low-end",
  `--label=${label}`,
  workloadCommand ? `--workload-cmd='${workloadCommand.replace(/'/g, "'\\''")}'` : "",
  dryRun ? "--dry-run" : "",
]
  .filter(Boolean)
  .join(" ")

const passMid = [
  "node scripts/run-pqc-android-power-pass.mjs",
  "--profile=android-mid",
  `--label=${label}`,
  workloadCommand ? `--workload-cmd='${workloadCommand.replace(/'/g, "'\\''")}'` : "",
  dryRun ? "--dry-run" : "",
]
  .filter(Boolean)
  .join(" ")

const validate = `node scripts/validate-pqc-power-evidence.mjs --label=${label}`
const summarize = "node scripts/summarize-pqc-power-evidence.mjs"
const syncReport = "node scripts/sync-pqc-power-evidence-report.mjs"
const syncTracker = "node scripts/sync-pqc-power-tracker-status.mjs"

runCommand(passLowEnd)
runCommand(passMid)
runCommand(validate)
runCommand(summarize)
runCommand(syncReport)
runCommand(syncTracker)

process.stdout.write(
  `\nPQC_ANDROID_EVIDENCE_CLOSURE_COMPLETE:${JSON.stringify({label, dryRun, workloadCommand: workloadCommand || null})}\n`,
)
