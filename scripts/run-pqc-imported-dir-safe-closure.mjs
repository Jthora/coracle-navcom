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
const inputDir = getArgValue("--input-dir", "docs/security/pqc/cache/imported-dumps")
const dryRun = hasFlag("--dry-run")

const runCommand = command => {
  process.stdout.write(`\nPQC_IMPORTED_SAFE_CLOSURE_STEP:${command}\n`)

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

const validateImportDir = [
  "node scripts/validate-pqc-imported-dumps.mjs",
  `--input-dir='${inputDir.replace(/'/g, "'\\''")}'`,
  dryRun ? "--warn-only" : "",
]
  .filter(Boolean)
  .join(" ")

const importedClosure = [
  "node scripts/run-pqc-android-imported-evidence-closure.mjs",
  `--label='${label.replace(/'/g, "'\\''")}'`,
  `--input-dir='${inputDir.replace(/'/g, "'\\''")}'`,
  dryRun ? "--dry-run" : "",
]
  .filter(Boolean)
  .join(" ")

try {
  runCommand(validateImportDir)
  runCommand(importedClosure)

  process.stdout.write(
    `\nPQC_IMPORTED_SAFE_CLOSURE_COMPLETE:${JSON.stringify({label, inputDir, dryRun})}\n`,
  )
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`PQC_IMPORTED_SAFE_CLOSURE_FAILED:${message}\n`)
  process.exitCode = 1
}
