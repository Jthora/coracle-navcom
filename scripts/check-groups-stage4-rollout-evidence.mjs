import {existsSync, readFileSync} from "node:fs"
import path from "node:path"
import {
  getTaskEvidenceStatus,
  parseExecutionEntries,
  STAGE4_SUBTASK_ROWS,
} from "./lib/groups-upgrade-evidence.mjs"

const root = process.cwd()
const logPath = path.join(root, "docs/groups/upgrade/18-stage4-controlled-rollout-execution-log.md")

const requiredTaskKeys = STAGE4_SUBTASK_ROWS.map(row => row.taskKey)

const strict = process.argv.includes("--strict")

if (!existsSync(logPath)) {
  console.error(`❌ Missing Stage 4 rollout execution log: ${path.relative(root, logPath)}`)
  process.exit(1)
}

const content = readFileSync(logPath, "utf8")
const entries = parseExecutionEntries(content)

console.log("Groups Stage 4 rollout evidence status")
console.log("------------------------------------")

let allPass = true

for (const task of requiredTaskKeys) {
  const status = getTaskEvidenceStatus(entries, task)
  console.log(`${status.ok ? "✅" : "⏳"} ${task} — ${status.detail}`)

  if (!status.ok) allPass = false
}

if (allPass) {
  console.log("✅ All required Stage 4 rollout subtasks have PASS evidence")
  process.exit(0)
}

if (strict) {
  console.error("❌ Missing PASS evidence for one or more required Stage 4 rollout subtasks")
  process.exit(1)
}

console.log("ℹ️ Some Stage 4 rollout subtasks are still pending evidence (non-strict mode)")
process.exit(0)
