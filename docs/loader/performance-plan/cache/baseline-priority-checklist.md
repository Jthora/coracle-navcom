# Loader Baseline Priority Checklist

Generated: 2026-02-25T04:46:52.565Z
Tracker: /home/jono/workspace/coracle-navcom/coracle-navcom/docs/loader/performance-plan/progress-tracker.md
Items: 1

2.2.2.1 — Verify cache metrics/traces can distinguish network vs reduction vs render delay
- Action: Validate diagnostic discriminators from current traces and confirm usefulness outputs.
- Commands:
  - `pnpm benchmark:loader:baseline:validate-telemetry`
  - `pnpm benchmark:loader:baseline:diagnose`
  - `pnpm benchmark:loader:baseline:assess-usefulness`
- Evidence:
  - docs/loader/performance-plan/cache/baseline-telemetry-validation.json
  - docs/loader/performance-plan/cache/baseline-diagnosability.json
  - docs/loader/performance-plan/cache/baseline-telemetry-usefulness.json

