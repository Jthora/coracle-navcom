import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

const CLOSURE_START_MARKER = "<!-- LOADER_CLOSURE_START -->"
const CLOSURE_END_MARKER = "<!-- LOADER_CLOSURE_END -->"

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

const closurePath = resolve(
  process.cwd(),
  getArgValue("--closure", "docs/loader/performance-plan/cache/baseline-stage2-closure.json"),
)
const ownerMapPath = resolve(
  process.cwd(),
  getArgValue("--owner-map", "docs/loader/performance-plan/blocker-ownership.json"),
)
const trackerPath = resolve(
  process.cwd(),
  getArgValue("--tracker", "docs/loader/performance-plan/progress-tracker.md"),
)

const closure = existsSync(closurePath) ? JSON.parse(readFileSync(closurePath, "utf8")) : null
const ownerMap = existsSync(ownerMapPath)
  ? JSON.parse(readFileSync(ownerMapPath, "utf8"))
  : {default: {owner: "TBD", eta: "TBD"}, blockers: {}}

const failedGates = Array.isArray(closure?.failedGates) ? closure.failedGates : []
const missingArtifacts = Array.isArray(closure?.missingArtifacts) ? closure.missingArtifacts : []
const failedGateDetails = Array.isArray(closure?.failedGateDetails) ? closure.failedGateDetails : []
const parsedMaxDetails = Number.parseInt(getArgValue("--max-details", "3"), 10)
const MAX_FAILED_GATE_DETAILS =
  Number.isFinite(parsedMaxDetails) && parsedMaxDetails > 0 ? parsedMaxDetails : 3

const DETAIL_PRIORITY = {
  completeness: 1,
  "post-capture-checklist": 2,
  "telemetry-usefulness": 3,
  "telemetry-validation": 4,
  diagnosability: 5,
  "observability-remediation": 6,
  "issue-review": 7,
}

const hasSpecificFailures = failedGates.some(gateId =>
  ["completeness", "telemetry-usefulness", "post-capture-checklist"].includes(gateId),
)

const defaultOwner = ownerMap?.default?.owner || "TBD"
const defaultEta = ownerMap?.default?.eta || "TBD"

const toOwnerMeta = blockerType => {
  const entry = ownerMap?.blockers?.[blockerType] || {}

  return {
    owner: entry.owner || defaultOwner,
    eta: entry.eta || defaultEta,
  }
}

const prioritizedFailedGateDetails = failedGateDetails
  .filter(detail => {
    if (detail?.id !== "issue-review") {
      return true
    }

    return !hasSpecificFailures
  })
  .sort((left, right) => {
    const leftPriority = DETAIL_PRIORITY[left?.id] ?? Number.MAX_SAFE_INTEGER
    const rightPriority = DETAIL_PRIORITY[right?.id] ?? Number.MAX_SAFE_INTEGER

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return String(left?.id || "").localeCompare(String(right?.id || ""))
  })

const detailLines = prioritizedFailedGateDetails
  .slice(0, MAX_FAILED_GATE_DETAILS)
  .flatMap(detail => {
    const id = detail?.id || "unknown-gate"
    const summary = detail?.summary || "Gate failed."
    const action = detail?.action || "Review gate artifact and resolve blockers."
    const ownerMeta = toOwnerMeta(id)

    return [
      `- Detail (${id}): ${summary}`,
      `- Action (${id}): ${action} (Owner: ${ownerMeta.owner}; ETA: ${ownerMeta.eta})`,
    ]
  })

const closureLines =
  closure === null
    ? ["- Status: Pending (closure artifact missing)."]
    : [
        `- Status: ${closure.pass ? "Pass" : "Fail"}`,
        `- Failed gates: ${failedGates.length}`,
        `- Missing artifacts: ${missingArtifacts.length}`,
        ...(failedGates.length > 0 ? [`- Gate IDs: ${failedGates.join(", ")}`] : []),
        ...detailLines,
        ...(prioritizedFailedGateDetails.length > MAX_FAILED_GATE_DETAILS
          ? [
              `- Additional failed gate details: ${prioritizedFailedGateDetails.length - MAX_FAILED_GATE_DETAILS} more in baseline-stage2-closure.json.`,
            ]
          : []),
      ]

const tracker = readFileSync(trackerPath, "utf8")
const markerRegex = new RegExp(`${CLOSURE_START_MARKER}[\\s\\S]*?${CLOSURE_END_MARKER}`, "m")

if (!markerRegex.test(tracker)) {
  throw new Error(
    `Closure marker section not found in tracker: expected ${CLOSURE_START_MARKER} ... ${CLOSURE_END_MARKER}`,
  )
}

const replacement = `${CLOSURE_START_MARKER}\n${closureLines.join("\n")}\n${CLOSURE_END_MARKER}`
const nextTracker = tracker.replace(markerRegex, replacement)

writeFileSync(trackerPath, nextTracker, "utf8")

process.stdout.write(`LOADER_BASELINE_CLOSURE_SYNCED:${trackerPath}\n`)
process.stdout.write(`LOADER_BASELINE_CLOSURE_SOURCE:${closurePath}\n`)
process.stdout.write(`LOADER_BASELINE_CLOSURE_OWNER_MAP_SOURCE:${ownerMapPath}\n`)
process.stdout.write(`LOADER_BASELINE_CLOSURE_PASS:${closure ? closure.pass : "missing"}\n`)
