import {resolve} from "node:path"
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

const inputDir = getArgValue("--input-dir", "docs/security/pqc/cache/imported-dumps")
const warnOnly = hasFlag("--warn-only")

const requiredFiles = [
  "android-low-end-pre.txt",
  "android-low-end-post.txt",
  "android-mid-pre.txt",
  "android-mid-post.txt",
]

const rows = requiredFiles.map(name => {
  const filePath = `${inputDir}/${name}`
  const inspection = inspectBatteryDumpFile(filePath)

  return {
    name,
    filePath: inspection.path,
    exists: inspection.exists,
    empty: inspection.empty,
    placeholder: inspection.placeholder,
    hasRequiredFields: inspection.hasRequiredFields,
    parsed: inspection.parsed,
  }
})

const issues = rows.flatMap(row => {
  if (!row.exists) {
    return [{code: "missing-file", file: row.name, path: row.filePath}]
  }

  if (row.empty) {
    return [{code: "empty-file", file: row.name, path: row.filePath}]
  }

  if (!row.hasRequiredFields) {
    return [{code: "missing-required-fields", file: row.name, path: row.filePath}]
  }

  if (row.placeholder) {
    return [{code: "placeholder-template", file: row.name, path: row.filePath}]
  }

  return []
})

const result = {
  generatedAt: new Date().toISOString(),
  inputDir: resolve(process.cwd(), inputDir),
  complete: issues.length === 0,
  warnOnly,
  rows,
  issues,
  guidance:
    issues.length === 0
      ? ["Imported dumps are ready.", "Run: pnpm benchmark:pqc:power:closure:imported:dir"]
      : [
          "Imported dumps are not ready.",
          "Replace placeholder or malformed files in docs/security/pqc/cache/imported-dumps.",
          "Then run: pnpm benchmark:pqc:power:validate-import-dir",
        ],
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

if (!result.complete && !warnOnly) {
  process.stderr.write(
    `PQC_IMPORTED_DUMPS_INVALID:${issues.length} issue(s) found in ${result.inputDir}\n`,
  )
  process.exitCode = 1
}
