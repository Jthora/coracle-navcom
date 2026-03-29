# NavCom UI/UX and Theme Rebuild Plan

Date: 2026-03-22
Status: Planning baseline
Depends on: docs/reskin/navcom-uiux-theme/navcom-uiux-theme-audit.md
Informed by: docs/reskin/navcom-uiux-theme/navcom-uiux-theme-strategy.md
App-wide extension: docs/reskin/navcom-uiux-theme/navcom-uiux-theme-app-wide-audit.md

This document defines phased delivery. Strategy-level WHY translation, style exploration,
and mode/layout doctrine are captured in navcom-uiux-theme-strategy.md.

## 1. Planning Principles

1. Mission over cosmetics
- Every redesign choice must improve operator clarity, speed, trust, or resilience

2. Progressive disclosure
- Default simple behavior for minute-one users
- Dense operational controls only when needed

3. Token-first implementation
- No direct hardcoded palette values in component styling where semantic tokens exist

4. Mode clarity
- Comms Mode and Ops Mode must be explicit in behavior and information density

5. Measurable acceptance
- Every phase has visible output and test criteria

## 2. Target Product Doctrine

Comms Mode (default):
- Optimized for joining groups, reading updates, sending messages, check-ins, and alerts
- Minimal persistent status and low cognitive overhead

Ops Mode (advanced):
- Optimized for fused map, intel streams, relays, and mission-state awareness
- Higher information density and richer control surfaces

Theme doctrine:
- Users can independently set Shell, Surface, Accent
- Each axis has 4 curated palettes
- Changes are instant and persisted
- State and severity colors remain semantically stable across all palettes

## 3. Phase Plan

## Phase 0: Documentation and Baseline Freeze

Deliverables:

- Finalize audit document
- Publish this phase plan
- Create a compact implementation checklist for engineering

Acceptance:

- Team agrees on Comms default and Ops advanced doctrine
- Team agrees on non-goals for this cycle

## Phase 1: Semantic Token Completion

Objective:

- Ensure shell-level and critical shared components use semantic tokens consistently

Scope:

- Top nav, side/menu shells, status bars, modal shell, inputs, primary buttons
- Replace remaining hardcoded accent or shell effects with semantic/tokenized values

Acceptance:

- No hardcoded accent RGB values in shell components
- Theme changes visibly propagate through core shell and forms
- Existing behavior unchanged beyond intended visual updates

## Phase 2: Comms Mode Clarity Pass

Objective:

- Make minute-one usage obvious and low-friction

Scope:

- Entry points, group access, message composition hierarchy, primary action emphasis
- Reduce non-essential persistent status noise in default paths

Acceptance:

- New user can reach and use group chat with no training cues
- Visual hierarchy clearly indicates primary action and current context

## Phase 3: Ops Mode Information Architecture

Objective:

- Formalize high-density operations surfaces without burdening Comms users

Scope:

- Status model, map and intel coupling, escalation affordances, role-appropriate controls
- Explicit criteria for what remains persistent vs detail on demand

Acceptance:

- Ops surfaces feel coherent, intentional, and role-appropriate
- No forced complexity bleed into default Comms workflows

## Phase 4: Motion, Typography, and Edge Treatment System

Objective:

- Make style language feel native to NavCom, not decorative

Scope:

- Motion grammar by intent category: feedback, transition, alert, ambient
- Type scale and role matrix for status, chat, intel, and controls
- Border and glow rules by semantic importance

Acceptance:

- Motion has clear function and no visual noise
- Type usage supports readability in both dense and narrative contexts
- Edge treatments communicate hierarchy and state consistently

## Phase 5: QA, Accessibility, and Regression Shielding

Objective:

- Lock visual and behavioral quality for long-term maintenance

Scope:

- Theme switching verification matrix
- Contrast and readability checks
- Mobile and desktop shell checks
- Visual regression snapshots on key screens

Acceptance:

- Core paths tested across all theme axis combinations
- No introduced a11y regressions in key interaction flows
- Performance and responsiveness remain acceptable

## 4. Implementation Checklist (Engineer-Ready)

1. Inventory and replace remaining hardcoded color effects in shell-critical components
2. Define and publish semantic token usage table in docs
3. Document Comms Mode default surface contract
4. Document Ops Mode expanded surface contract
5. Add lightweight visual regression targets for nav, menu, settings, and status shell
6. Add theme matrix smoke test checklist:
- Shell x Surface x Accent combinations
- Active, hover, disabled, focus states
7. Record final decisions in changelog and design docs

## 5. Out of Scope For This Cycle

- Full iconography replacement
- Major route architecture rewrite
- Deep workflow redesign of all long-tail views
- Native mobile-only UI divergence

## 6. Documentation Set To Produce Next

1. Design decision record:
- Why Comms-first default and how Ops mode escalates

2. Token handbook:
- Semantic token names, allowed usage, anti-patterns

3. Component style contract:
- Shell, cards, controls, status, alerts, and interactive states

4. Theme QA guide:
- Test matrix and sign-off template

## 7. Success Criteria

This cycle succeeds if:

- The interface feels unmistakably like NavCom
- First-use paths are simpler, not denser
- Ops capabilities are stronger without becoming default noise
- Theme customization is stable, coherent, and fully persistent
- The team can continue implementation from documentation without guesswork
