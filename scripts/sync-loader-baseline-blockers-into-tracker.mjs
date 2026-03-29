import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

const BLOCKER_START_MARKER = "<!-- LOADER_BLOCKERS_START -->"
const BLOCKER_END_MARKER = "<!-- LOADER_BLOCKERS_END -->"

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

const issueReviewPath = resolve(
  process.cwd(),
  getArgValue("--issue-review", "docs/loader/performance-plan/cache/baseline-issue-review.json"),
)
const ownerMapPath = resolve(
  process.cwd(),
  getArgValue("--owner-map", "docs/loader/performance-plan/blocker-ownership.json"),
)
const trackerPath = resolve(
  process.cwd(),
  getArgValue("--tracker", "docs/loader/performance-plan/progress-tracker.md"),
)

const issueReview = existsSync(issueReviewPath)
  ? JSON.parse(readFileSync(issueReviewPath, "utf8"))
  : null
const ownerMap = existsSync(ownerMapPath)
  ? JSON.parse(readFileSync(ownerMapPath, "utf8"))
  : {default: {owner: "TBD", eta: "TBD"}, blockers: {}}

const blockers = Array.isArray(issueReview?.blockers) ? issueReview.blockers : []
const topBlockers = blockers.slice(0, 3)

const defaultOwner = ownerMap?.default?.owner || "TBD"
const defaultEta = ownerMap?.default?.eta || "TBD"

const toOwnerEta = blockerType => {
  const blockerMeta = ownerMap?.blockers?.[blockerType] || {}

  return {
    owner: blockerMeta.owner || defaultOwner,
    eta: blockerMeta.eta || defaultEta,
  }
}

const blockerLines =
  topBlockers.length > 0
    ? topBlockers.map((blocker, index) => {
        const {owner, eta} = toOwnerEta(blocker.type)
        return `- ${index + 1}. [${blocker.type}] ${blocker.message} (Owner: ${owner}; ETA: ${eta})`
      })
    : ["- Pending baseline issue review artifact or active blockers not detected."]

const tracker = readFileSync(trackerPath, "utf8")
const markerRegex = new RegExp(`${BLOCKER_START_MARKER}[\\s\\S]*?${BLOCKER_END_MARKER}`, "m")

if (!markerRegex.test(tracker)) {
  throw new Error(
    `Blocker marker section not found in tracker: expected ${BLOCKER_START_MARKER} ... ${BLOCKER_END_MARKER}`,
  )
}

const replacement = `${BLOCKER_START_MARKER}\n${blockerLines.join("\n")}\n${BLOCKER_END_MARKER}`
const nextTracker = tracker.replace(markerRegex, replacement)

writeFileSync(trackerPath, nextTracker, "utf8")

process.stdout.write(`LOADER_BASELINE_BLOCKERS_SYNCED:${trackerPath}\n`)
process.stdout.write(`LOADER_BASELINE_BLOCKERS_SOURCE:${issueReviewPath}\n`)
process.stdout.write(`LOADER_BASELINE_BLOCKERS_OWNER_MAP_SOURCE:${ownerMapPath}\n`)
process.stdout.write(`LOADER_BASELINE_BLOCKERS_COUNT:${topBlockers.length}\n`)
