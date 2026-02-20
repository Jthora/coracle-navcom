import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs"
import {dirname, resolve} from "node:path"

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

const hasFlag = name => process.argv.includes(name)

const outputPath = resolve(
  process.cwd(),
  getArgValue("--output", "docs/security/pqc/cache/rollout-telemetry.json"),
)

const force = hasFlag("--force")

const template = {
  generatedAt: new Date().toISOString(),
  window: {
    start: "2026-02-19T00:00:00.000Z",
    end: "2026-02-20T00:00:00.000Z",
    label: "daily-dogfood-window",
  },
  metrics: {
    secureSendSuccessRate: null,
    downgradeRate: null,
    decryptFailureRate: null,
    relayRejectRate: null,
    groupRekeyP95Ms: null,
  },
  errorClasses: [
    {
      id: "downgrade-no-shared-alg",
      label: "Downgrade: no shared algorithm",
      count: null,
      rate: null,
      owner: "Messaging Foundations",
      severity: "medium",
      notes: "Populate when this class appears in top dogfood errors.",
    },
    {
      id: "decrypt-failed-invalid-wrap",
      label: "Decrypt failed: invalid recipient wrap",
      count: null,
      rate: null,
      owner: "Crypto Runtime",
      severity: "high",
      notes: "Populate when parser/decrypt failures spike.",
    },
  ],
  notes: [
    "Populate metrics from telemetry dashboard exports before Stage 5.2 rollout decisions.",
    "Rates should be decimal fractions (e.g., 0.983 for 98.3%).",
    "Add telemetry-derived error class counts/rates and owners under errorClasses for daily triage.",
  ],
}

if (existsSync(outputPath) && !force) {
  const existing = JSON.parse(readFileSync(outputPath, "utf8"))
  process.stdout.write(
    `${JSON.stringify({outputPath, created: false, force, keys: Object.keys(existing || {})}, null, 2)}\n`,
  )
  process.exit(0)
}

mkdirSync(dirname(outputPath), {recursive: true})
writeFileSync(outputPath, `${JSON.stringify(template, null, 2)}\n`, "utf8")

process.stdout.write(`${JSON.stringify({outputPath, created: true, force}, null, 2)}\n`)
