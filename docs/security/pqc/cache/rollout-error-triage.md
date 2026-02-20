# PQC Rollout Error Triage

Generated At: 2026-02-19T23:38:59.324Z
Readiness Input: /home/jono/workspace/coracle-navcom/coracle-navcom/docs/security/pqc/cache/rollout-readiness.json
Telemetry Input: /home/jono/workspace/coracle-navcom/coracle-navcom/docs/security/pqc/cache/rollout-telemetry.json
Rows Included: 5

| Rank | Error Class | Severity | Count | Rate | Owner | Contact | Sources |
| ---: | --- | --- | ---: | ---: | --- | --- | --- |
| 1 | Decrypt failure rate elevated | high | 0 | n/a | Crypto Runtime | crypto-runtime@navcom.local | readiness |
| 2 | Secure send success rate degraded | high | 0 | n/a | Messaging Foundations | messaging-foundations@navcom.local | readiness |
| 3 | Downgrade rate elevated | medium | 0 | n/a | Messaging Foundations | messaging-foundations@navcom.local | readiness |
| 4 | Group rekey latency elevated | medium | 0 | n/a | Group Systems | group-systems@navcom.local | readiness |
| 5 | Relay reject rate elevated | medium | 0 | n/a | Relay Integrations | relay-integrations@navcom.local | readiness |

## Guidance
- Review top error classes with listed owners during daily dogfood standup.
- Open owner-tracked remediation items for high-severity classes.
- Re-run readiness and triage after remediation to confirm error reduction.

