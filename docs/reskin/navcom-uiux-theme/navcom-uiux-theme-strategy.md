# NavCom UI/UX Theme Strategy (WHY-Anchored)

Date: 2026-03-22
Status: Strategic planning extension
Depends on:
- docs/navcom-vision.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-audit.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-plan.md

## 1. Purpose

This document extends the rebuild plan with deeper WHY anchoring and explicit design exploration across style, theme, color, and layout.

This is the decision bridge between:
- Vision doctrine (what NavCom must be)
- Execution plan (how we ship it)
- UI behavior and visual language (what users actually experience)

## 2. Non-Negotiable Product Truth

NavCom is operational infrastructure, not a social feed skin.

Therefore, every UI decision must satisfy at least one of these outcomes:
- Faster comprehension under stress
- Clearer mission context
- Lower risk of operator error
- Better trust in system state and message integrity
- Better degraded-mode resilience cues

If a visual flourish does not improve these, it is decoration and should be deprioritized.

## 3. WHY-to-UI Translation Matrix

## COMMS

Goal:
- Fast, low-friction secure coordination

UI translation:
- Comms Mode is default landing behavior
- Primary surface hierarchy:
  1. channel list with unread and priority state
  2. active conversation stream
  3. compose actions (message, check-in, alert)
- Encryption tier shown once at channel scope, not repeated on every message

Style implications:
- High-contrast conversational text
- Minimal badge noise
- Strong primary action contrast

## NAV

Goal:
- Shared spatial picture for action

UI translation:
- Map is always one transition away in Comms Mode
- Ops Mode can make map persistent and central
- Geo actions are explicit and intentional, not accidental clutter

Style implications:
- Marker and layer legibility over aesthetic glow
- Stable map UI chrome with low visual interference

## INTEL

Goal:
- Turn raw updates into decision-ready awareness

UI translation:
- Structured report surfaces (SITREP or SPOTREP) become progressive, not default compose burden
- Feed cards prioritize source, time, confidence, and actionability

Style implications:
- Dense but readable data typography
- Confidence and severity encoded consistently with semantic color rules

## AUTH

Goal:
- Trusted identity and permissions clarity

UI translation:
- Identity and role markers are visible at key trust decisions only
- Security status surfaced as actionable states, not ambient fear indicators

Style implications:
- Distinct visual treatment for verified, unknown, and restricted states
- Minimal icon ambiguity for trust signals

## INFRA

Goal:
- Operate through degraded network conditions

UI translation:
- Status bar semantics: what is critical now vs what is inspectable detail
- Explicit offline queue visibility only when it changes user decisions

Style implications:
- Alert and warning colors reserved for true operational meaning
- No persistent warning fatigue visuals

## 4. Visual Language Exploration

## 4.1 Mood Targets

The UI should read as:
- sovereign
- disciplined
- reliable
- mission-ready

The UI should avoid reading as:
- gamer HUD cosplay
- generic social app with dark theme
- decorative cyberpunk neon

## 4.2 Form and Edge Grammar

Shell elements:
- Slightly harder edges with controlled radii for equipment-like framing

Interactive controls:
- Softer edge than shell to signal touchability

Status and alert modules:
- Strong border and state contrast, restrained glow

Rule:
- Glow is emphasis, not base styling. Base clarity must stand without glow.

## 4.3 Typography Doctrine

Display role:
- For mode labels and section headers only

Operational body role:
- Must maximize scan speed over stylization

Monospace role:
- Time, IDs, relay and crypto references

Planned typography matrix:
- Narrative text (chat and docs)
- Operational metadata (timestamps and labels)
- Urgent status (alerts and degraded state)
- Structural labels (mode and region headings)

## 4.4 Motion Doctrine

Allowed motion intents:
- confirm user action
- reveal hierarchy changes
- signal actionable urgency

Disallowed motion patterns:
- continuous ornamental movement without meaning
- competing simultaneous highlights

Motion budget:
- one primary animated emphasis per viewport region

## 5. Theme System Strategy (3 Sets x 4 Themes)

The existing tri-axis model is retained as foundational architecture:
- Shell (4)
- Surface (4)
- Accent (4)

## 5.1 Axis Semantics

Shell axis controls:
- global frame, depth, and atmospheric tone

Surface axis controls:
- cards, panels, input baselines, and readable contrast field

Accent axis controls:
- action emphasis, links, focus rings, and mission highlights

## 5.2 Palette Intent Profiles

Shell profiles:
- midnight: command bridge, cool and structured
- void: low-distraction default operations baseline
- carbon: industrial and hardware-forward neutrality
- nebula: strategic and intelligence-heavy atmosphere

Surface profiles:
- steel: crisp and analytical panel reading
- obsidian: balanced dark default with broad readability
- graphite: denser and subdued for prolonged sessions
- abyss: deep contrast for high-focus work

Accent profiles:
- cyan: comms and signal clarity baseline
- amber: caution-aware operational planning context
- emerald: positive-state and trusted coordination focus
- arc: multi-vector/high-attention mission emphasis

## 5.3 Pairing Guidance

Default recommendation:
- shell: void
- surface: obsidian
- accent: cyan

High-focus field operations:
- shell: carbon
- surface: graphite
- accent: amber

Intel analysis sessions:
- shell: nebula
- surface: steel
- accent: arc

Sustained comms operations:
- shell: midnight
- surface: abyss
- accent: emerald

## 5.4 Semantic Stability Rules

Across all 64 combinations:
- success, warning, danger meanings do not shift
- contrast floors remain enforced for text and controls
- alert semantics are never carried only by color (shape and icon backup required)

## 6. Layout Strategy

## 6.1 Comms Mode (Default)

Desktop:
- left: channels and group navigation
- center: conversation and compose
- right (collapsible): context and operator metadata

Mobile:
- default tab: conversation
- secondary tabs: channels and map
- compose is always reachable in one tap

## 6.2 Ops Mode (Advanced)

Desktop:
- center priority: map and intel fusion region
- left: operational channels and task queues
- right: status and details stack
- bottom status rail: critical infra and relay state only

Mobile:
- map and feed switch with pinned quick actions
- dense details behind intentional drill-in

## 6.3 Shared Layout Rules

- One primary action per screen region
- No more than three persistent status indicators in Comms Mode
- Additional status moves to inspectable panels

## 7. Execution Upgrade (Plan Addendum)

The existing phase plan stands. Add these explicit deliverables:

Phase 0 add:
- publish WHY-to-UI matrix and mode doctrine one-pager

Phase 1 add:
- semantic token mapping table by component family

Phase 2 add:
- minute-one onboarding usability script and success benchmark

Phase 3 add:
- ops density audit with role-based task walkthroughs

Phase 4 add:
- motion and typography usage catalog with examples and anti-patterns

Phase 5 add:
- 64-combination theme QA matrix with pass criteria

## 8. Design Review Gates

Gate A: Identity gate
- Does this feel like operational infrastructure, not social feed chrome?

Gate B: Clarity gate
- Can a first-time operator complete core tasks without explanation?

Gate C: Trust gate
- Are security and status signals actionable and non-theatrical?

Gate D: Resilience gate
- Is degraded behavior visible and understandable without alarm fatigue?

Gate E: Theme integrity gate
- Does all core UI remain coherent and legible in any 3x4x4 combination?

## 9. Immediate Next Documentation

1. docs/reskin/navcom-comms-vs-ops-doctrine.md
2. docs/reskin/navcom-token-handbook.md
3. docs/reskin/navcom-component-style-contract.md
4. docs/reskin/navcom-theme-qa-matrix.md

## 10. Success Definition

This strategy succeeds when:
- The UI communicates mission readiness within seconds
- First-use operators can join and operate with minimal friction
- Advanced operators can enter dense Ops surfaces without contaminating default simplicity
- Theme customization strengthens identity and usability, not novelty
