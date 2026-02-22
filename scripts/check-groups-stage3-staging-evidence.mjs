import {existsSync, readFileSync} from "node:fs"
import path from "node:path"
import {
  getTaskEvidenceStatus,
  parseExecutionEntries,
  STAGE3_SUBTASK_ROWS,
} from "./lib/groups-upgrade-evidence.mjs"

const root = process.cwd()
const logPath = path.join(root, "docs/groups/upgrade/17-stage3-staging-execution-log.md")

const requiredTaskKeys = STAGE3_SUBTASK_ROWS.map(row => row.taskKey)

const strict = process.argv.includes("--strict")

const print = message => console.log(message)

if (!existsSync(logPath)) {
  console.error(`❌ Missing execution log: ${path.relative(root, logPath)}`)
  process.exit(1)
}

const content = readFileSync(logPath, "utf8")
const entries = parseExecutionEntries(content)

print("Groups Stage 3 staging evidence status")
print("------------------------------------")

const statusByTask = new Map()

for (const task of requiredTaskKeys) {
  statusByTask.set(task, getTaskEvidenceStatus(entries, task))
}

let allPass = true

for (const [task, status] of statusByTask.entries()) {
  print(`${status.ok ? "✅" : "⏳"} ${task} — ${status.detail}`)

  if (!status.ok) allPass = false
}

if (allPass) {
  print("✅ All required Stage 3 operational-readiness subtasks have PASS evidence")
  process.exit(0)
}

if (strict) {
  console.error("❌ Missing PASS evidence for one or more required Stage 3 subtasks")
  process.exit(1)
}

print("ℹ️ Some Stage 3 subtasks are still pending evidence (non-strict mode)")
process.exit(0)
