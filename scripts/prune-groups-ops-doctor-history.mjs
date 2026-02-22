import {readdirSync, rmSync, statSync} from "node:fs"
import {join} from "node:path"

const DEFAULT_DIR = "docs/groups/upgrade/cache/groups-ops-doctor-history"

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const dirArg = args.find(arg => arg.startsWith("--dir="))
const keepArg = args.find(arg => arg.startsWith("--keep="))
const maxAgeArg = args.find(arg => arg.startsWith("--max-age-days="))

const dirPath = dirArg ? dirArg.slice("--dir=".length) : DEFAULT_DIR
const keepRaw = keepArg ? keepArg.slice("--keep=".length) : "20"
const keepCount = Number.parseInt(keepRaw, 10)
const maxAgeDaysRaw = maxAgeArg ? maxAgeArg.slice("--max-age-days=".length) : null
const maxAgeDays = maxAgeDaysRaw == null ? null : Number.parseFloat(maxAgeDaysRaw)

if (!Number.isFinite(keepCount) || keepCount < 0) {
  console.error(`Invalid --keep value: ${keepRaw}`)
  process.exit(1)
}

if (maxAgeDaysRaw != null && (!Number.isFinite(maxAgeDays) || maxAgeDays < 0)) {
  console.error(`Invalid --max-age-days value: ${maxAgeDaysRaw}`)
  process.exit(1)
}

const countPruneEnabled = keepArg != null || maxAgeDays == null
const effectiveKeepCount = countPruneEnabled ? keepCount : 0

const entries = readdirSync(dirPath, {withFileTypes: true})
  .filter(entry => entry.isFile() && entry.name.endsWith(".json"))
  .map(entry => {
    const fileName = entry.name
    const fullPath = join(dirPath, fileName)
    const stat = statSync(fullPath)

    return {
      fileName,
      fullPath,
      mtimeMs: stat.mtimeMs,
    }
  })
  .sort((left, right) => left.fileName.localeCompare(right.fileName))

const removeCount = countPruneEnabled ? Math.max(0, entries.length - effectiveKeepCount) : 0
const protectedByKeep = new Set(entries.slice(-effectiveKeepCount).map(entry => entry.fileName))

const removedByCount = countPruneEnabled
  ? entries.slice(0, removeCount).map(entry => entry.fileName)
  : []

const ageCutoffMs = maxAgeDays == null ? null : Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
const removedByAge =
  ageCutoffMs == null
    ? []
    : entries
        .filter(entry => !protectedByKeep.has(entry.fileName) && entry.mtimeMs < ageCutoffMs)
        .map(entry => entry.fileName)

const filesToRemove = [...new Set([...removedByCount, ...removedByAge])].sort()

for (const fileName of filesToRemove) {
  const fullPath = join(dirPath, fileName)

  if (!dryRun) {
    rmSync(fullPath)
  }
}

console.log(
  JSON.stringify(
    {
      dirPath,
      dryRun,
      keepCount,
      countPruneEnabled,
      effectiveKeepCount,
      maxAgeDays,
      ageCutoffIso: ageCutoffMs == null ? null : new Date(ageCutoffMs).toISOString(),
      totalFiles: entries.length,
      removedCount: filesToRemove.length,
      removedFiles: filesToRemove,
      removedByCount,
      removedByAge,
      keptCount: entries.length - filesToRemove.length,
      keptNewestFiles:
        effectiveKeepCount === 0
          ? []
          : entries
              .slice(-Math.min(effectiveKeepCount, entries.length))
              .map(entry => entry.fileName),
    },
    null,
    2,
  ),
)
