# PQC External Opt-In Beta Feedback Issue Template

Use this template for Stage 5.2.2.2 feedback collection.

## Required Fields

- Issue ID: stable identifier (for example `PQC-BETA-001`)
- Title: short summary
- Reporter: operator/user identifier
- Category: one of `security`, `performance`, `interop`, `ux`, `other`
- Severity: one of `P1`, `P2`, `P3`, `P4`
- Status: one of `open`, `triaged`, `resolved`
- Summary: concise impact description
- Evidence: logs/artifacts/steps to reproduce
- Created At: ISO timestamp
- Notes: optional context

## Template

```yaml
issueId: PQC-BETA-001
title: "Short issue title"
reporter: "user-or-operator"
category: "interop"
severity: "P2"
status: "open"
summary: "What happened and impact"
evidence: "log link, artifact path, repro steps"
createdAt: "2026-02-19T00:00:00.000Z"
notes: "optional"
```

## Collection Command

Run:

```bash
pnpm benchmark:pqc:rollout:collect-feedback:warn
pnpm benchmark:pqc:rollout:tag-feedback-classes:warn
pnpm benchmark:pqc:rollout:feed-feedback-milestone:warn
```

This validates `docs/security/pqc/cache/external-opt-in-feedback-submissions.json` and emits collection artifacts in `docs/security/pqc/cache/`.
