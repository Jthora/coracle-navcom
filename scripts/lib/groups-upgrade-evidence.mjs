export const STAGE3_SUBTASK_ROWS = [
  {taskKey: "S3-P2-ST1-T1-SU1", description: "Confirm alert thresholds in staging"},
  {taskKey: "S3-P2-ST1-T1-SU2", description: "Validate alert routing to owners"},
  {taskKey: "S3-P2-ST1-T2-SU1", description: "Execute rollback in controlled env"},
  {taskKey: "S3-P2-ST1-T2-SU2", description: "Record timings and recovery outcomes"},
  {taskKey: "S3-P2-ST1-T2-SU3", description: "Update runbook with drill findings"},
  {taskKey: "S3-P2-ST1-T3-SU1", description: "Gather Product/Engineering/QA approvals"},
  {taskKey: "S3-P2-ST1-T3-SU2", description: "Capture final go/no-go decision log"},
]

export const STAGE4_SUBTASK_ROWS = [
  {taskKey: "S4-P1-ST1-T1-SU1", description: "Enable pilot cohort flags"},
  {taskKey: "S4-P1-ST1-T1-SU2", description: "Validate pilot environment health checks"},
  {taskKey: "S4-P1-ST1-T2-SU1", description: "Review 24h conversion and drop-off metrics"},
  {taskKey: "S4-P1-ST1-T2-SU2", description: "Review error and fallback trends"},
  {taskKey: "S4-P1-ST1-T3-SU1", description: "Triage blocker regressions by severity"},
  {taskKey: "S4-P1-ST1-T3-SU2", description: "Patch and verify fixes in pilot"},
  {taskKey: "S4-P1-ST1-T3-SU3", description: "Reconfirm go criteria after fixes"},
  {taskKey: "S4-P1-ST2-T1-SU1", description: "Increase cohort percentage by phase plan"},
  {taskKey: "S4-P1-ST2-T1-SU2", description: "Monitor impact windows after each increase"},
  {taskKey: "S4-P1-ST2-T2-SU1", description: "Validate P0 funnel stability window"},
  {taskKey: "S4-P1-ST2-T2-SU2", description: "Validate incident rate remains within threshold"},
  {taskKey: "S4-P1-ST2-T3-SU1", description: "Complete final release review meeting"},
  {taskKey: "S4-P1-ST2-T3-SU2", description: "Document decision and post-release checks"},
]

export const STAGE3_AGGREGATE_RULES = [
  ["S3-P2-ST1-T1", ["S3-P2-ST1-T1-SU1", "S3-P2-ST1-T1-SU2"]],
  ["S3-P2-ST1-T2", ["S3-P2-ST1-T2-SU1", "S3-P2-ST1-T2-SU2", "S3-P2-ST1-T2-SU3"]],
  ["S3-P2-ST1-T3", ["S3-P2-ST1-T3-SU1", "S3-P2-ST1-T3-SU2"]],
  ["S3-P2-ST1", ["S3-P2-ST1-T1", "S3-P2-ST1-T2", "S3-P2-ST1-T3"]],
  ["S3-P2", ["S3-P2-ST1"]],
]

export const STAGE4_AGGREGATE_RULES = [
  ["S4-P1-ST1-T1", ["S4-P1-ST1-T1-SU1", "S4-P1-ST1-T1-SU2"]],
  ["S4-P1-ST1-T2", ["S4-P1-ST1-T2-SU1", "S4-P1-ST1-T2-SU2"]],
  ["S4-P1-ST1-T3", ["S4-P1-ST1-T3-SU1", "S4-P1-ST1-T3-SU2", "S4-P1-ST1-T3-SU3"]],
  ["S4-P1-ST2-T1", ["S4-P1-ST2-T1-SU1", "S4-P1-ST2-T1-SU2"]],
  ["S4-P1-ST2-T2", ["S4-P1-ST2-T2-SU1", "S4-P1-ST2-T2-SU2"]],
  ["S4-P1-ST2-T3", ["S4-P1-ST2-T3-SU1", "S4-P1-ST2-T3-SU2"]],
  ["S4-P1-ST1", ["S4-P1-ST1-T1", "S4-P1-ST1-T2", "S4-P1-ST1-T3"]],
  ["S4-P1-ST2", ["S4-P1-ST2-T1", "S4-P1-ST2-T2", "S4-P1-ST2-T3"]],
  ["S4-P1", ["S4-P1-ST1", "S4-P1-ST2"]],
  ["S4", ["S4-P1"]],
]

export const parseExecutionEntries = text => {
  const sections = text.split(/^###\s+E-/m).slice(1)

  return sections
    .map(section => {
      const taskMatch = section.match(/^-\s*Task Key:\s*`?([A-Z0-9-]+)`?/m)
      const outcomeMatch = section.match(/^-\s*Outcome:\s*(PASS|FAIL|PARTIAL)/m)
      const tsMatch = section.match(/^-\s*Timestamp \(UTC\):\s*(.+)$/m)

      return {
        taskKey: taskMatch?.[1] || null,
        outcome: outcomeMatch?.[1] || null,
        timestamp: tsMatch?.[1]?.trim() || "unknown",
      }
    })
    .filter(entry => entry.taskKey)
}

export const getTaskEvidenceStatus = (entries, taskKey) => {
  const taskEntries = entries.filter(entry => entry.taskKey === taskKey)
  const passEntry = taskEntries.find(entry => entry.outcome === "PASS")

  if (passEntry) {
    return {ok: true, detail: `PASS @ ${passEntry.timestamp}`}
  }

  const latest = taskEntries[taskEntries.length - 1]

  if (latest) {
    return {ok: false, detail: `${latest.outcome || "UNKNOWN"} @ ${latest.timestamp}`}
  }

  return {ok: false, detail: "NO ENTRY"}
}

export const buildSummaryRows = (taskRows, entries) =>
  taskRows.map(({taskKey, description}) => {
    const taskEntries = entries.filter(entry => entry.taskKey === taskKey)
    const passEntry = taskEntries.find(entry => entry.outcome === "PASS")
    const latest = taskEntries[taskEntries.length - 1] || null

    return {
      taskKey,
      description,
      status: passEntry ? "PASS" : latest?.outcome || "NO_ENTRY",
      complete: Boolean(passEntry),
      latestTimestamp: passEntry?.timestamp || latest?.timestamp || null,
    }
  })

export const buildCompletionMap = (subtaskRows, aggregateRules, entries) => {
  const completionById = new Map(
    subtaskRows.map(({taskKey}) => [
      taskKey,
      entries.some(entry => entry.taskKey === taskKey && entry.outcome === "PASS"),
    ]),
  )

  for (const [id, dependencies] of aggregateRules) {
    completionById.set(
      id,
      dependencies.every(dependency => completionById.get(dependency) === true),
    )
  }

  return completionById
}
