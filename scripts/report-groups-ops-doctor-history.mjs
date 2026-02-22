import {readdirSync, statSync} from "node:fs"
import {join} from "node:path"

const DEFAULT_DIR = "docs/groups/upgrade/cache/groups-ops-doctor-history"

const args = process.argv.slice(2)
const dirArg = args.find(arg => arg.startsWith("--dir="))
const jsonMode = args.includes("--json")
const strictMode = args.includes("--strict")

const dirPath = dirArg ? dirArg.slice("--dir=".length) : DEFAULT_DIR

const files = readdirSync(dirPath, {withFileTypes: true})
  .filter(entry => entry.isFile() && entry.name.endsWith(".json"))
  .map(entry => {
    const fileName = entry.name
    const fullPath = join(dirPath, fileName)
    const stat = statSync(fullPath)

    return {
      fileName,
      fullPath,
      mtimeMs: stat.mtimeMs,
      mtimeIso: new Date(stat.mtimeMs).toISOString(),
      sizeBytes: stat.size,
    }
  })
  .sort((left, right) => left.fileName.localeCompare(right.fileName))

const totalSizeBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0)
const oldest = files[0] ?? null
const newest = files.at(-1) ?? null

const summary = {
  dirPath,
  strictMode,
  fileCount: files.length,
  totalSizeBytes,
  oldestFile: oldest ? oldest.fileName : null,
  oldestMtimeIso: oldest ? oldest.mtimeIso : null,
  newestFile: newest ? newest.fileName : null,
  newestMtimeIso: newest ? newest.mtimeIso : null,
}

if (jsonMode) {
  console.log(
    JSON.stringify({
      ...summary,
      files,
    }),
  )
  process.exit(0)
}

console.log("Groups Ops Doctor History Report")
console.log("-------------------------------")
console.log(JSON.stringify(summary, null, 2))

if (files.length > 0) {
  console.log("")
  console.log("Most recent files (up to 5):")

  for (const file of files.slice(-5).reverse()) {
    console.log(`- ${file.fileName} (${file.mtimeIso}, ${file.sizeBytes} bytes)`)
  }
}

if (strictMode && files.length === 0) {
  console.error("")
  console.error("❌ Strict mode failed: doctor history directory has no JSON artifacts")
  process.exit(1)
}

process.exit(0)
