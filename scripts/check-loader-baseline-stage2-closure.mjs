import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"

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

const toStatus = value => (value ? "Pass" : "Fail")

const formatCount = (value, singular, plural) => {
  const count = Number.isFinite(value) ? value : 0
  return `${count} ${count === 1 ? singular : plural}`
}

const summarizeGateFailure = ({
  gateId,
  completeness,
  validation,
  diagnosis,
  usefulness,
  remediation,
  issueReview,
  postCaptureChecklist,
}) => {
  if (gateId === "completeness") {
    const issueCount = Array.isArray(completeness?.issues) ? completeness.issues.length : 0
    const runCount = Number.isFinite(completeness?.runCount) ? completeness.runCount : 0
    const requiredPerSurface = Number.isFinite(completeness?.requiredRunsPerSurface)
      ? completeness.requiredRunsPerSurface
      : null
    const surfaceCount = Array.isArray(completeness?.surfaces) ? completeness.surfaces.length : 0
    const requiredTotal =
      requiredPerSurface !== null && surfaceCount > 0 ? requiredPerSurface * surfaceCount : null
    const progress =
      requiredTotal === null ? `${runCount} run(s) captured` : `${runCount}/${requiredTotal} runs`

    return {
      summary: `${formatCount(issueCount, "issue", "issues")} detected (${progress}).`,
      action: "Capture additional baseline runs, then re-run refresh-and-sync.",
    }
  }

  if (gateId === "telemetry-validation") {
    const issueCount = Array.isArray(validation?.issues) ? validation.issues.length : 0

    return {
      summary: `${formatCount(issueCount, "validation issue", "validation issues")} detected.`,
      action: "Review baseline-telemetry-validation.md and fix missing/invalid telemetry phases.",
    }
  }

  if (gateId === "diagnosability") {
    const blindSpotCount = Array.isArray(diagnosis?.blindSpots) ? diagnosis.blindSpots.length : 0

    return {
      summary: `${formatCount(blindSpotCount, "blind spot", "blind spots")} remain.`,
      action:
        "Address diagnosability blind spots and regenerate remediation + issue-review artifacts.",
    }
  }

  if (gateId === "telemetry-usefulness") {
    const checks = Array.isArray(usefulness?.checks) ? usefulness.checks : []
    const passedChecks = checks.filter(check => check?.pass === true).length

    return {
      summary: `Checklist coverage ${passedChecks}/${checks.length}.`,
      action: "Capture missing diagnostic evidence called out in baseline-telemetry-usefulness.md.",
    }
  }

  if (gateId === "observability-remediation") {
    const ticketCount = Array.isArray(remediation?.tickets) ? remediation.tickets.length : 0

    return {
      summary: `${formatCount(ticketCount, "remediation ticket", "remediation tickets")} unresolved.`,
      action: "Resolve remediation tickets and refresh issue-review artifacts.",
    }
  }

  if (gateId === "issue-review") {
    const blockers = Array.isArray(issueReview?.blockers) ? issueReview.blockers : []
    const blockerTypes = blockers.map(blocker => blocker?.type).filter(Boolean)

    return {
      summary:
        blockerTypes.length > 0
          ? `${formatCount(blockers.length, "blocker", "blockers")} active (${blockerTypes.join(", ")}).`
          : `${formatCount(blockers.length, "blocker", "blockers")} active.`,
      action:
        "Resolve active gate failures, then re-run refresh-and-sync to clear issue-review blockers.",
    }
  }

  if (gateId === "post-capture-checklist") {
    const checks = Array.isArray(postCaptureChecklist?.checks) ? postCaptureChecklist.checks : []
    const failedIds = checks.filter(check => check?.pass === false).map(check => check.id)

    return {
      summary:
        failedIds.length > 0
          ? `${formatCount(failedIds.length, "check", "checks")} failing (${failedIds.join(", ")}).`
          : "Checklist contains failing items.",
      action: "Execute failed post-capture checklist actions, then re-run refresh-and-sync.",
    }
  }

  return {
    summary: "Gate failed.",
    action: "Review the gate artifact and resolve blockers.",
  }
}

const completenessPath = resolve(
  process.cwd(),
  getArgValue("--completeness", "docs/loader/performance-plan/cache/baseline-completeness.json"),
)
const validationPath = resolve(
  process.cwd(),
  getArgValue(
    "--validation",
    "docs/loader/performance-plan/cache/baseline-telemetry-validation.json",
  ),
)
const diagnosisPath = resolve(
  process.cwd(),
  getArgValue("--diagnosis", "docs/loader/performance-plan/cache/baseline-diagnosability.json"),
)
const usefulnessPath = resolve(
  process.cwd(),
  getArgValue(
    "--usefulness",
    "docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json",
  ),
)
const remediationPath = resolve(
  process.cwd(),
  getArgValue(
    "--remediation",
    "docs/loader/performance-plan/cache/baseline-observability-remediation.json",
  ),
)
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
const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/loader/performance-plan/cache/baseline-stage2-closure.json"),
)
const markdownPath = resolve(
  process.cwd(),
  getArgValue("--markdown", "docs/loader/performance-plan/cache/baseline-stage2-closure.md"),
)
const strictMode = ["1", "true", "yes"].includes(
  String(getArgValue("--strict", "false")).toLowerCase(),
)

const completeness = loadJsonIfExists(completenessPath)
const validation = loadJsonIfExists(validationPath)
const diagnosis = loadJsonIfExists(diagnosisPath)
const usefulness = loadJsonIfExists(usefulnessPath)
const remediation = loadJsonIfExists(remediationPath)
const issueReview = loadJsonIfExists(issueReviewPath)
const postCaptureChecklist = loadJsonIfExists(postCaptureChecklistPath)

const gates = [
  {
    id: "completeness",
    label: "Baseline completeness",
    pass: completeness ? Boolean(completeness.pass) : null,
    source: completenessPath,
  },
  {
    id: "telemetry-validation",
    label: "Telemetry validation",
    pass: validation ? Boolean(validation.pass) : null,
    source: validationPath,
  },
  {
    id: "diagnosability",
    label: "Diagnosability",
    pass: diagnosis
      ? Array.isArray(diagnosis.blindSpots) && diagnosis.blindSpots.length === 0
      : null,
    source: diagnosisPath,
  },
  {
    id: "telemetry-usefulness",
    label: "Telemetry usefulness",
    pass: usefulness ? Boolean(usefulness.pass) : null,
    source: usefulnessPath,
  },
  {
    id: "observability-remediation",
    label: "Observability remediation",
    pass: remediation ? Boolean(remediation.pass) : null,
    source: remediationPath,
  },
  {
    id: "issue-review",
    label: "Issue review",
    pass: issueReview ? Boolean(issueReview.pass) : null,
    source: issueReviewPath,
  },
  {
    id: "post-capture-checklist",
    label: "Post-capture checklist",
    pass: postCaptureChecklist ? Boolean(postCaptureChecklist.pass) : null,
    source: postCaptureChecklistPath,
  },
].map(gate => {
  if (gate.pass !== false) {
    return gate
  }

  return {
    ...gate,
    failureDetail: summarizeGateFailure({
      gateId: gate.id,
      completeness,
      validation,
      diagnosis,
      usefulness,
      remediation,
      issueReview,
      postCaptureChecklist,
    }),
  }
})

const missingArtifacts = gates
  .filter(gate => gate.pass === null)
  .map(gate => ({id: gate.id, source: gate.source}))

const failedGates = gates.filter(gate => gate.pass === false).map(gate => gate.id)

const result = {
  generatedAt: new Date().toISOString(),
  pass: missingArtifacts.length === 0 && failedGates.length === 0,
  strict: strictMode,
  source: {
    completeness: completenessPath,
    validation: validationPath,
    diagnosis: diagnosisPath,
    usefulness: usefulnessPath,
    remediation: remediationPath,
    issueReview: issueReviewPath,
    postCaptureChecklist: postCaptureChecklistPath,
  },
  gates,
  missingArtifacts,
  failedGates,
  failedGateDetails: gates
    .filter(gate => gate.pass === false)
    .map(gate => ({
      id: gate.id,
      label: gate.label,
      summary: gate.failureDetail?.summary ?? "Gate failed.",
      action: gate.failureDetail?.action ?? "Review and resolve gate artifact blockers.",
    })),
}

const lines = [
  "# Loader Baseline Stage 2 Closure Check",
  "",
  `Generated: ${result.generatedAt}`,
  `Overall status: ${toStatus(result.pass)}`,
  "",
  "## Gates",
  "",
  ...gates.map(gate => {
    if (gate.pass === null) {
      return `- ${gate.label}: Missing artifact`
    }

    return `- ${gate.label}: ${toStatus(gate.pass)}`
  }),
  "",
  "## Missing Artifacts",
  "",
]

if (missingArtifacts.length === 0) {
  lines.push("- None.")
} else {
  for (const artifact of missingArtifacts) {
    lines.push(`- ${artifact.id}: ${artifact.source}`)
  }
}

lines.push("", "## Failed Gates", "")

if (failedGates.length === 0) {
  lines.push("- None.")
} else {
  for (const gate of result.failedGateDetails) {
    lines.push(`- ${gate.id}: ${gate.summary}`)
    lines.push(`  - Action: ${gate.action}`)
  }
}

mkdirSync(dirname(outputPath), {recursive: true})
mkdirSync(dirname(markdownPath), {recursive: true})

writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8")

process.stdout.write(`LOADER_BASELINE_STAGE2_CLOSURE_SAVED:${outputPath}\n`)
process.stdout.write(`LOADER_BASELINE_STAGE2_CLOSURE_MARKDOWN_SAVED:${markdownPath}\n`)
process.stdout.write(`LOADER_BASELINE_STAGE2_CLOSURE_PASS:${result.pass}\n`)
process.stdout.write(`LOADER_BASELINE_STAGE2_CLOSURE_STRICT:${strictMode}\n`)

if (!result.pass && strictMode) {
  process.exitCode = 1
}
