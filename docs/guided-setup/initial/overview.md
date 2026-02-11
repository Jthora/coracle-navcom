# Guided Setup Overview

## Purpose
- Establish a three-step, managed-first onboarding that gets new users posting quickly without teaching Nostr/web3.
- Minimize friction by reducing choices, hiding protocol details, and deferring education to external links.
- Provide guardrails (keys exist, backups reminded) without blocking reading or basic posting.

## Objectives
- Get a new user from entry to first post in under one minute on the managed path.
- Increase completion rate of signup to post compared to legacy flow.
- Provide a safe default (managed key) while keeping an opt-in advanced path.
- Keep landing page unchanged; intercept via nav/login/post-gate instead.
- Maintain optional education via outbound links, not embedded lessons.

## Scope
- In scope: signup flow (/signup), nav/login/post-gate CTAs, key generation/selection, minimal profile setup, backup reminders, telemetry for onboarding.
- Out of scope: landing hero redesign, deep protocol education inside the flow, requiring relays/follows selection to proceed, wallet/zap setup.
- Dependencies: existing login/router infrastructure, key management utilities, default relays/follows configuration, notification/task framework.

## Core Principles
- Managed-first: default to an app-managed key; allow export later.
- Minimal steps: Start → Key → Profile-lite → Done; no mandatory follows/relays/profile extras.
- Hide complexity: auto-apply defaults (relays/follows); keep advanced toggles out of the main path.
- Offer choice without friction: advanced/self-custody links are present but secondary.
- Educate externally: link to "What is Nostr?" and similar, do not inline lessons.
- Nudge, don’t block: only block posting if no key; remind for backups post-signup.

## Success Metrics
- Time-to-first-post (managed path): target <60s median from flow start.
- Signup completion rate: % entering /signup who reach flow end.
- Path uptake: ratio managed vs advanced/self-custody.
- Backup confirmations: % of self-custody users confirming backup within first session.
- Drop-off by step: intro/key/profile segments.

## Guardrails
- Do not alter landing page hero or initial content surfaces.
- Keep read-only usage fully accessible without signup.
- Avoid mandatory education steps; keep all learning optional and external.
- Limit required inputs to absolute minimum (handle/display name optional/skip allowed).
- Prevent posting only when no key exists; do not block on relays/follows/profile.

## User Segments
- New-to-Nostr, web2-only users: default path; minimal decisions; no jargon.
- Power/advanced users: access self-custody/import/external signer via secondary link.
- Returning partial users: resume flow where they left; no restart required.

## Entry Points
- Nav (desktop/mobile) "Get started" linking to /signup.
- Post attempt by guest: gate to /signup (not /login).
- Login screen: primary CTA for guided setup above advanced sign-in options.

## Flow Summary
- Step 1: Start screen with plain-language value prop and CTA.
- Step 2: Key choice screen defaults to managed key (one-tap). Advanced link: self-custody/import/external signer. External signer is optional escape, not primary.
- Step 3: Profile-lite (handle/display name) with skip allowed. Completion leads to app use.
- Post-signup: backup reminder (toast/banner), optional mini-tour link.

## Defaults & Automation
- Auto-apply default relays without prompting.
- Offer a single toggle "Add starter follows" (default on); can skip entirely.
- Do not require profile fields; offer skip.

## Education Strategy
- Provide one-click links to external explainer resources for Nostr/web3.
- Avoid in-flow protocol descriptions; keep strings short and functional.

## Backup Strategy
- Managed users: offer export key after signup; mild reminder.
- Self-custody users: persistent reminder until backup confirmed; no hard block after signup.

## Telemetry Plan (high level)
- Capture entry point, path (managed/advanced), step completion, drop-off, time-to-first-post, backup confirmation.
- Use metrics to iterate: if managed path drop-off is high, further reduce steps/wording.

## Risks & Mitigations
- Risk: Users miss /signup entry. Mitigation: add nav and post-gate CTAs, promote on Login.
- Risk: External signer path drop-off. Mitigation: keep managed default, external as secondary.
- Risk: Over-collection of inputs. Mitigation: keep optional; skip allowed; defaults applied silently.
- Risk: Education creep. Mitigation: enforce external links only; review copy budget per screen.

## Non-Goals
- Teaching Nostr or web3 fundamentals inside the flow.
- Forcing follows/relays selection or full profile completion before posting.
- Requiring wallet/zap setup during signup.

## Deliverables
- Updated flow screens (Start, Key choice, Profile-lite, Done).
- CTA updates (nav/login/post-gate) routing to /signup.
- Backup reminder UX post-signup.
- Telemetry hooks for onboarding events.
- Docs set in docs/guided-setup/initial.

## Constraints
- Keep ASCII text; minimal visual churn outside signup and nav/login/post-gate surfaces.
- Maintain compatibility with existing router/login/state structures.

## Open Questions
- Do we require handle uniqueness at signup or allow later change? (Default: allow change later.)
- Should starter follows be auto-applied silently or gated by a toggle? (Default: toggle on.)
- How soon to nag managed users about export? (Default: after first session, mild.)

## Next Actions (build phase)
- Wire nav/login/post-gate CTAs to /signup.
- Implement 3-step managed-first flow with advanced link.
- Add post-signup backup reminder and export entry point.
- Instrument telemetry for entry, path, steps, backup.
