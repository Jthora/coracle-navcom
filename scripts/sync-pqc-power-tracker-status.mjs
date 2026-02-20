import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"

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

const summaryPath = resolve(
  process.cwd(),
  getArgValue("--summary", "docs/security/pqc/cache/power-evidence-summary.json"),
)
const trackerPath = resolve(
  process.cwd(),
  getArgValue("--tracker", "docs/security/pqc/progress-tracker.md"),
)

if (!existsSync(summaryPath)) {
  throw new Error(`Summary file not found: ${summaryPath}`)
}

if (!existsSync(trackerPath)) {
  throw new Error(`Tracker file not found: ${trackerPath}`)
}

const summary = JSON.parse(readFileSync(summaryPath, "utf8"))
const rows = Array.isArray(summary.rows) ? summary.rows : []

const profileState = new Map(rows.map(row => [row.profile, Boolean(row.complete)]))
const inferredAndroidComplete =
  profileState.get("android-low-end") === true && profileState.get("android-mid") === true
const androidComplete =
  typeof summary.requiredComplete === "boolean" ? summary.requiredComplete : inferredAndroidComplete

const current = readFileSync(trackerPath, "utf8")

const setMarker = (line, marker) => line.replace(/\[[ x~]\]/, `[${marker}]`)

const next = current
  .split("\n")
  .map(line => {
    if (line.includes("4.2.2.1.3 Subtask: Capture CPU/memory/battery impacts")) {
      return setMarker(line, androidComplete ? "x" : " ")
    }

    if (line.includes("4.2.2.1 Task: Run low-end/mobile performance pass")) {
      return setMarker(line, androidComplete ? "x" : "~")
    }

    if (line.includes("4.2.2 Step: Device and power impact evaluation")) {
      return setMarker(line, androidComplete ? "x" : "~")
    }

    return line
  })
  .join("\n")

writeFileSync(trackerPath, next, "utf8")

process.stdout.write(
  `${JSON.stringify({
    trackerPath,
    summaryPath,
    androidComplete,
    requiredCompleteFromSummary:
      typeof summary.requiredComplete === "boolean" ? summary.requiredComplete : null,
    lowEndComplete: profileState.get("android-low-end") === true,
    midComplete: profileState.get("android-mid") === true,
  })}\n`,
)
