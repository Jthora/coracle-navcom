# Rollout and Risk Controls

Status: Draft
Owner: Release + Security + Engineering
Last Updated: 2026-02-22

## Rollout Strategy

1. Internal-only flag cohort.
2. Navcom alpha cohort.
3. Broader cohort after gate pass.

## Suggested Flags

- `ENABLE_GROUP_MODE_RUNTIME_ENFORCEMENT`
- `ENABLE_GROUP_SECURE_CONTROL_PATH`
- `ENABLE_GROUP_MAX_NAVCOM_PQC`
- `DISABLE_GROUP_STRICT_MODE_DOWNGRADE`

## Key Risks

1. Runtime mode drift from UI labels.
2. Strict modes causing unexpected setup failures.
3. PQC claims made before evidence gate completion.
4. Mode-inconsistent fallback messaging eroding strict-mode trust.
5. Tier-policy enforcement hidden from operators/users in default UX.

## Mitigations

- Mandatory requested/resolved mode telemetry.
- Deterministic blocked reason codes with remediation text.
- Release checklist must pass validation gates before claim changes.
- Mode-aware messaging reviews for capability/state hints before release cutoff.
- Tier-policy confirmation telemetry and override-audit review in staged cohorts.

## Rollback Triggers

- Elevated strict-mode failure rate.
- Severe create/join regression.
- Security review identifies claim mismatch.

## Rollback Actions

- Disable Max mode flag.
- Revert strict enforcement to compatibility-safe mode where required.
- Preserve telemetry collection during rollback for root-cause analysis.
