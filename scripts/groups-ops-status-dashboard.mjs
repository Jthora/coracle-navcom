import {existsSync, readFileSync} from "node:fs"
import {resolve} from "node:path"

const getArgValue = (name, fallback) => {
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

const stage3SummaryPath = resolve(
  process.cwd(),
  getArgValue(
    "--stage3-summary",
    "docs/groups/upgrade/cache/stage3-operational-evidence-summary.json",
  ),
)
const stage4SummaryPath = resolve(
  process.cwd(),
  getArgValue("--stage4-summary", "docs/groups/upgrade/cache/stage4-rollout-evidence-summary.json"),
)

const strict = process.argv.includes("--strict")

if (!existsSync(stage3SummaryPath)) {
  throw new Error(`Stage 3 summary file not found: ${stage3SummaryPath}`)
}

if (!existsSync(stage4SummaryPath)) {
  throw new Error(`Stage 4 summary file not found: ${stage4SummaryPath}`)
}

const stage3 = JSON.parse(readFileSync(stage3SummaryPath, "utf8"))
const stage4 = JSON.parse(readFileSync(stage4SummaryPath, "utf8"))

const stageRows = [
  {
    key: "Stage 3",
    generatedAt: stage3.generatedAt || "unknown",
    completed: stage3.completeTaskCount ?? 0,
    total: stage3.totalTaskCount ?? 0,
    pending: stage3.pendingTaskCount ?? 0,
    allComplete: Boolean(stage3.allComplete),
    pendingTaskKeys: Array.isArray(stage3.pendingTaskKeys) ? stage3.pendingTaskKeys : [],
  },
  {
    key: "Stage 4",
    generatedAt: stage4.generatedAt || "unknown",
    completed: stage4.completeTaskCount ?? 0,
    total: stage4.totalTaskCount ?? 0,
    pending: stage4.pendingTaskCount ?? 0,
    allComplete: Boolean(stage4.allComplete),
    pendingTaskKeys: Array.isArray(stage4.pendingTaskKeys) ? stage4.pendingTaskKeys : [],
  },
]

const allComplete = stageRows.every(row => row.allComplete)
const totalCompleted = stageRows.reduce((sum, row) => sum + row.completed, 0)
const totalTasks = stageRows.reduce((sum, row) => sum + row.total, 0)
const totalPending = stageRows.reduce((sum, row) => sum + row.pending, 0)

console.log("Groups Ops Cross-Stage Status Dashboard")
console.log("---------------------------------------")

for (const row of stageRows) {
  console.log(
    `${row.allComplete ? "✅" : "⏳"} ${row.key} — ${row.completed}/${row.total} complete, ${row.pending} pending (summary @ ${row.generatedAt})`,
  )

  if (row.pendingTaskKeys.length > 0) {
    console.log(`   Pending keys (up to 5): ${row.pendingTaskKeys.slice(0, 5).join(", ")}`)
  }
}

console.log("")
console.log(
  `${allComplete ? "✅" : "⏳"} Combined — ${totalCompleted}/${totalTasks} complete, ${totalPending} pending`,
)

if (!allComplete && strict) {
  console.error("❌ Strict mode failed: one or more cross-stage evidence tasks are still pending")
  process.exit(1)
}

process.exit(0)
