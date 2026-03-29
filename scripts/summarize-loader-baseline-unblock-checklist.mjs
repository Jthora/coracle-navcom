import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"
import {
  buildUsefulnessGranularityAction,
  buildUsefulnessGranularityDetail,
} from "./loader-usefulness-granularity-step.mjs"

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

const loadJsonIfExists = path => {
  if (!existsSync(path)) {
    return null
  }

  return JSON.parse(readFileSync(path, "utf8"))
}

const parsedMaxItems = Number.parseInt(getArgValue("--max-items", "5"), 10)
const maxItems = Number.isFinite(parsedMaxItems) && parsedMaxItems > 0 ? parsedMaxItems : 5
const parsedMaxPerBlocker = Number.parseInt(getArgValue("--max-per-blocker", "1"), 10)
const maxPerBlocker =
  Number.isFinite(parsedMaxPerBlocker) && parsedMaxPerBlocker > 0 ? parsedMaxPerBlocker : 2

const issueReviewPath = resolve(
  process.cwd(),
  getArgValue("--issue-review", "docs/loader/performance-plan/cache/baseline-issue-review.json"),
)
const postCaptureChecklistPath = resolve(
  process.cwd(),
  getArgValue(
    "--post-capture-checklist",
    "docs/loader/performance-plan/cache/baseline-post-capture-checklist.json",
  ),
)
const closurePath = resolve(
  process.cwd(),
  getArgValue("--closure", "docs/loader/performance-plan/cache/baseline-stage2-closure.json"),
)
const usefulnessPath = resolve(
  process.cwd(),
  getArgValue(
    "--usefulness",
    "docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json",
  ),
)
const ownerMapPath = resolve(
  process.cwd(),
  getArgValue("--owner-map", "docs/loader/performance-plan/blocker-ownership.json"),
)
const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/loader/performance-plan/cache/baseline-unblock-checklist.json"),
)
const markdownPath = resolve(
  process.cwd(),
  getArgValue("--markdown", "docs/loader/performance-plan/cache/baseline-unblock-checklist.md"),
)

const issueReview = loadJsonIfExists(issueReviewPath)
const postCaptureChecklist = loadJsonIfExists(postCaptureChecklistPath)
const closure = loadJsonIfExists(closurePath)
const usefulness = loadJsonIfExists(usefulnessPath)
const ownerMap = loadJsonIfExists(ownerMapPath) || {
  default: {owner: "TBD", eta: "TBD"},
  blockers: {},
}

const defaultOwner = ownerMap?.default?.owner || "TBD"
const defaultEta = ownerMap?.default?.eta || "TBD"

const blockerTypeByChecklistId = {
  "capture-target": "completeness",
  "completeness-gate": "completeness",
  "usefulness-gate": "telemetry-usefulness",
  "issue-review": "issue-review",
}

const priorityByBlockerType = {
  completeness: 1,
  "post-capture-checklist": 2,
  "telemetry-usefulness": 3,
  "telemetry-validation": 4,
  diagnosability: 5,
  "observability-remediation": 6,
  "issue-review": 7,
}

const toOwnerMeta = blockerType => {
  const entry = ownerMap?.blockers?.[blockerType] || {}

  return {
    owner: entry.owner || defaultOwner,
    eta: entry.eta || defaultEta,
  }
}

const actions = []
const dedupeKeys = new Set()
const usefulnessDetail = buildUsefulnessGranularityDetail(usefulness)
const usefulnessAction = buildUsefulnessGranularityAction(usefulness)

const pushAction = entry => {
  const blockerType = entry.blockerType || "unknown"
  const dedupeKey = `${blockerType}:${entry.id}:${entry.action}`

  if (dedupeKeys.has(dedupeKey)) {
    return
  }

  dedupeKeys.add(dedupeKey)

  actions.push({
    ...entry,
    priority: priorityByBlockerType[blockerType] || Number.MAX_SAFE_INTEGER,
    ...toOwnerMeta(blockerType),
  })
}

const closureFailedDetails = Array.isArray(closure?.failedGateDetails)
  ? closure.failedGateDetails
  : []

for (const detail of closureFailedDetails) {
  const isUsefulnessDetail = detail?.id === "telemetry-usefulness"

  pushAction({
    source: "closure",
    id: detail.id,
    blockerType: detail.id,
    title: detail.label || detail.id,
    detail: isUsefulnessDetail ? usefulnessDetail : detail.summary || "Gate failed.",
    action: isUsefulnessDetail ? usefulnessAction : detail.action || "Review and resolve blocker.",
  })
}

const checklistChecks = Array.isArray(postCaptureChecklist?.checks)
  ? postCaptureChecklist.checks
  : []

for (const check of checklistChecks) {
  if (check?.pass !== false) {
    continue
  }

  const blockerType = blockerTypeByChecklistId[check.id] || "post-capture-checklist"
  const isUsefulnessCheck = check.id === "usefulness-gate"

  pushAction({
    source: "post-capture-checklist",
    id: check.id,
    blockerType,
    title: check.title || check.id,
    detail: isUsefulnessCheck
      ? usefulnessDetail
      : check.detail || "Checklist item requires action.",
    action: isUsefulnessCheck
      ? usefulnessAction
      : check.action || "Review checklist guidance and resolve.",
  })
}

const blockers = Array.isArray(issueReview?.blockers) ? issueReview.blockers : []

for (const blocker of blockers) {
  const isUsefulnessBlocker = blocker?.type === "telemetry-usefulness"

  pushAction({
    source: "issue-review",
    id: blocker.type,
    blockerType: blocker.type,
    title: blocker.type,
    detail: isUsefulnessBlocker
      ? usefulnessDetail
      : blocker.message || "Issue-review blocker detected.",
    action: isUsefulnessBlocker
      ? usefulnessAction
      : "Resolve upstream blocker and rerun refresh-and-sync.",
  })
}

const sortedActions = actions.sort((left, right) => {
  if (left.priority !== right.priority) {
    return left.priority - right.priority
  }

  return String(left.id).localeCompare(String(right.id))
})

const blockerTypeCounts = new Map()
const prioritizedActions = []

for (const action of sortedActions) {
  const blockerType = action.blockerType || "unknown"
  const currentCount = blockerTypeCounts.get(blockerType) || 0

  if (currentCount >= maxPerBlocker) {
    continue
  }

  prioritizedActions.push(action)
  blockerTypeCounts.set(blockerType, currentCount + 1)

  if (prioritizedActions.length >= maxItems) {
    break
  }
}

const result = {
  generatedAt: new Date().toISOString(),
  pass: prioritizedActions.length === 0,
  source: {
    issueReview: issueReviewPath,
    postCaptureChecklist: postCaptureChecklistPath,
    closure: closurePath,
    usefulness: usefulnessPath,
    ownerMap: ownerMapPath,
  },
  maxItems,
  maxPerBlocker,
  totalActions: actions.length,
  actions: prioritizedActions.map(({priority, ...entry}) => entry),
}

const lines = [
  "# Loader Baseline Unblock Checklist",
  "",
  `Generated: ${result.generatedAt}`,
  `Overall status: ${result.pass ? "Pass" : "Action required"}`,
  `Actions shown: ${result.actions.length}/${result.totalActions}`,
  "",
  "## Prioritized Actions",
  "",
]

if (result.actions.length === 0) {
  lines.push("- No active unblock actions detected.")
} else {
  for (const entry of result.actions) {
    lines.push(`- [${entry.blockerType}] ${entry.title}: ${entry.detail}`)
    lines.push(`  - Action: ${entry.action}`)
    lines.push(`  - Owner: ${entry.owner}`)
    lines.push(`  - ETA: ${entry.eta}`)
    lines.push(`  - Source: ${entry.source}`)
  }
}

mkdirSync(dirname(outputPath), {recursive: true})
mkdirSync(dirname(markdownPath), {recursive: true})

writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8")

process.stdout.write(`LOADER_BASELINE_UNBLOCK_CHECKLIST_SAVED:${outputPath}\n`)
process.stdout.write(`LOADER_BASELINE_UNBLOCK_CHECKLIST_MARKDOWN_SAVED:${markdownPath}\n`)
process.stdout.write(`LOADER_BASELINE_UNBLOCK_CHECKLIST_PASS:${result.pass}\n`)
process.stdout.write(`LOADER_BASELINE_UNBLOCK_CHECKLIST_COUNT:${result.actions.length}\n`)
