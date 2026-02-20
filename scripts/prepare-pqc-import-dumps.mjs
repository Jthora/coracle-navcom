import {mkdirSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

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

const outputDir = resolve(
  process.cwd(),
  getArgValue("--dir", "docs/security/pqc/cache/imported-dumps"),
)

mkdirSync(outputDir, {recursive: true})

const template = [
  "# Paste full output of: adb shell dumpsys battery",
  "# Keep the original field formatting.",
  "Current Battery Service state:",
  "  AC powered: false",
  "  USB powered: false",
  "  Wireless powered: false",
  "  status: 3",
  "  level: 0",
  "  scale: 100",
  "  voltage: 0",
  "  temperature: 0",
  "",
].join("\n")

const files = [
  "android-low-end-pre.txt",
  "android-low-end-post.txt",
  "android-mid-pre.txt",
  "android-mid-post.txt",
]

for (const file of files) {
  writeFileSync(resolve(outputDir, file), template, "utf8")
}

const readme = [
  "# PQC Imported Android Battery Dumps",
  "",
  "Collect and paste full `adb shell dumpsys battery` output into each file:",
  "- android-low-end-pre.txt",
  "- android-low-end-post.txt",
  "- android-mid-pre.txt",
  "- android-mid-post.txt",
  "",
  "Capture examples (run from repo root):",
  "- adb -s <LOW_END_SERIAL> shell dumpsys battery > docs/security/pqc/cache/imported-dumps/android-low-end-pre.txt",
  "- adb -s <LOW_END_SERIAL> shell dumpsys battery > docs/security/pqc/cache/imported-dumps/android-low-end-post.txt",
  "- adb -s <MID_SERIAL> shell dumpsys battery > docs/security/pqc/cache/imported-dumps/android-mid-pre.txt",
  "- adb -s <MID_SERIAL> shell dumpsys battery > docs/security/pqc/cache/imported-dumps/android-mid-post.txt",
  "",
  "Importer validation rejects scaffold placeholders by default.",
  "Only use `--allow-placeholder` for dry-run workflow checks.",
  "",
  "Readiness + closure sequence:",
  "1) pnpm benchmark:pqc:power:validate-import-dir",
  "2) pnpm benchmark:pqc:power:closure:imported:safe",
  "",
  "Dry-run guarded sequence:",
  "pnpm benchmark:pqc:power:closure:imported:safe:dry",
  "",
].join("\n")

writeFileSync(resolve(outputDir, "README.md"), readme, "utf8")

process.stdout.write(`${JSON.stringify({outputDir, files: [...files, "README.md"]}, null, 2)}\n`)
