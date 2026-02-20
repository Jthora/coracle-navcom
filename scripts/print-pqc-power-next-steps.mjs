import {existsSync, readFileSync} from "node:fs"
import {resolve} from "node:path"
import {isPlaceholderBatteryDump} from "./lib/pqc-imported-dump-validation.mjs"

const getArgValue = (name, fallback = "") => {
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
const importDir = resolve(
  process.cwd(),
  getArgValue("--import-dir", "docs/security/pqc/cache/imported-dumps"),
)

const files = [
  "android-low-end-pre.txt",
  "android-low-end-post.txt",
  "android-mid-pre.txt",
  "android-mid-post.txt",
]

const checkImportedTemplateState = () => {
  const states = files.map(name => {
    const path = resolve(importDir, name)
    if (!existsSync(path)) {
      return {name, exists: false, placeholder: null}
    }

    const content = readFileSync(path, "utf8")
    const placeholder = isPlaceholderBatteryDump(content)

    return {name, exists: true, placeholder}
  })

  return {
    states,
    missing: states.filter(entry => !entry.exists).map(entry => entry.name),
    placeholder: states.filter(entry => entry.exists && entry.placeholder).map(entry => entry.name),
  }
}

const guidance = []
const importedState = checkImportedTemplateState()

if (!existsSync(summaryPath)) {
  guidance.push("Summary artifact missing. Run: pnpm benchmark:pqc:power:refresh-all")
} else {
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"))
  const requiredComplete = Boolean(summary.requiredComplete)
  const hasImportTemplateIssues =
    importedState.missing.length > 0 || importedState.placeholder.length > 0

  if (requiredComplete && !hasImportTemplateIssues) {
    guidance.push(
      "Required Android evidence is complete. Run: pnpm benchmark:pqc:power:refresh-all",
    )
    guidance.push("Then verify tracker checkboxes under Stage 4.2.2.1 are checked.")
  } else {
    if (requiredComplete && hasImportTemplateIssues) {
      guidance.push(
        "Summary reports completion, but imported dump templates still look unfilled. Refresh evidence after replacing placeholders.",
      )
    } else {
      guidance.push("Required Android evidence is incomplete.")
    }

    if (Array.isArray(summary.requiredMissing) && summary.requiredMissing.length > 0) {
      const missingLabels = summary.requiredMissing.map(entry => {
        if (!entry || typeof entry !== "object") {
          return String(entry)
        }

        const profile = entry.profile || "unknown-profile"
        const reason = entry.reason || "unknown-reason"

        return `${profile} (${reason})`
      })

      guidance.push(`Missing required summaries: ${missingLabels.join(", ")}`)
    }

    if (importedState.missing.length > 0) {
      guidance.push(
        "Imported dump templates missing. Run: pnpm benchmark:pqc:power:prepare-import-dir",
      )
    }

    if (importedState.placeholder.length > 0) {
      guidance.push(`Replace placeholder dump files: ${importedState.placeholder.join(", ")}`)
    }

    guidance.push("If dumps are available, run: pnpm benchmark:pqc:power:closure:imported:safe")
    guidance.push("If adb is available locally, run: pnpm benchmark:pqc:power:closure")
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  summaryPath,
  importDir,
  importState: importedState,
  guidance,
}

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
