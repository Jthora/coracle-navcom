import {existsSync, readFileSync} from "node:fs"
import {resolve} from "node:path"
import {
  buildSummaryRows,
  parseExecutionEntries,
  STAGE3_SUBTASK_ROWS,
} from "./lib/groups-upgrade-evidence.mjs"

const jsonMode = process.argv.includes("--json")
const strictMode = process.argv.includes("--strict")

const logPath = resolve(process.cwd(), "docs/groups/upgrade/17-stage3-staging-execution-log.md")

if (!existsSync(logPath)) {
  console.error(`❌ Missing Stage 3 execution log: ${logPath}`)
  process.exit(1)
}

const rows = buildSummaryRows(
  STAGE3_SUBTASK_ROWS,
  parseExecutionEntries(readFileSync(logPath, "utf8")),
)

const sections = [
  {
    id: "S3-P2-ST1-T1",
    title: "Validate dashboard alerts and thresholds",
    subtasks: ["S3-P2-ST1-T1-SU1", "S3-P2-ST1-T1-SU2"],
  },
  {
    id: "S3-P2-ST1-T2",
    title: "Run rollback drill and confirm runbook",
    subtasks: ["S3-P2-ST1-T2-SU1", "S3-P2-ST1-T2-SU2", "S3-P2-ST1-T2-SU3"],
  },
  {
    id: "S3-P2-ST1-T3",
    title: "Complete release readiness sign-off",
    subtasks: ["S3-P2-ST1-T3-SU1", "S3-P2-ST1-T3-SU2"],
  },
]

const rowByTaskKey = new Map(rows.map(row => [row.taskKey, row]))

const sectionRows = sections.map(section => {
  const details = section.subtasks.map(taskKey => rowByTaskKey.get(taskKey)).filter(Boolean)
  const completeCount = details.filter(detail => detail.complete).length
  const totalCount = details.length

  return {
    ...section,
    totalCount,
    completeCount,
    complete: totalCount > 0 && completeCount === totalCount,
    pendingTaskKeys: details.filter(detail => !detail.complete).map(detail => detail.taskKey),
    details,
  }
})

const pendingRows = rows.filter(row => !row.complete)
const nextTask = pendingRows[0] || null

const summary = {
  generatedAt: new Date().toISOString(),
  totalTaskCount: rows.length,
  completeTaskCount: rows.filter(row => row.complete).length,
  pendingTaskCount: pendingRows.length,
  allComplete: pendingRows.length === 0,
  sections: sectionRows.map(section => ({
    id: section.id,
    title: section.title,
    complete: section.complete,
    completeCount: section.completeCount,
    totalCount: section.totalCount,
    pendingTaskKeys: section.pendingTaskKeys,
  })),
  nextTask: nextTask
    ? {
        taskKey: nextTask.taskKey,
        description: nextTask.description,
        suggestedCommand: `pnpm groups:stage3:ops:log-entry -- --task-key=${nextTask.taskKey} --outcome=PASS --action='describe staging validation action'`,
      }
    : null,
}

if (jsonMode) {
  console.log(
    JSON.stringify({
      ...summary,
      rows,
    }),
  )
} else {
  console.log("Stage 3 Release Controls Status")
  console.log("-------------------------------")
  console.log(
    `Progress: ${summary.completeTaskCount}/${summary.totalTaskCount} complete (${summary.pendingTaskCount} pending)`,
  )

  for (const section of sectionRows) {
    const marker = section.complete ? "✅" : "⏳"
    console.log("")
    console.log(
      `${marker} ${section.id} — ${section.title} (${section.completeCount}/${section.totalCount})`,
    )

    for (const detail of section.details) {
      console.log(
        `   ${detail.complete ? "✅" : "⏳"} ${detail.taskKey} — ${detail.status} (${detail.description})`,
      )
    }
  }

  console.log("")

  if (nextTask) {
    console.log(`Next priority task: ${nextTask.taskKey} — ${nextTask.description}`)
    console.log(
      `Suggested log command: pnpm groups:stage3:ops:log-entry -- --task-key=${nextTask.taskKey} --outcome=PASS --action='describe staging validation action'`,
    )
  } else {
    console.log("All Stage 3 release-control subtasks have PASS evidence")
  }
}

if (strictMode && pendingRows.length > 0) {
  console.error("❌ Strict mode failed: one or more Stage 3 release-control subtasks are pending")
  process.exit(1)
}

process.exit(0)
