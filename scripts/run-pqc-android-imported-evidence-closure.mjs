import {spawnSync} from "node:child_process"
import {inspectBatteryDumpFile} from "./lib/pqc-imported-dump-validation.mjs"

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
const output = getArgValue("--output", "docs/security/pqc/cache/power-metrics.ndjson")
const summaryDir = getArgValue("--summary-dir", "docs/security/pqc/cache")
const inputDir = getArgValue("--input-dir", "")
const dryRun = hasFlag("--dry-run")
const skipSync = hasFlag("--skip-sync")

const lowEndPre = getArgValue(
  "--low-end-pre",
  inputDir ? `${inputDir}/android-low-end-pre.txt` : "",
)
const lowEndPost = getArgValue(
  "--low-end-post",
  inputDir ? `${inputDir}/android-low-end-post.txt` : "",
)
const midPre = getArgValue("--mid-pre", inputDir ? `${inputDir}/android-mid-pre.txt` : "")
const midPost = getArgValue("--mid-post", inputDir ? `${inputDir}/android-mid-post.txt` : "")

const requiredArgs = [
  ["--low-end-pre", lowEndPre],
  ["--low-end-post", lowEndPost],
  ["--mid-pre", midPre],
  ["--mid-post", midPost],
]

for (const [name, value] of requiredArgs) {
  if (!value) {
    throw new Error(`Missing required argument: ${name}`)
  }
}

const importInputs = [
  {name: "--low-end-pre", file: lowEndPre, profile: "android-low-end", phase: "pre"},
  {name: "--low-end-post", file: lowEndPost, profile: "android-low-end", phase: "post"},
  {name: "--mid-pre", file: midPre, profile: "android-mid", phase: "pre"},
  {name: "--mid-post", file: midPost, profile: "android-mid", phase: "post"},
]

const preflightImportedInputs = () => {
  const issues = []

  for (const input of importInputs) {
    const inspection = inspectBatteryDumpFile(input.file)

    if (!inspection.exists) {
      issues.push(`${input.name}: file not found (${inspection.path})`)
      continue
    }

    if (inspection.empty) {
      issues.push(`${input.name}: file is empty (${inspection.path})`)
      continue
    }

    if (!inspection.hasRequiredFields) {
      issues.push(
        `${input.name}: missing required fields level/temperature/voltage/status (${inspection.path})`,
      )
      continue
    }

    if (inspection.placeholder) {
      issues.push(`${input.name}: placeholder template detected (${inspection.path})`)
    }
  }

  if (issues.length > 0) {
    throw new Error(
      `Imported evidence preflight failed:\n- ${issues.join("\n- ")}\nUse real \`adb shell dumpsys battery\` outputs before running closure.`,
    )
  }
}

if (!dryRun) {
  preflightImportedInputs()
}

const runCommand = command => {
  process.stdout.write(`\nPQC_IMPORTED_EVIDENCE_STEP:${command}\n`)

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

const importDump = ({file, profile, phase}) =>
  [
    "node scripts/import-pqc-android-battery-dump.mjs",
    `--file='${file.replace(/'/g, "'\\''")}'`,
    `--output='${output.replace(/'/g, "'\\''")}'`,
    `--label='${label.replace(/'/g, "'\\''")}'`,
    `--profile=${profile}`,
    `--phase=${phase}`,
  ].join(" ")

const analyze = profile =>
  [
    "node scripts/analyze-pqc-power-metrics.mjs",
    `--input='${output.replace(/'/g, "'\\''")}'`,
    `--output='${`${summaryDir}/power-metrics-summary-${profile}.json`.replace(/'/g, "'\\''")}'`,
    `--label='${label.replace(/'/g, "'\\''")}'`,
    "--mode=android",
    `--profile=${profile}`,
  ].join(" ")

runCommand(importDump({file: lowEndPre, profile: "android-low-end", phase: "pre"}))
runCommand(importDump({file: lowEndPost, profile: "android-low-end", phase: "post"}))
runCommand(importDump({file: midPre, profile: "android-mid", phase: "pre"}))
runCommand(importDump({file: midPost, profile: "android-mid", phase: "post"}))

runCommand(analyze("android-low-end"))
runCommand(analyze("android-mid"))

runCommand(
  [
    "node scripts/validate-pqc-power-evidence.mjs",
    `--input='${output.replace(/'/g, "'\\''")}'`,
    `--label='${label.replace(/'/g, "'\\''")}'`,
    "--require-imported-validation",
  ].join(" "),
)

runCommand(
  [
    "node scripts/summarize-pqc-power-evidence.mjs",
    `--input-dir='${summaryDir.replace(/'/g, "'\\''")}'`,
  ].join(" "),
)

if (!skipSync) {
  runCommand("pnpm benchmark:pqc:power:sync-report")
  runCommand("pnpm benchmark:pqc:power:sync-tracker")
}

process.stdout.write(
  `\nPQC_IMPORTED_EVIDENCE_CLOSURE_COMPLETE:${JSON.stringify({label, output, summaryDir, inputDir: inputDir || null, dryRun, skipSync})}\n`,
)
