# NavCom UI/UX Theme Governance

Date: 2026-03-22
Status: Active governance
Depends on:
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-master-checklist.md

## 1. Stage Milestone Calendar

- Stage 1: Governance and WHY alignment
  - Target: Week 1
- Stage 2: Theme system and token foundation
  - Target: Week 1 to Week 2
- Stage 3: Wave 1 shell and status execution
  - Target: Week 2
- Stage 4: Wave 2 primitives and forms execution
  - Target: Week 2 to Week 3
- Stage 5: Wave 3 comms, groups, onboarding execution
  - Target: Week 3 to Week 4
- Stage 6: Wave 4 map and ops execution
  - Target: Week 4 to Week 5
- Stage 7: Wave 5 long-tail normalization
  - Target: Week 5
- Stage 8: QA hardening and release readiness
  - Target: Week 5 to Week 6

## 2. Defect Triage Severity Rubric

Critical:
- blocks core comms or ops workflow
- creates unreadable content in default theme
- breaks map or status legibility in required routes

High:
- degrades primary task flow, trust cues, or accessibility
- causes severe non-default theme readability failures

Medium:
- visual inconsistency or secondary-flow friction
- recoverable with workaround and no data risk

Low:
- cosmetic mismatch with no usability impact

## 3. Release Cut Criteria

A wave is releasable only when:
- acceptance gates pass for the wave
- no unresolved critical or high UI/UX defects in wave scope
- required matrix checks completed for targeted routes
- docs and exception log updated

## 4. Review Cadence

- Daily: owner-level status and blocker review
- Twice weekly: cross-wave dependency review
- End-of-wave: gate review and sign-off

## 5. Decision Logging

Every accepted exception must include:
- component or route
- reason for exception
- risk level
- expiration or revisit date
