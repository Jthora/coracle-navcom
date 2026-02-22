import {existsSync, readFileSync} from "node:fs"
import {resolve} from "node:path"
import {
  buildSummaryRows,
  parseExecutionEntries,
  STAGE3_SUBTASK_ROWS,
} from "./lib/groups-upgrade-evidence.mjs"

const jsonMode = process.argv.includes("--json")

const logPath = resolve(process.cwd(), "docs/groups/upgrade/17-stage3-staging-execution-log.md")

if (!existsSync(logPath)) {
  console.error(`❌ Missing Stage 3 execution log: ${logPath}`)
  process.exit(1)
}

const rows = buildSummaryRows(
  STAGE3_SUBTASK_ROWS,
  parseExecutionEntries(readFileSync(logPath, "utf8")),
)

const metadataByTask = new Map([
  [
    "S3-P2-ST1-T1-SU1",
    {phase: "T1", doc: "docs/groups/upgrade/15-stage3-operational-readiness-controls.md"},
  ],
  [
    "S3-P2-ST1-T1-SU2",
    {phase: "T1", doc: "docs/groups/upgrade/15-stage3-operational-readiness-controls.md"},
  ],
  [
    "S3-P2-ST1-T2-SU1",
    {phase: "T2", doc: "docs/groups/upgrade/16-stage3-rollback-drill-runbook.md"},
  ],
  [
    "S3-P2-ST1-T2-SU2",
    {phase: "T2", doc: "docs/groups/upgrade/16-stage3-rollback-drill-runbook.md"},
  ],
  [
    "S3-P2-ST1-T2-SU3",
    {phase: "T2", doc: "docs/groups/upgrade/16-stage3-rollback-drill-runbook.md"},
  ],
  [
    "S3-P2-ST1-T3-SU1",
    {phase: "T3", doc: "docs/groups/upgrade/17-stage3-staging-execution-log.md"},
  ],
  [
    "S3-P2-ST1-T3-SU2",
    {phase: "T3", doc: "docs/groups/upgrade/17-stage3-staging-execution-log.md"},
  ],
])

const pendingRows = rows.filter(row => !row.complete)

const actions = pendingRows.map((row, index) => {
  const meta = metadataByTask.get(row.taskKey) || {
    phase: "unknown",
    doc: "docs/groups/upgrade/17-stage3-staging-execution-log.md",
  }

  return {
    priority: index + 1,
    taskKey: row.taskKey,
    description: row.description,
    phase: meta.phase,
    referenceDoc: meta.doc,
    suggestedCommand: `pnpm groups:stage3:ops:log-entry -- --task-key=${row.taskKey} --outcome=PASS --action='describe staging validation action'`,
  }
})

const plan = {
  generatedAt: new Date().toISOString(),
  pendingCount: actions.length,
  nextTaskKey: actions[0]?.taskKey || null,
  actions,
}

if (jsonMode) {
  console.log(JSON.stringify(plan))
  process.exit(0)
}

console.log("Stage 3 Release Controls Next Actions")
console.log("-------------------------------------")

if (actions.length === 0) {
  console.log("All Stage 3 release-control subtasks already have PASS evidence")
  process.exit(0)
}

for (const action of actions) {
  console.log("")
  console.log(`${action.priority}. ${action.taskKey} — ${action.description}`)
  console.log(`   Phase: ${action.phase}`)
  console.log(`   Reference: ${action.referenceDoc}`)
  console.log(`   Log command: ${action.suggestedCommand}`)
}

process.exit(0)
