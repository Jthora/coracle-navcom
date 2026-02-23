# P6 Branch Required Status Check Mapping

Date: 2026-02-23

## Scope

This mapping defines the required CI status checks for P6 suites on `master` and `dev` pull requests.

## Required Check Names

These names map directly to workflow step names in `.github/workflows/build.yml` (Node `22.x` lane):

- `Groups mode matrix unit gate`
- `Groups flaky budget gate`
- `Groups UI matrix and strict-negative gate`
- `Groups max smoke gate`
- `Groups secure smoke gate`
- `Groups fallback smoke gate`

## Branch Protection Mapping

Configure branch protection rules for `master` and `dev`:

1. Require status checks to pass before merging.
2. Mark the six checks above as required.
3. Require branches to be up to date before merging.
4. Keep admin bypass disabled unless emergency change-control is active.

## CLI Apply Path (Preferred)

Use the repository helper script to apply protection with exact required contexts:

- Dry run (prints payload only):
	- `pnpm groups:ops:branch-protection -- --repo=<owner/repo> --branches=master,dev --dry-run`
- Apply (calls GitHub API via `gh`):
	- `pnpm groups:ops:branch-protection -- --repo=<owner/repo> --branches=master,dev --apply`

Prerequisites:

- `gh` CLI installed and authenticated with admin permission on the repository.
- Branches already exist (`master`, `dev`).
- Workflow checks have run at least once so contexts are visible in GitHub UI.

## Ownership

- Security + QA co-own check-list accuracy.
- Release owner verifies required-check configuration at each release cut.
