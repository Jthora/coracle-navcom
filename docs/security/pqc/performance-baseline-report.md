# Navcom PQC Performance Baseline Report

Status: Draft
Owner: QA + Security Engineering
Last Updated: 2026-02-19
Depends On: 10-implementation-plan.md, 11-test-and-validation-plan.md

## Purpose

This report publishes initial Stage 4B baseline benchmark results for PQC DM encrypt/decrypt paths.
It provides a reproducible command and a first reference point for trend tracking.

## Benchmark Method

- Harness: `benchmarkDmEncryptDecryptLatency` in `src/engine/pqc/dm-latency-benchmark.ts`.
- Runner command:

```bash
pnpm benchmark:pqc:dm
```

- Target test:

```text
tests/unit/engine/pqc/dm-latency-benchmark.spec.ts
```

- Samples per operation in this baseline run: 5 iterations.
- Metrics captured: encrypt/decrypt p50, p95, p99, plus strict-vs-compatibility delta.

## Baseline Results (2026-02-19)

### Encrypt (ms)

- count: 5
- min: 0.0864
- max: 1.0762
- mean: 0.3011
- p50: 0.1029
- p95: 1.0762
- p99: 1.0762

### Decrypt Strict (ms)

- count: 5
- min: 0.1180
- max: 0.8408
- mean: 0.3186
- p50: 0.2364
- p95: 0.8408
- p99: 0.8408

### Decrypt Compatibility (ms)

- count: 5
- min: 0.1029
- max: 0.2820
- mean: 0.1715
- p50: 0.1509
- p95: 0.2820
- p99: 0.2820

### Compatibility Overhead vs Strict (ms)

- p50: -0.0855
- p95: -0.5588
- p99: -0.5588

## Interpretation Notes

- This is an initial local baseline snapshot, not a release gate threshold.
- Small sample counts and runtime jitter can produce negative overhead deltas.
- Stage 4B follow-up should increase iteration count and collect repeated runs across device classes.

## Next Actions

## Group Rekey Benchmark Method

- Harness: `benchmarkGroupRekeyLatency` and `evaluateGroupRekeyLatencyThresholds` in `src/engine/pqc/group-rekey-latency-benchmark.ts`.
- Runner command:

```bash
pnpm benchmark:pqc:group
```

- Target test:

```text
tests/unit/engine/pqc/group-rekey-latency-benchmark.spec.ts
```

- Samples in this baseline run: 50 iterations per scenario.
- Scenarios:
	- Membership add-triggered rekey.
	- Membership remove-triggered rekey.
	- Churn-batched membership events rekey.

## Group Rekey Baseline Results (2026-02-19)

### Add Member Rekey (ms)

- count: 50
- min: 0.0134
- max: 1.2990
- mean: 0.0680
- p50: 0.0235
- p95: 0.1720
- p99: 1.2990

### Remove Member Rekey (ms)

- count: 50
- min: 0.0132
- max: 0.1865
- mean: 0.0239
- p50: 0.0159
- p95: 0.0471
- p99: 0.1865

### Churn-Batched Rekey (ms)

- count: 50
- min: 0.0122
- max: 0.1188
- mean: 0.0250
- p50: 0.0163
- p95: 0.0701
- p99: 0.1188

### Combined Membership Rekey (ms)

- count: 100
- min: 0.0132
- max: 1.2990
- mean: 0.0460
- p50: 0.0175
- p95: 0.1208
- p99: 0.2099

## Acceptable Rekey Latency Thresholds

Defined in `DEFAULT_GROUP_REKEY_LATENCY_THRESHOLDS`:

- Combined membership rekey p95 ≤ 25 ms.
- Combined membership rekey p99 ≤ 50 ms.
- Churn-batched rekey p95 ≤ 75 ms.
- Churn-batched rekey p99 ≤ 120 ms.

This baseline run passes all threshold checks.

## Adaptive Controls Thresholds

Defined in `DEFAULT_ADAPTIVE_FALLBACK_THRESHOLDS` (`src/engine/pqc/adaptive-controls.ts`):

- DM encrypt p95 prompt threshold: 20 ms.
- DM decrypt p95 prompt threshold: 25 ms.
- Group churn rekey p95 prompt threshold: 75 ms.
- Performance degradation streak threshold: 3 consecutive breaches.

Prompt severity behavior:

- Moderate prompt when any threshold is exceeded.
- High-severity prompt when any p95 signal reaches 1.5x threshold.

## Policy-Safe Adaptive Behavior Limits

Defined in `DEFAULT_ADAPTIVE_POLICY_SAFE_LIMITS` (`src/engine/pqc/adaptive-controls.ts`):

- Strict mode automatic fallback: disabled.
- Compatibility mode auto-fallback budget: 3 events per session.
- Adaptive flow requires explicit user confirmation before compatibility fallback.
- Reason-coded adaptive prompts required for all threshold-triggered downgrade suggestions.

## Representative Low-End Test Profiles (4.2.2.1.1)

Selected profile matrix for upcoming sustained tests:

- Android low-end profile: 4 cores, 3-4 GB RAM, battery saver enabled.
- Android mid profile: 6-8 cores, 6 GB RAM, balanced power mode.
- Desktop constrained profile: dual-core VM, 4 GB RAM limit.
- Desktop baseline profile: quad-core, 8 GB RAM.

These are profile classes for repeatable benchmarking, not device-model mandates.

## Sustained Workload Runs (Profiled)

Commands used:

```bash
pnpm benchmark:pqc:profile:baseline
pnpm benchmark:pqc:profile:constrained
```

Run profiles: desktop baseline and desktop constrained (`NODE_OPTIONS=--max-old-space-size=256`), 200 iterations per benchmark case.

Captured profile snapshots are persisted at:

```text
docs/security/pqc/cache/perf-profiles.json
```

### DM Sustained Results (ms)

- Encrypt p50/p95/p99: 0.0204 / 0.0607 / 0.1544
- Decrypt strict p50/p95/p99: 0.0574 / 0.1304 / 0.2110
- Decrypt compatibility p50/p95/p99: 0.0777 / 0.1684 / 0.2544
- Compatibility overhead p50/p95/p99: 0.0203 / 0.0380 / 0.0435

### Group Rekey Sustained Results (ms)

- Add member rekey p50/p95/p99: 0.0144 / 0.0645 / 0.1624
- Remove member rekey p50/p95/p99: 0.0140 / 0.0507 / 0.1670
- Churn-batch rekey p50/p95/p99: 0.0124 / 0.0284 / 0.2352
- Combined membership rekey p50/p95/p99: 0.0142 / 0.0580 / 0.1670

### DM Sustained Results — Constrained Profile (ms)

- Encrypt p50/p95/p99: 0.0339 / 0.0879 / 0.1724
- Decrypt strict p50/p95/p99: 0.0820 / 0.1522 / 0.2248
- Decrypt compatibility p50/p95/p99: 0.0746 / 0.1030 / 0.3436
- Compatibility overhead p50/p95/p99: -0.0074 / -0.0492 / 0.1188

### Group Rekey Sustained Results — Constrained Profile (ms)

- Add member rekey p50/p95/p99: 0.0177 / 0.0772 / 0.2579
- Remove member rekey p50/p95/p99: 0.0144 / 0.0496 / 0.1071
- Churn-batch rekey p50/p95/p99: 0.0162 / 0.0553 / 0.2639
- Combined membership rekey p50/p95/p99: 0.0167 / 0.0609 / 0.2189

### CPU and Memory Impact (Desktop Profiles)

- Desktop baseline: elapsed 3.64s, user CPU 7.13s, system CPU 1.60s, max RSS 159136 KB.
- Desktop constrained: elapsed 3.64s, user CPU 7.52s, system CPU 1.55s, max RSS 153036 KB.

These sustained runs satisfy in-repo profile workload execution and CPU/memory capture for desktop classes. Mobile battery-impact evidence is still required for Stage `4.2.2.1` completion.

## Battery Capture Tooling

Helper script:

```text
scripts/capture-power-metrics.sh
```

Packaged commands:

```bash
pnpm benchmark:pqc:power:linux
pnpm benchmark:pqc:power:android
pnpm benchmark:pqc:power:analyze
pnpm benchmark:pqc:power:linux:pre
pnpm benchmark:pqc:power:linux:post
pnpm benchmark:pqc:power:android:pre
pnpm benchmark:pqc:power:android:post
pnpm benchmark:pqc:power:android-mid:pre
pnpm benchmark:pqc:power:android-mid:post
pnpm benchmark:pqc:power:analyze:linux
pnpm benchmark:pqc:power:analyze:android-low-end
pnpm benchmark:pqc:power:analyze:android-mid
pnpm benchmark:pqc:power:validate
pnpm benchmark:pqc:power:validate:warn
pnpm benchmark:pqc:power:validate:imported
pnpm benchmark:pqc:power:validate:low-end
pnpm benchmark:pqc:power:validate:mid
pnpm benchmark:pqc:power:readiness
pnpm benchmark:pqc:power:readiness:warn
pnpm benchmark:pqc:power:prepare-import-dir
pnpm benchmark:pqc:power:validate-import-dir
pnpm benchmark:pqc:power:validate-import-dir:warn
pnpm benchmark:pqc:power:import-dump -- --file=<path> --profile=<android-low-end|android-mid> --phase=<pre|post>
pnpm benchmark:pqc:power:summarize
pnpm benchmark:pqc:power:sync-report
pnpm benchmark:pqc:power:sync-tracker
pnpm benchmark:pqc:power:next
pnpm benchmark:pqc:power:refresh-report
pnpm benchmark:pqc:power:refresh-all
pnpm benchmark:pqc:power:pass:android-low-end
pnpm benchmark:pqc:power:pass:android-mid
pnpm benchmark:pqc:power:pass:android-low-end:dry
pnpm benchmark:pqc:power:pass:android-mid:dry
pnpm benchmark:pqc:power:closure
pnpm benchmark:pqc:power:closure:dry
pnpm benchmark:pqc:power:closure:imported -- --low-end-pre=<path> --low-end-post=<path> --mid-pre=<path> --mid-post=<path>
pnpm benchmark:pqc:power:closure:imported:dry -- --low-end-pre=<path> --low-end-post=<path> --mid-pre=<path> --mid-post=<path>
pnpm benchmark:pqc:power:closure:imported:dir
pnpm benchmark:pqc:power:closure:imported:dir:dry
pnpm benchmark:pqc:power:closure:imported:safe
pnpm benchmark:pqc:power:closure:imported:safe:dry
```

Suggested workflow for mobile battery evidence:

1. Verify Android capture readiness (`benchmark:pqc:power:readiness`).
2. Capture pre-run snapshot (`benchmark:pqc:power:android:pre`).
3. Execute sustained PQC benchmark run on target device profile.
4. Capture post-run snapshot (`benchmark:pqc:power:android:post`).
5. Run analyzer (`benchmark:pqc:power:analyze:android-low-end` or `benchmark:pqc:power:analyze:android-mid`) to compute deterministic pre/post deltas.
6. Validate required Android evidence completeness (`benchmark:pqc:power:validate`).
7. Record delta observations (battery level, charging status, thermal notes) in this report.

Evidence validation also checks profile-local pre/post ordering (`post >= pre`) and can enforce pair freshness using `--max-pair-age-minutes=<N>`.
Imported evidence runs can require provenance metadata checks using `--require-imported-validation` (packaged as `benchmark:pqc:power:validate:imported`).

Optional one-command orchestration is available per profile (`benchmark:pqc:power:pass:android-low-end` / `benchmark:pqc:power:pass:android-mid`) and performs pre-capture, workload command execution (`--workload-cmd` required), post-capture, analyzer run, and profile-scoped evidence validation.

When Android capture is performed on another machine/device, imported `adb shell dumpsys battery` text can be appended to the same NDJSON evidence stream via `benchmark:pqc:power:import-dump` with explicit `--profile` and `--phase` metadata.
Use `benchmark:pqc:power:prepare-import-dir` to scaffold standard dump files under `docs/security/pqc/cache/imported-dumps` before collection handoff.
The importer validates required battery fields (`level`, `temperature`, `voltage`, `status`) and rejects scaffold placeholders by default; `--allow-placeholder` is available only for dry-run workflow validation.

For full Stage `4.2.2.1.3` closure execution, `benchmark:pqc:power:closure` runs both profile passes (low-end + mid), global evidence validation, summary refresh, report sync, and tracker status sync in sequence.

For externally captured battery dumps, `benchmark:pqc:power:closure:imported` imports low-end/mid pre/post dump files and then runs analyze/validate/summarize/report+tracker sync without requiring local `adb`.
Directory mode is also supported via `--input-dir` (default filenames: `android-low-end-pre.txt`, `android-low-end-post.txt`, `android-mid-pre.txt`, `android-mid-post.txt`).
Imported closure preflight validates file presence, required battery fields, and placeholder-template rejection before any NDJSON writes.
Run `benchmark:pqc:power:validate-import-dir` as a fast readiness preflight before imported closure execution.
Use `benchmark:pqc:power:closure:imported:safe` to run readiness validation and imported closure in one guarded sequence.

Analyzer outputs are profile-scoped to avoid overwrite between runs:

- `docs/security/pqc/cache/power-metrics-summary-desktop-baseline.json`
- `docs/security/pqc/cache/power-metrics-summary-android-low-end.json`
- `docs/security/pqc/cache/power-metrics-summary-android-mid.json`

Consolidated evidence artifacts are generated by `benchmark:pqc:power:summarize`:

- `docs/security/pqc/cache/power-evidence-summary.json`
- `docs/security/pqc/cache/power-evidence-summary.md`

The baseline report auto-generated snapshot block is refreshed via `benchmark:pqc:power:refresh-report`.
Progress tracker status sync (`4.2.2.1` / `4.2.2.1.3`) is applied via `benchmark:pqc:power:sync-tracker`.
Closure guidance from current artifact/import-template state is available via `benchmark:pqc:power:next`.

Current environment note: Linux desktop snapshot capture is validated, but battery fields may be `null` on systems without an exposed `BAT*` power source.

Latest phase-tagged Linux validation (`pnpm benchmark:pqc:power:linux:pre && pnpm benchmark:pqc:power:linux:post && pnpm benchmark:pqc:power:analyze:linux`) produced `docs/security/pqc/cache/power-metrics-summary-desktop-baseline.json` with `sampleCount: 2` and `pairingStrategy: phase-matched`, confirming deterministic pre/post pairing and system delta reporting (`load1`, `memAvailableKb`). Android pre/post snapshots on target low-end and mid profiles remain required to complete Stage `4.2.2.1.3` battery-impact evidence.

## Next Actions

- Deferred blocker: real Android low-end/mid hardware is not currently available, so Stage `4.2.2.1.3` remains open.
- Resume trigger: once Android hardware is available, run `pnpm benchmark:pqc:power:closure:imported:safe` (or adb-native closure) and append resulting battery-drain deltas to this report.

<!-- PQC_POWER_EVIDENCE_START -->
## Power Evidence Snapshot (Auto-Generated)

Generated At: 2026-02-19T18:33:26.814Z
Overall Complete: no
Android Required Complete: no

| Profile | Summary Present | Sample Count | Pairing Strategy | Complete |
| --- | --- | ---: | --- | --- |
| desktop-baseline | yes | 2 | phase-matched | yes |
| android-low-end | yes | 0 | time-range-fallback | no |
| android-mid | no | 0 | n/a | no |

Missing evidence:
- android-low-end: insufficient-phase-matched-samples (sampleCount=0, pairingStrategy=time-range-fallback)
- android-mid: missing-summary-file (sampleCount=0, pairingStrategy=n/a)
<!-- PQC_POWER_EVIDENCE_END -->
