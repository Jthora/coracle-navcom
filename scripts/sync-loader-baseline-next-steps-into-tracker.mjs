import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"
import {extractOutstandingStage2Tasks} from "./loader-stage2-priorities.mjs"

const NEXT_STEPS_START_MARKER = "<!-- LOADER_NEXT_STEPS_START -->"
const NEXT_STEPS_END_MARKER = "<!-- LOADER_NEXT_STEPS_END -->"

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

const toBoolean = value => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value !== "string") {
    return false
  }

  const normalized = value.trim().toLowerCase()

  return ["1", "true", "yes", "on"].includes(normalized)
}

const loadJsonIfExists = path => {
  if (!existsSync(path)) {
    return null
  }

  return JSON.parse(readFileSync(path, "utf8"))
}

const toLabel = value => {
  if (value === "feed") return "feed"
  if (value === "intel map") return "intel map"
  if (value === "notifications") return "notifications"
  if (value === "groups") return "groups"
  if (value === "bootstrap") return "bootstrap"

  return typeof value === "string" && value.length > 0 ? value : "target surface"
}

const captureStatusPath = resolve(
  process.cwd(),
  getArgValue(
    "--capture-status",
    "docs/loader/performance-plan/cache/baseline-capture-status.json",
  ),
)
const completenessPath = resolve(
  process.cwd(),
  getArgValue("--completeness", "docs/loader/performance-plan/cache/baseline-completeness.json"),
)
const usefulnessPath = resolve(
  process.cwd(),
  getArgValue(
    "--usefulness",
    "docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json",
  ),
)
const postCaptureChecklistPath = resolve(
  process.cwd(),
  getArgValue(
    "--post-capture-checklist",
    "docs/loader/performance-plan/cache/baseline-post-capture-checklist.json",
  ),
)
const issueReviewPath = resolve(
  process.cwd(),
  getArgValue("--issue-review", "docs/loader/performance-plan/cache/baseline-issue-review.json"),
)
const ownerMapPath = resolve(
  process.cwd(),
  getArgValue("--owner-map", "docs/loader/performance-plan/blocker-ownership.json"),
)
const unblockChecklistPath = resolve(
  process.cwd(),
  getArgValue(
    "--unblock-checklist",
    "docs/loader/performance-plan/cache/baseline-unblock-checklist.json",
  ),
)
const trackerPath = resolve(
  process.cwd(),
  getArgValue("--tracker", "docs/loader/performance-plan/progress-tracker.md"),
)
const annotateStage3 = toBoolean(getArgValue("--annotate-stage3", "false"))
const includeModeLine = toBoolean(getArgValue("--include-mode-line", "false"))
const includeProgressBadge = toBoolean(getArgValue("--include-progress-badge", "false"))
const includeOutstandingPriorities = toBoolean(
  getArgValue("--include-outstanding-priorities", "false"),
)

const captureStatus = loadJsonIfExists(captureStatusPath)
const completeness = loadJsonIfExists(completenessPath)
const usefulness = loadJsonIfExists(usefulnessPath)
const postCaptureChecklist = loadJsonIfExists(postCaptureChecklistPath)
const issueReview = loadJsonIfExists(issueReviewPath)
const ownerMap = loadJsonIfExists(ownerMapPath) || {
  default: {owner: "TBD", eta: "TBD"},
  blockers: {},
}
const unblockChecklist = loadJsonIfExists(unblockChecklistPath)

const blockers = Array.isArray(issueReview?.blockers) ? issueReview.blockers : []
const blockerTypes = blockers.map(blocker => blocker.type)

const nextTarget = captureStatus?.nextTarget || null
const targetRunCount = typeof nextTarget?.runCount === "number" ? nextTarget.runCount : null
const targetRequiredRuns =
  typeof nextTarget?.requiredRuns === "number" ? nextTarget.requiredRuns : null
const totalCapturedRuns =
  typeof captureStatus?.totalCapturedRuns === "number" ? captureStatus.totalCapturedRuns : null
const totalRequiredRuns =
  typeof captureStatus?.totalRequiredRuns === "number" ? captureStatus.totalRequiredRuns : null
const completenessIssues = Array.isArray(completeness?.issues) ? completeness.issues.length : null
const usefulnessChecks = Array.isArray(usefulness?.checks) ? usefulness.checks.length : null
const usefulnessPassedChecks = Array.isArray(usefulness?.checks)
  ? usefulness.checks.filter(check => check.pass).length
  : null
const checklistChecks = Array.isArray(postCaptureChecklist?.checks)
  ? postCaptureChecklist.checks
  : []
const failedChecklistChecks = checklistChecks.filter(check => check?.pass === false)
const hasFailedChecklistCheck = id => failedChecklistChecks.some(check => check?.id === id)
const unblockActions = Array.isArray(unblockChecklist?.actions) ? unblockChecklist.actions : []

const defaultOwner = ownerMap?.default?.owner || "TBD"
const defaultEta = ownerMap?.default?.eta || "TBD"

const checklistToBlockerType = {
  "capture-target": "completeness",
  "completeness-gate": "completeness",
  "usefulness-gate": "telemetry-usefulness",
  "issue-review": "issue-review",
}

const toOwnerMeta = blockerType => {
  const entry = ownerMap?.blockers?.[blockerType] || {}

  return {
    owner: entry.owner || defaultOwner,
    eta: entry.eta || defaultEta,
  }
}

const withOwnerMeta = (text, owner, eta) => {
  if (typeof text !== "string" || text.trim().length === 0) {
    return text
  }

  if (!owner || !eta || text.includes("(Owner:")) {
    return text
  }

  return `${text} (Owner: ${owner}; ETA: ${eta})`
}

const normalizeStepText = step => {
  if (typeof step !== "string") {
    return ""
  }

  return step.replace(/\s+\(Owner:[^)]+\)$/, "").trim()
}

const hasStepText = (steps, candidate) => {
  const normalizedCandidate = normalizeStepText(candidate)

  return steps.some(step => normalizeStepText(step) === normalizedCandidate)
}

const isCaptureNextLoopAction = actionText =>
  /^Use `pnpm benchmark:loader:baseline:capture-next` and continue capture loops\.?$/i.test(
    actionText.trim(),
  )

const unblockPriority = {
  completeness: 1,
  "post-capture-checklist": 2,
  "telemetry-usefulness": 3,
  "telemetry-validation": 4,
  diagnosability: 5,
  "observability-remediation": 6,
  "issue-review": 7,
}

const prioritizedUnblockActions = [...unblockActions].sort((left, right) => {
  const leftPriority = unblockPriority[left?.blockerType] ?? Number.MAX_SAFE_INTEGER
  const rightPriority = unblockPriority[right?.blockerType] ?? Number.MAX_SAFE_INTEGER

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority
  }

  return String(left?.id || "").localeCompare(String(right?.id || ""))
})

const checklistPriority = ["usefulness-gate", "issue-review", "completeness-gate", "capture-target"]

const prioritizedFailedChecklistChecks = [...failedChecklistChecks].sort((left, right) => {
  const leftIndex = checklistPriority.indexOf(left?.id)
  const rightIndex = checklistPriority.indexOf(right?.id)
  const normalizedLeft = leftIndex >= 0 ? leftIndex : checklistPriority.length
  const normalizedRight = rightIndex >= 0 ? rightIndex : checklistPriority.length

  return normalizedLeft - normalizedRight
})

const resolvePrimaryOwnerMeta = () => {
  const topUnblockAction = prioritizedUnblockActions[0]

  if (topUnblockAction) {
    const fallbackMeta = toOwnerMeta(topUnblockAction?.blockerType)

    return {
      owner:
        typeof topUnblockAction?.owner === "string" && topUnblockAction.owner.length > 0
          ? topUnblockAction.owner
          : fallbackMeta.owner,
      eta:
        typeof topUnblockAction?.eta === "string" && topUnblockAction.eta.length > 0
          ? topUnblockAction.eta
          : fallbackMeta.eta,
    }
  }

  const topChecklistCheck = prioritizedFailedChecklistChecks.find(
    check => check?.id !== "issue-review",
  )

  if (topChecklistCheck) {
    const checklistBlockerType =
      checklistToBlockerType[topChecklistCheck.id] || "post-capture-checklist"

    return toOwnerMeta(checklistBlockerType)
  }

  if (!completeness?.pass) {
    return toOwnerMeta("completeness")
  }

  if (blockerTypes.length > 0) {
    return toOwnerMeta(blockerTypes[0])
  }

  return {owner: defaultOwner, eta: defaultEta}
}

const primaryOwnerMeta = resolvePrimaryOwnerMeta()

const dynamicSteps = []
const coveredChecklistIds = new Set()

if (
  hasFailedChecklistCheck("capture-target") ||
  hasFailedChecklistCheck("completeness-gate") ||
  !completeness?.pass
) {
  const completenessOwnerMeta = toOwnerMeta("completeness")
  const targetProgressSuffix =
    targetRunCount !== null && targetRequiredRuns !== null
      ? ` (target progress: ${targetRunCount}/${targetRequiredRuns} ${toLabel(nextTarget?.surface)} runs)`
      : ""
  const overallProgressSuffix =
    totalCapturedRuns !== null && totalRequiredRuns !== null
      ? ` (overall progress: ${totalCapturedRuns}/${totalRequiredRuns} runs)`
      : ""

  if (nextTarget && typeof nextTarget.remainingRuns === "number" && nextTarget.remainingRuns > 0) {
    dynamicSteps.push(
      withOwnerMeta(
        `Capture ${nextTarget.remainingRuns} additional ${toLabel(nextTarget.surface)} baseline run(s) to reduce completeness shortfall first${targetProgressSuffix}${overallProgressSuffix} (check target anytime with \`pnpm benchmark:loader:baseline:capture-next\`).`,
        completenessOwnerMeta.owner,
        completenessOwnerMeta.eta,
      ),
    )
  } else {
    dynamicSteps.push(
      withOwnerMeta(
        "Capture baseline benchmark data across all key surfaces using benchmark API workflow.",
        completenessOwnerMeta.owner,
        completenessOwnerMeta.eta,
      ),
    )
  }

  coveredChecklistIds.add("capture-target")
  coveredChecklistIds.add("completeness-gate")
} else {
  const completenessOwnerMeta = toOwnerMeta("completeness")

  dynamicSteps.push(
    withOwnerMeta(
      "Capture baseline runs for any newly changed loader surfaces to keep evidence current.",
      completenessOwnerMeta.owner,
      completenessOwnerMeta.eta,
    ),
  )
}

dynamicSteps.push(
  withOwnerMeta(
    "Run `pnpm benchmark:loader:baseline:refresh-and-sync` on captured traces.",
    primaryOwnerMeta.owner,
    primaryOwnerMeta.eta,
  ),
)

for (const action of prioritizedUnblockActions) {
  if (dynamicSteps.length >= 4) {
    break
  }

  const actionText = typeof action?.action === "string" ? action.action.trim() : ""

  if (actionText.length === 0) {
    continue
  }

  const alreadyHasRefreshAndSyncStep = dynamicSteps.some(step =>
    step.includes("pnpm benchmark:loader:baseline:refresh-and-sync"),
  )

  if (
    alreadyHasRefreshAndSyncStep &&
    actionText.includes("pnpm benchmark:loader:baseline:refresh-and-sync")
  ) {
    continue
  }

  const alreadyHasCaptureNextStep = dynamicSteps.some(step =>
    step.includes("pnpm benchmark:loader:baseline:capture-next"),
  )

  if (alreadyHasCaptureNextStep && isCaptureNextLoopAction(actionText)) {
    continue
  }

  if (!hasStepText(dynamicSteps, actionText)) {
    const actionOwner =
      typeof action?.owner === "string" && action.owner.length > 0
        ? action.owner
        : toOwnerMeta(action?.blockerType).owner
    const actionEta =
      typeof action?.eta === "string" && action.eta.length > 0
        ? action.eta
        : toOwnerMeta(action?.blockerType).eta

    dynamicSteps.push(withOwnerMeta(actionText, actionOwner, actionEta))
  }
}

for (const check of prioritizedFailedChecklistChecks) {
  if (dynamicSteps.length >= 4) {
    break
  }

  if (!check || coveredChecklistIds.has(check.id)) {
    continue
  }

  if (check.id === "issue-review") {
    continue
  }

  const action = typeof check.action === "string" ? check.action.trim() : ""

  if (action.length === 0) {
    continue
  }

  const alreadyHasRefreshAndSyncStep = dynamicSteps.some(step =>
    step.includes("pnpm benchmark:loader:baseline:refresh-and-sync"),
  )

  if (
    alreadyHasRefreshAndSyncStep &&
    action.includes("pnpm benchmark:loader:baseline:refresh-and-sync")
  ) {
    continue
  }

  if (!hasStepText(dynamicSteps, action)) {
    const checklistBlockerType = checklistToBlockerType[check.id] || "post-capture-checklist"
    const checklistOwnerMeta = toOwnerMeta(checklistBlockerType)

    dynamicSteps.push(withOwnerMeta(action, checklistOwnerMeta.owner, checklistOwnerMeta.eta))
    coveredChecklistIds.add(check.id)
  }
}

if (dynamicSteps.length < 4 && blockers.length > 0) {
  const labels = blockerTypes.length > 0 ? blockerTypes.join(", ") : "active blockers"
  const issueReviewOwnerMeta = toOwnerMeta("issue-review")

  dynamicSteps.push(
    withOwnerMeta(
      `Review blocker outputs (${labels}) and confirm Doc 03 and tracker sections synced from generated artifacts.`,
      issueReviewOwnerMeta.owner,
      issueReviewOwnerMeta.eta,
    ),
  )
} else if (dynamicSteps.length < 4) {
  dynamicSteps.push(
    withOwnerMeta(
      "Review generated artifacts and confirm Doc 03 and tracker sections are synced.",
      primaryOwnerMeta.owner,
      primaryOwnerMeta.eta,
    ),
  )
}

if (
  dynamicSteps.length < 4 &&
  usefulness &&
  usefulness.pass === false &&
  usefulnessChecks !== null &&
  usefulnessPassedChecks !== null
) {
  const usefulnessOwnerMeta = toOwnerMeta("telemetry-usefulness")

  dynamicSteps.push(
    withOwnerMeta(
      `Resolve telemetry usefulness gaps by addressing failed checklist items (${usefulnessPassedChecks}/${usefulnessChecks} currently passing).`,
      usefulnessOwnerMeta.owner,
      usefulnessOwnerMeta.eta,
    ),
  )
} else if (dynamicSteps.length < 4) {
  dynamicSteps.push(
    withOwnerMeta(
      "Complete Stage 0 kickoff artifacts and ownership sign-off.",
      defaultOwner,
      defaultEta,
    ),
  )
}

const nextSteps = dynamicSteps.slice(0, 4)

const numberedLines = nextSteps.map((line, index) => `${index + 1}. ${line}`)
const modeLine = includeModeLine
  ? `> Mode: Stage 3 owner-tagging is ${annotateStage3 ? "enabled" : "disabled"}.`
  : null
const targetProgressBadge =
  nextTarget && targetRunCount !== null && targetRequiredRuns !== null
    ? `${toLabel(nextTarget.surface)} ${targetRunCount}/${targetRequiredRuns}`
    : "n/a"
const overallProgressBadge =
  totalCapturedRuns !== null && totalRequiredRuns !== null
    ? `${totalCapturedRuns}/${totalRequiredRuns}`
    : "n/a"
const progressBadgeLine = includeProgressBadge
  ? `> Capture Progress: Target ${targetProgressBadge} runs • Overall ${overallProgressBadge} runs.`
  : null

const tracker = readFileSync(trackerPath, "utf8")
const outstandingTasks = extractOutstandingStage2Tasks(tracker).slice(0, 3)
const outstandingTaskLabels = outstandingTasks.map(task =>
  task.title.length > 0 ? `${task.id} ${task.title}` : task.id,
)
const outstandingPrioritiesLine = includeOutstandingPriorities
  ? `> Outstanding Priorities: ${outstandingTaskLabels.length > 0 ? outstandingTaskLabels.join("; ") : "none"}.`
  : null
const markerRegex = new RegExp(`${NEXT_STEPS_START_MARKER}[\\s\\S]*?${NEXT_STEPS_END_MARKER}`, "m")

if (!markerRegex.test(tracker)) {
  throw new Error(
    `Immediate next-steps marker section not found in tracker: expected ${NEXT_STEPS_START_MARKER} ... ${NEXT_STEPS_END_MARKER}`,
  )
}

const headerLines = [modeLine, progressBadgeLine, outstandingPrioritiesLine].filter(Boolean)
const sectionLines = [...headerLines, ...numberedLines]
const replacement = `${NEXT_STEPS_START_MARKER}\n${sectionLines.join("\n")}\n${NEXT_STEPS_END_MARKER}`
const nextTracker = tracker.replace(markerRegex, replacement)

writeFileSync(trackerPath, nextTracker, "utf8")

process.stdout.write(`LOADER_BASELINE_NEXT_STEPS_SYNCED:${trackerPath}\n`)
process.stdout.write(`LOADER_BASELINE_NEXT_STEPS_SOURCE_CAPTURE_STATUS:${captureStatusPath}\n`)
process.stdout.write(
  `LOADER_BASELINE_NEXT_STEPS_SOURCE_POST_CAPTURE_CHECKLIST:${postCaptureChecklistPath}\n`,
)
process.stdout.write(`LOADER_BASELINE_NEXT_STEPS_SOURCE_ISSUE_REVIEW:${issueReviewPath}\n`)
process.stdout.write(`LOADER_BASELINE_NEXT_STEPS_SOURCE_OWNER_MAP:${ownerMapPath}\n`)
process.stdout.write(
  `LOADER_BASELINE_NEXT_STEPS_SOURCE_UNBLOCK_CHECKLIST:${unblockChecklistPath}\n`,
)
process.stdout.write(`LOADER_BASELINE_NEXT_STEPS_ANNOTATE_STAGE3:${annotateStage3}\n`)
process.stdout.write(`LOADER_BASELINE_NEXT_STEPS_INCLUDE_MODE_LINE:${includeModeLine}\n`)
process.stdout.write(`LOADER_BASELINE_NEXT_STEPS_INCLUDE_PROGRESS_BADGE:${includeProgressBadge}\n`)
process.stdout.write(
  `LOADER_BASELINE_NEXT_STEPS_INCLUDE_OUTSTANDING_PRIORITIES:${includeOutstandingPriorities}\n`,
)
process.stdout.write(
  `LOADER_BASELINE_NEXT_STEPS_OUTSTANDING_PRIORITIES_COUNT:${outstandingTasks.length}\n`,
)
process.stdout.write(`LOADER_BASELINE_NEXT_STEPS_COUNT:${nextSteps.length}\n`)
