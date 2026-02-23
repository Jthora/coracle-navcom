#!/usr/bin/env node
import {spawnSync} from "node:child_process"

const REQUIRED_CONTEXTS = [
  "Groups mode matrix unit gate",
  "Groups flaky budget gate",
  "Groups UI matrix and strict-negative gate",
  "Groups max smoke gate",
  "Groups secure smoke gate",
  "Groups fallback smoke gate",
]

const args = process.argv.slice(2)

const getArgValue = (flag, fallback = "") => {
  const arg = args.find(value => value.startsWith(`${flag}=`))
  return arg ? arg.slice(flag.length + 1) : fallback
}

const hasFlag = flag => args.includes(flag)

const repo = getArgValue("--repo")
const branchesValue = getArgValue("--branches", "master,dev")
const dryRun = hasFlag("--dry-run") || !hasFlag("--apply")

if (!repo || !repo.includes("/")) {
  console.error("[groups-branch-protection] Missing --repo=<owner/repo>")
  process.exit(1)
}

const branches = branchesValue
  .split(",")
  .map(value => value.trim())
  .filter(Boolean)

if (branches.length === 0) {
  console.error("[groups-branch-protection] No branches provided")
  process.exit(1)
}

const payload = {
  required_status_checks: {
    strict: true,
    contexts: REQUIRED_CONTEXTS,
  },
  enforce_admins: true,
  required_pull_request_reviews: {
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
    required_approving_review_count: 1,
  },
  restrictions: null,
  required_linear_history: false,
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,
  required_conversation_resolution: true,
  lock_branch: false,
  allow_fork_syncing: true,
}

console.log(`[groups-branch-protection] repo=${repo}`)
console.log(`[groups-branch-protection] branches=${branches.join(",")}`)
console.log(`[groups-branch-protection] mode=${dryRun ? "dry-run" : "apply"}`)

for (const branch of branches) {
  const endpoint = `/repos/${repo}/branches/${branch}/protection`

  if (dryRun) {
    console.log(`\n--- DRY RUN: ${endpoint} ---`)
    console.log(JSON.stringify(payload, null, 2))
    continue
  }

  const result = spawnSync("gh", ["api", "--method", "PUT", endpoint, "--input", "-"], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  })

  if (result.status !== 0) {
    console.error(`[groups-branch-protection] Failed for branch ${branch}`)
    if (result.stderr) console.error(result.stderr.trim())
    process.exit(result.status || 1)
  }

  if (result.stdout) {
    console.log(`[groups-branch-protection] Applied for ${branch}`)
  }
}

if (dryRun) {
  console.log("\n[groups-branch-protection] Dry-run complete. Re-run with --apply to execute.")
} else {
  console.log("\n[groups-branch-protection] Branch protection applied successfully.")
}
