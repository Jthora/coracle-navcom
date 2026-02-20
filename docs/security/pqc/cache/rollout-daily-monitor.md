# PQC Rollout Daily Telemetry Monitor

Generated At: 2026-02-20T00:18:55.158Z
Operator: release-operations
Ready: no
Window: 2026-02-19T00:00:00.000Z to 2026-02-20T00:00:00.000Z (daily-dogfood-window)

## Core Metrics

- Secure send success rate: n/a
- Downgrade rate: n/a
- Secure success delta vs previous: n/a
- Downgrade rate delta vs previous: n/a

## Threshold Evaluation

| Metric | Comparator | Target | Value | Status |
| --- | --- | ---: | ---: | --- |
| Secure send success rate | >= | 0.97 | n/a | missing |
| Downgrade rate | <= | 0.2 | n/a | missing |

## Top Downgrade/Error Classes

- decrypt-failed-invalid-wrap: rate=n/a, count=n/a, owner=Crypto Runtime
- downgrade-no-shared-alg: rate=n/a, count=n/a, owner=Messaging Foundations

## Guidance
- Daily secure success/downgrade monitoring is not ready.
- Populate missing telemetry metrics and remediate threshold failures before expansion.

