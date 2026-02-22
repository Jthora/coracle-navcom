import {existsSync, readFileSync} from "node:fs"
import path from "node:path"

const root = process.cwd()

const requiredFiles = [
  "docs/groups/upgrade/12-rollout-migration-and-risk-controls.md",
  "docs/groups/upgrade/18-stage4-controlled-rollout-execution-log.md",
  "docs/groups/upgrade/progress-tracker.md",
]

const requiredTaskKeys = [
  "S4-P1-ST1-T1-SU1",
  "S4-P1-ST1-T1-SU2",
  "S4-P1-ST1-T2-SU1",
  "S4-P1-ST1-T2-SU2",
  "S4-P1-ST1-T3-SU1",
  "S4-P1-ST1-T3-SU2",
  "S4-P1-ST1-T3-SU3",
  "S4-P1-ST2-T1-SU1",
  "S4-P1-ST2-T1-SU2",
  "S4-P1-ST2-T2-SU1",
  "S4-P1-ST2-T2-SU2",
  "S4-P1-ST2-T3-SU1",
  "S4-P1-ST2-T3-SU2",
]

const trackerEvidenceManagedIds = [
  "S4-P1-ST1-T1",
  "S4-P1-ST1-T2",
  "S4-P1-ST1-T3",
  "S4-P1-ST2-T1",
  "S4-P1-ST2-T2",
  "S4-P1-ST2-T3",
  "S4-P1-ST1",
  "S4-P1-ST2",
  "S4-P1",
  "S4",
]

const requiredRolloutCommandRefs = [
  "groups:stage4:rollout:evidence",
  "groups:stage4:rollout:evidence:strict",
  "groups:stage4:rollout:log-entry",
  "groups:stage4:rollout:sync",
  "groups:stage4:rollout:sync:dry",
  "groups:stage4:rollout:close",
  "groups:stage4:rollout:close:dry",
]

const fail = message => {
  console.error(`❌ ${message}`)
  process.exitCode = 1
}

const ok = message => {
  console.log(`✅ ${message}`)
}

const parseEntries = text => {
  const sections = text.split(/^###\s+E-/m).slice(1)

  return sections
    .map(section => {
      const taskMatch = section.match(/^-\s*Task Key:\s*`?([A-Z0-9-]+)`?/m)
      const outcomeMatch = section.match(/^-\s*Outcome:\s*(PASS|FAIL|PARTIAL)/m)

      return {
        taskKey: taskMatch?.[1] || null,
        outcome: outcomeMatch?.[1] || null,
      }
    })
    .filter(entry => entry.taskKey)
}

const hasPass = (entries, taskKey) =>
  entries.some(entry => entry.taskKey === taskKey && entry.outcome === "PASS")

const allComplete = (ids, stateById) => ids.every(id => stateById.get(id) === true)

const parseTrackerCheckboxes = text => {
  const byId = new Map()

  for (const line of text.split("\n")) {
    const match = line.match(/^\s*-\s*\[([ x])\]\s+([A-Z0-9-]+)\b/)

    if (!match) continue

    byId.set(match[2], match[1] === "x")
  }

  return byId
}

for (const file of requiredFiles) {
  const fullPath = path.join(root, file)

  if (!existsSync(fullPath)) {
    fail(`Missing required file: ${file}`)
  } else {
    ok(`Found required file: ${file}`)
  }
}

const rolloutDocPath = path.join(
  root,
  "docs/groups/upgrade/12-rollout-migration-and-risk-controls.md",
)
const executionLogPath = path.join(
  root,
  "docs/groups/upgrade/18-stage4-controlled-rollout-execution-log.md",
)
const trackerPath = path.join(root, "docs/groups/upgrade/progress-tracker.md")

if (existsSync(rolloutDocPath)) {
  const rolloutDoc = readFileSync(rolloutDocPath, "utf8")

  for (const commandRef of requiredRolloutCommandRefs) {
    if (!rolloutDoc.includes(commandRef)) {
      fail(`Rollout controls doc missing command reference: ${commandRef}`)
    }
  }

  ok("Rollout controls doc contains Stage 4 automation command references")
}

if (existsSync(trackerPath)) {
  const tracker = readFileSync(trackerPath, "utf8")
  const entries = existsSync(executionLogPath)
    ? parseEntries(readFileSync(executionLogPath, "utf8"))
    : []

  const evidenceState = new Map(requiredTaskKeys.map(task => [task, hasPass(entries, task)]))

  evidenceState.set(
    "S4-P1-ST1-T1",
    allComplete(["S4-P1-ST1-T1-SU1", "S4-P1-ST1-T1-SU2"], evidenceState),
  )
  evidenceState.set(
    "S4-P1-ST1-T2",
    allComplete(["S4-P1-ST1-T2-SU1", "S4-P1-ST1-T2-SU2"], evidenceState),
  )
  evidenceState.set(
    "S4-P1-ST1-T3",
    allComplete(["S4-P1-ST1-T3-SU1", "S4-P1-ST1-T3-SU2", "S4-P1-ST1-T3-SU3"], evidenceState),
  )
  evidenceState.set(
    "S4-P1-ST2-T1",
    allComplete(["S4-P1-ST2-T1-SU1", "S4-P1-ST2-T1-SU2"], evidenceState),
  )
  evidenceState.set(
    "S4-P1-ST2-T2",
    allComplete(["S4-P1-ST2-T2-SU1", "S4-P1-ST2-T2-SU2"], evidenceState),
  )
  evidenceState.set(
    "S4-P1-ST2-T3",
    allComplete(["S4-P1-ST2-T3-SU1", "S4-P1-ST2-T3-SU2"], evidenceState),
  )
  evidenceState.set(
    "S4-P1-ST1",
    allComplete(["S4-P1-ST1-T1", "S4-P1-ST1-T2", "S4-P1-ST1-T3"], evidenceState),
  )
  evidenceState.set(
    "S4-P1-ST2",
    allComplete(["S4-P1-ST2-T1", "S4-P1-ST2-T2", "S4-P1-ST2-T3"], evidenceState),
  )
  evidenceState.set("S4-P1", allComplete(["S4-P1-ST1", "S4-P1-ST2"], evidenceState))
  evidenceState.set("S4", allComplete(["S4-P1"], evidenceState))

  const trackerCheckboxes = parseTrackerCheckboxes(tracker)

  for (const id of trackerEvidenceManagedIds) {
    const expected = evidenceState.get(id)
    const actual = trackerCheckboxes.get(id)

    if (typeof actual !== "boolean") {
      fail(`Tracker missing checkbox entry for: ${id}`)
      continue
    }

    if (actual !== expected) {
      const expectedLabel = expected ? "closed ([x])" : "open ([ ])"
      const actualLabel = actual ? "closed ([x])" : "open ([ ])"
      fail(`Tracker evidence mismatch for ${id}: expected ${expectedLabel}, found ${actualLabel}`)
    }
  }

  ok("Tracker Stage 4 rollout states align with evidence")
}

if (!process.exitCode) {
  ok("Groups Stage 4 rollout readiness validation checks passed")
}
