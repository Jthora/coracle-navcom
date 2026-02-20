import {appendFileSync, mkdirSync} from "node:fs"
import {dirname, resolve} from "node:path"
import {
  inspectBatteryDumpFile,
  hasRequiredBatteryFields,
} from "./lib/pqc-imported-dump-validation.mjs"

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

const dumpFile = getArgValue("--file", "")
const allowPlaceholder = process.argv.includes("--allow-placeholder")

if (!dumpFile) {
  throw new Error("Missing required argument: --file=<path-to-dumpsys-output>")
}

const inputPath = resolve(process.cwd(), dumpFile)

const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/security/pqc/cache/power-metrics.ndjson"),
)
const label = getArgValue("--label", "pqc-sustained")
const profile = getArgValue("--profile", "android-low-end")
const phase = getArgValue("--phase", "pre")
const timestamp = getArgValue("--timestamp", new Date().toISOString())

const inspection = inspectBatteryDumpFile(inputPath)

if (!inspection.exists) {
  throw new Error(`Input dump file not found: ${inputPath}`)
}

if (inspection.empty) {
  throw new Error(`Input dump file is empty: ${inputPath}`)
}
const {content: batteryDump, parsed} = inspection

if (!hasRequiredBatteryFields(parsed)) {
  throw new Error(
    `Input dump file is missing required fields (level, temperature, voltage, status): ${inputPath}`,
  )
}

const {level, temperature, voltage, status} = parsed
const looksLikeTemplate = inspection.placeholder

if (looksLikeTemplate && !allowPlaceholder) {
  throw new Error(
    `Input dump appears to be a placeholder template. Provide real dumpsys output or pass --allow-placeholder: ${inputPath}`,
  )
}

const entry = {
  timestamp,
  mode: "android",
  label,
  phase,
  profile,
  source: "imported-dumpsys-file",
  sourcePath: inputPath,
  importedValidation: {
    level,
    temperature,
    voltage,
    status,
    placeholderAccepted: looksLikeTemplate && allowPlaceholder,
  },
  battery_dump: batteryDump,
}

mkdirSync(dirname(outputPath), {recursive: true})
appendFileSync(outputPath, `${JSON.stringify(entry)}\n`, "utf8")

process.stdout.write(
  `${JSON.stringify({
    outputPath,
    label,
    profile,
    phase,
    timestamp,
    sourcePath: inputPath,
  })}\n`,
)
