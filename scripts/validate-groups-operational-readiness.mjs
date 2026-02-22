import {existsSync, readFileSync} from "node:fs"
import path from "node:path"

const root = process.cwd()

const requiredFiles = [
  "docs/groups/upgrade/15-stage3-operational-readiness-controls.md",
  "docs/groups/upgrade/16-stage3-rollback-drill-runbook.md",
  "docs/groups/upgrade/17-stage3-staging-execution-log.md",
  "docs/groups/upgrade/progress-tracker.md",
]

const requiredAlertKeys = [
  "groups.create_funnel_drop",
  "groups.join_funnel_latency_spike",
  "groups.guard_redirect_unrecovered",
  "groups.fallback_duration_spike",
  "groups.relay_policy_save_failures",
  "groups.first_message_failures",
]

const requiredTaskKeys = [
  "S3-P2-ST1-T1-SU1",
  "S3-P2-ST1-T1-SU2",
  "S3-P2-ST1-T2-SU1",
  "S3-P2-ST1-T2-SU2",
  "S3-P2-ST1-T2-SU3",
  "S3-P2-ST1-T3-SU1",
  "S3-P2-ST1-T3-SU2",
]

const trackerEvidenceManagedIds = [
  "S3-P2-ST1-T1",
  "S3-P2-ST1-T2",
  "S3-P2-ST1-T3",
  "S3-P2-ST1",
  "S3-P2",
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

const allComplete = (ids, statusById) => ids.every(id => statusById.get(id) === true)

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

const controlsPath = path.join(
  root,
  "docs/groups/upgrade/15-stage3-operational-readiness-controls.md",
)
const executionLogPath = path.join(root, "docs/groups/upgrade/17-stage3-staging-execution-log.md")
const trackerPath = path.join(root, "docs/groups/upgrade/progress-tracker.md")

if (existsSync(controlsPath)) {
  const controls = readFileSync(controlsPath, "utf8")

  for (const key of requiredAlertKeys) {
    if (!controls.includes(key)) {
      fail(`Missing alert key in controls doc: ${key}`)
    }
  }

  if (!controls.includes("Primary Owner") || !controls.includes("Secondary Owner")) {
    fail("Controls doc missing owner-routing columns")
  } else {
    ok("Controls doc contains owner-routing columns")
  }
}

if (existsSync(trackerPath)) {
  const tracker = readFileSync(trackerPath, "utf8")
  const entries = existsSync(executionLogPath)
    ? parseEntries(readFileSync(executionLogPath, "utf8"))
    : []

  const evidenceState = new Map(requiredTaskKeys.map(task => [task, hasPass(entries, task)]))

  evidenceState.set(
    "S3-P2-ST1-T1",
    allComplete(["S3-P2-ST1-T1-SU1", "S3-P2-ST1-T1-SU2"], evidenceState),
  )
  evidenceState.set(
    "S3-P2-ST1-T2",
    allComplete(["S3-P2-ST1-T2-SU1", "S3-P2-ST1-T2-SU2", "S3-P2-ST1-T2-SU3"], evidenceState),
  )
  evidenceState.set(
    "S3-P2-ST1-T3",
    allComplete(["S3-P2-ST1-T3-SU1", "S3-P2-ST1-T3-SU2"], evidenceState),
  )
  evidenceState.set(
    "S3-P2-ST1",
    allComplete(["S3-P2-ST1-T1", "S3-P2-ST1-T2", "S3-P2-ST1-T3"], evidenceState),
  )
  evidenceState.set("S3-P2", allComplete(["S3-P2-ST1"], evidenceState))

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

  ok("Tracker Stage 3 operational-readiness states align with evidence")
}

if (!process.exitCode) {
  ok("Groups operational readiness validation checks passed")
}
