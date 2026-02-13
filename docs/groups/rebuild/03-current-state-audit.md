# Current State Audit

Status: Draft
Owner: Core Engineering
Reviewers: Architecture, QA
Last Updated: 2026-02-12

## 1. Purpose

Document current Navcom implementation relevant to Groups rebuild.
Provide code-grounded baseline and migration constraints.
Identify blockers and high-risk dependencies.

## 2. High-Level Summary

Navcom currently provides channel/direct-message functionality.
Current model is participant-set conversation based.
No first-class in-app group domain entity exists.
Legacy groups UX was intentionally removed.

## 3. Routing State

Routes exist for channels list, create, detail, requests.
Channel route identity is derived from participant pubkeys.
No active route tree exists for first-class groups.
Invite routes have serializer remnants for groups input.

## 4. Messaging Model State

Messages derive from kinds for DMs and wrapped DMs.
Channel identity computed from sender + p-tag pubkeys.
Unread/read tracking keyed by channel identifier path.
No canonical group-id based message projection store.

## 5. Send Pipeline State

Send path uses wrapped direct-message flow.
Recipients derived by splitting channel id and adding self.
Publish is event-centric and relay-routed via existing router policies.
No transport abstraction boundary for per-group mode dispatch.

## 6. Read Pipeline State

Load/listen behavior gated by shouldUnwrap flag.
Subscriptions watch legacy and wrapped DM forms.
No group-specific subscription orchestration exists.
No membership-aware fetch planning exists.

## 7. UI Surface State

ChannelCreate drives participant-picking workflow.
ChannelsDetail binds to derived messages for channel id.
Channel component handles composer + history rendering.
Messaging relay warnings are per-participant inbox checks.
No groups list/detail/create/moderation UX in active app flow.

## 8. Security Surface State

NIP44 capability flag determines multi-party chat support messaging.
No explicit secure-tier transport policy object in app state.
No key lifecycle service for secure group transport.
No local encrypted group-state subsystem.

## 9. Domain Layer State

Domain exports cover lists, feeds, handlers, connection types.
No dedicated group domain module exists.
List constants include channels and communities related kinds.
No group membership state machine in domain package.

## 10. Storage State

Existing storage adapters handle relays, handlers, zappers, plaintext, tracker.
No dedicated adapter for group state snapshots or epochs.
No secure-key persistence partition for group transport secrets.

## 11. Capability/Interop State

Relay quality and auth statuses are represented generally.
No relay capability probing for group-mode requirements.
No interop matrix encoded in runtime policy checks.

## 12. Feature Flag State

Current flags focus on broader app functionality and messaging toggles.
No explicit flags for group transport mode rollout.
No kill-switch path dedicated to groups.

## 13. Documentation State

No rebuild-specific implementation control docs yet.
No protocol strategy matrix integrated into dev workflow.
No milestone acceptance criteria bound to groups rollout.

## 14. Current Strengths

Existing event repository and derivation patterns are mature.
Router and publish/request primitives are flexible.
UI composition for message rendering is reusable.
Read-tracking patterns can be repurposed.

## 15. Current Gaps

Missing first-class group domain model.
Missing group identifier strategy independent of pubkey sets.
Missing transport abstraction layer.
Missing membership projection and moderation projection stores.
Missing capability gate framework.
Missing rollout and fallback controls.

## 16. Migration Risks

Risk of conflating channel and group identities.
Risk of regression in existing DM workflows.
Risk of ambiguous UX during hybrid period.
Risk of data duplication between projections.
Risk of unbounded subscription growth.

## 17. Technical Debt Constraints

Current channel id assumptions are embedded in route serializer and state helpers.
Message filtering and grouping logic tied to channel identity assumptions.
Help and informational copy references old messaging framing.
Invite flow supports relays/people and needs schema extension.

## 18. Required Architectural Seams

Introduce Group entity with canonical identifier.
Introduce GroupTransport interface and adapter registry.
Introduce projection stores for group state and membership.
Introduce capability probing and policy evaluator.
Introduce mode-specific composer dispatch path.

## 19. Dependencies To Track

Welshman app/store/router/net abstractions.
Signer capability for encryption primitives.
Relay behaviors for auth and event handling.
UI components for message list and composer.

## 20. Audit Findings Severity

Critical:
No first-class group model.
No transport abstraction for protocol agility.
No secure-tier policy enforcement substrate.

High:
Route identity and state coupling to pubkey sets.
No membership state machine.
No moderation action pipeline for groups.

Medium:
Invite schema partial support.
Help copy and labels outdated for rebuilt model.

Low:
Legacy groups redirect page still present.

## 21. Workstream Mapping

Workstream A: Domain and projections.
Workstream B: Transport and protocol adapters.
Workstream C: Routes and UX rebuild.
Workstream D: Security and key lifecycle.
Workstream E: Rollout and operations.

## 22. Required Baseline Tests Before Refactor

Channel regression suite for current messaging.
Read/unread state regression tests.
Compose/send error handling regression tests.
Relay warning UX regression tests.

## 23. Open Questions

How much channel UX is retained versus replaced.
Whether group and channel histories coexist in one view.
Whether group migration includes historical channel mapping.

## 24. Exit Criteria For This Document

Code paths inventoried and reviewed.
Gaps prioritized and linked to milestones.
Risks acknowledged by architecture and product.
Referenced by target architecture and milestone plan.
