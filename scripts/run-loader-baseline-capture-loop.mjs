import {spawnSync} from "node:child_process"

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

const toBoolean = value => ["1", "true", "yes"].includes(String(value).toLowerCase())

const runStep = (label, command) => {
  process.stdout.write(`LOADER_CAPTURE_LOOP_STEP:${label}:${command}\n`)

  const result = spawnSync(command, {
    shell: true,
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  })

  if (result.status !== 0) {
    throw new Error(`Step failed (${label}) with exit code ${result.status ?? "unknown"}`)
  }
}

const parseIterations = value => {
  const parsed = Number.parseInt(String(value), 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid --iterations value: ${value}`)
  }

  return parsed
}

const iterations = parseIterations(getArgValue("--iterations", "1"))
const withRefresh = toBoolean(getArgValue("--with-refresh", "false"))

process.stdout.write(`LOADER_CAPTURE_LOOP_ITERATIONS:${iterations}\n`)
process.stdout.write(`LOADER_CAPTURE_LOOP_WITH_REFRESH:${withRefresh}\n`)

for (let iteration = 1; iteration <= iterations; iteration++) {
  process.stdout.write(`LOADER_CAPTURE_LOOP_ITERATION_START:${iteration}/${iterations}\n`)

  runStep("capture-next", "pnpm benchmark:loader:baseline:capture-next")

  if (withRefresh) {
    runStep("refresh-and-sync", "pnpm benchmark:loader:baseline:refresh-and-sync")
  }

  process.stdout.write(`LOADER_CAPTURE_LOOP_ITERATION_DONE:${iteration}/${iterations}\n`)
}

process.stdout.write("LOADER_CAPTURE_LOOP_COMPLETE:true\n")
