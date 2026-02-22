import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

const STAGE3 = "stage3"
const STAGE4 = "stage4"
const validOutcomes = new Set(["PASS", "FAIL", "PARTIAL"])

const stageConfig = {
  [STAGE3]: {
    logPath: "docs/groups/upgrade/17-stage3-staging-execution-log.md",
    requiredTaskKeys: new Set([
      "S3-P2-ST1-T1-SU1",
      "S3-P2-ST1-T1-SU2",
      "S3-P2-ST1-T2-SU1",
      "S3-P2-ST1-T2-SU2",
      "S3-P2-ST1-T2-SU3",
      "S3-P2-ST1-T3-SU1",
      "S3-P2-ST1-T3-SU2",
    ]),
    stageToken: "S3",
  },
  [STAGE4]: {
    logPath: "docs/groups/upgrade/18-stage4-controlled-rollout-execution-log.md",
    requiredTaskKeys: new Set([
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
    ]),
    stageToken: "S4",
  },
}

const getArgValue = (name, fallback = null) => {
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

const fail = message => {
  console.error(`❌ ${message}`)
  process.exit(1)
}

const stage = getArgValue("--stage")
const taskKey = getArgValue("--task-key")
const outcome = getArgValue("--outcome")
const action = getArgValue("--action")
const environment = getArgValue("--environment", "staging")
const actor = getArgValue("--actor", "Copilot")
const notes = getArgValue("--notes", "")
const followUp = getArgValue("--follow-up", "")
const timestamp = getArgValue("--timestamp", new Date().toISOString())
const entryIdOverride = getArgValue("--entry-id")
const dryRun = process.argv.includes("--dry-run")

if (!stage || !stageConfig[stage]) {
  fail("Missing or invalid --stage (expected: stage3|stage4)")
}

if (!taskKey) {
  fail("Missing required --task-key")
}

if (!outcome || !validOutcomes.has(outcome)) {
  fail("Missing or invalid --outcome (expected: PASS|FAIL|PARTIAL)")
}

if (!action) {
  fail("Missing required --action")
}

const {logPath: relativeLogPath, requiredTaskKeys, stageToken} = stageConfig[stage]

if (!requiredTaskKeys.has(taskKey)) {
  fail(`Task key is not allowed for ${stage}: ${taskKey}`)
}

const logPath = resolve(process.cwd(), relativeLogPath)

if (!existsSync(logPath)) {
  fail(`Execution log not found: ${logPath}`)
}

const log = readFileSync(logPath, "utf8")

const normalizedDate = timestamp.slice(0, 10)
const compactTime = timestamp.slice(11, 19).replace(/:/g, "") || "000000"
const generatedEntryId = `E-${normalizedDate}-${stageToken}-${compactTime}`
const entryId = entryIdOverride || generatedEntryId

const entryLines = [
  `### ${entryId}`,
  "",
  `- Timestamp (UTC): ${timestamp}`,
  `- Environment: ${environment}`,
  `- Actor: ${actor}`,
  `- Task Key: ${taskKey}`,
  `- Action: ${action}`,
  `- Outcome: ${outcome}`,
]

if (notes.trim()) {
  entryLines.push(`- Notes: ${notes.trim()}`)
}

if (outcome !== "PASS") {
  entryLines.push(`- Follow-up: ${followUp.trim() || "TBD"}`)
}

entryLines.push("")

const entryBlock = `${entryLines.join("\n")}`

const completionPolicyAnchor = /^##\s+Completion Policy/m
let next = log

if (completionPolicyAnchor.test(log)) {
  next = log.replace(completionPolicyAnchor, `${entryBlock}$&`)
} else {
  next = `${log.trimEnd()}\n\n${entryBlock}`
}

const result = {
  stage,
  logPath,
  taskKey,
  outcome,
  entryId,
  timestamp,
  dryRun,
  wroteFile: !dryRun,
}

if (!dryRun) {
  writeFileSync(logPath, next, "utf8")
}

process.stdout.write(
  `${JSON.stringify(
    {
      ...result,
      preview: entryBlock,
    },
    null,
    2,
  )}\n`,
)
