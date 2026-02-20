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

const profile = getArgValue("--profile", "android-low-end")
const label = getArgValue("--label", "pqc-sustained")
const workloadCommand = getArgValue("--workload-cmd", "")
const dryRun = hasFlag("--dry-run")
const summaryOutput = getArgValue(
  "--summary-output",
  `docs/security/pqc/cache/power-metrics-summary-${profile}.json`,
)

const allowedProfiles = new Set(["android-low-end", "android-mid"])

if (!allowedProfiles.has(profile)) {
  throw new Error(
    `Unsupported profile '${profile}'. Expected one of: android-low-end, android-mid.`,
  )
}

if (!workloadCommand && !dryRun) {
  throw new Error("Missing required --workload-cmd argument for non-dry run execution.")
}

const runCommand = command => {
  process.stdout.write(`\nPQC_POWER_PASS_STEP:${command}\n`)

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

if (!dryRun) {
  const adbCheck = spawnSync("node scripts/check-pqc-android-readiness.mjs", {
    cwd: process.cwd(),
    shell: true,
    encoding: "utf8",
  })

  process.stdout.write(adbCheck.stdout || "")
  process.stderr.write(adbCheck.stderr || "")

  if ((adbCheck.status || 0) !== 0) {
    throw new Error("Android readiness preflight failed; cannot execute evidence pass.")
  }
}

const preCapture = `scripts/capture-power-metrics.sh --mode android --label ${label} --phase pre --profile ${profile}`
const postCapture = `scripts/capture-power-metrics.sh --mode android --label ${label} --phase post --profile ${profile}`
const analyze = `node scripts/analyze-pqc-power-metrics.mjs --label=${label} --mode=android --profile=${profile} --output=${summaryOutput}`
const validateProfile = `node scripts/validate-pqc-power-evidence.mjs --label=${label} --profiles=${profile} --phases=pre,post`

runCommand(preCapture)
runCommand(workloadCommand || "echo 'dry-run workload step skipped'")
runCommand(postCapture)
runCommand(analyze)
runCommand(validateProfile)

process.stdout.write(
  `\nPQC_POWER_PASS_COMPLETE:${JSON.stringify({profile, label, dryRun, summaryOutput, workloadCommand: workloadCommand || null})}\n`,
)
