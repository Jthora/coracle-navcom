# NavCom UI/UX and Theme Audit

Date: 2026-03-22
Status: Baseline audit for redesign planning
Scope: Identity alignment, layout/interaction model, theme architecture, typography, motion, token usage, implementation risk

## 1. Executive Summary

NavCom currently has a strong tactical visual direction, but the interaction model and system framing are split between two identities:

- Social client inheritance from Coracle
- Emerging Earth Alliance operational product identity

The current redesign work has already introduced a strong foundation:

- Tri-axis persistent theme system (Shell x Surface x Accent)
- 4 palettes per axis, with local persistence
- Theme controls exposed in settings
- Runtime CSS variable injection that propagates through Tailwind token classes

Primary gap now is not color capability. Primary gap is product coherence:

- When and how users enter Comms workflow vs Ops workflow
- Which information is always visible vs progressive disclosure
- A consistent semantic token strategy across shell, surfaces, status, and actions

Recommendation:

- Freeze random visual edits
- Move to a documented Phase plan with acceptance criteria
- Treat this as an interaction architecture and design system program, not isolated CSS tweaks

## 2. WHY Alignment (Ground Truth)

Based on vision docs, NavCom exists to be the Earth Alliance nervous system for:

- COMMS: secure, role-aware coordination
- NAV: geospatial shared operational picture
- INTEL: structured and searchable analysis
- AUTH: sovereign identity and trust
- INFRA: resilient, degraded-mode operations

Design implication:

- Every major screen must support operational clarity under stress
- Security affordances should be meaningful and context-specific, not decorative
- Information density must be role and task appropriate

## 3. Current State Audit

## 3.1 Visual Identity

Strengths:

- Strong tactical mood and distinct non-consumer look
- Consistent use of dark surfaces and accent emphasis
- Existing heading/body font character supports mission framing

Weaknesses:

- Several hardcoded effects were still cyan-biased and not fully tokenized (partially corrected in this pass)
- Some shell gradients use artistic values without semantic mapping
- Existing components mix tactical and generic styles without hierarchy rules

## 3.2 Theme System and Persistence

Current capability is now strong:

- Theme persisted at localStorage key: ui/navcom-theme
- Theme config shape: {shell, surface, accent}
- 3 independent element sets:
  - Shell palettes: midnight, void, carbon, nebula
  - Surface palettes: steel, obsidian, graphite, abyss
  - Accent palettes: cyan, amber, emerald, arc
- 4 options per set, satisfying the 3 x 4 requirement
- Theme variables generated and injected into root for runtime propagation

Residual concerns:

- Legacy toggleTheme paths existed in menus and are now redirected to settings entry points
- Need explicit migration note for legacy dark and light env theme vars

## 3.3 Layout and IA

Observed behavior:

- Desktop shell is information-dense and visually on-brand
- Mobile shell still carries legacy menu and action behavior patterns
- Mode switch exists, but workflow semantics are not yet clearly defined for first-use users

Critical UX tension:

- The product needs both Comms-first onboarding and Ops-first capability
- Current UI can express both, but lacks documented priority and progressive disclosure rules

## 3.4 Interaction and Motion

Current state:

- Good baseline transitions, glow language, and tactical motion cues
- New operational utility animations and classes now exist

Risks:

- Motion language is not yet governed by explicit rules
- No role-based or context-based motion reduction strategy

## 3.5 Typography

Current state:

- Strong display identity and acceptable tactical tone
- Existing font stack already loaded in product

Gaps:

- No explicit operational typography matrix for data-dense vs narrative content
- Need formal definition for mission-critical text roles:
  - status data
  - time markers
  - alert labels
  - conversational body text

## 3.6 Token and Component Consistency

Good:

- Tailwind neutral and tinted classes resolve through CSS variables
- Accent classes are broadly reusable and already widespread

Needs work:

- Semantic token use is still uneven in some shell and utility components
- Need codified mapping from product semantics to token groups:
  - shell, surface, divider, emphasis, state, danger, warning, success

## 4. Findings by Severity

High:

1. Identity split at interaction level:
- Visual style says tactical platform
- Primary workflows still partially feel like inherited social client navigation

2. Missing formal mode doctrine:
- No written contract for Comms Mode default behavior vs Ops Mode depth

3. No redesign acceptance framework:
- Work can drift into aesthetic changes without mission outcomes

Medium:

1. Some hardcoded visual effects still exist outside semantic tokens
2. Shell-level components vary in style grammar and depth
3. Typography usage is expressive but not systematized for dense operational data

Low:

1. Residual legacy paths and naming from previous theme model
2. Utility class growth without centralized usage guidance

## 5. What Was Stabilized In This Pass

Implementation was not rolled back. It was stabilized.

Completed stabilization items:

- Added persistent Theme controls to User Settings
- Converted several hardcoded accent effects to accent-rgb token usage
- Updated desktop and mobile theme menu entries to route to settings rather than no-op toggle
- Replaced one hardcoded status bar shell style with token-driven gradient
- Verified edited files pass eslint and svelte-check

This produces a clean baseline for planned redesign documentation.

## 6. Audit Conclusion

NavCom now has the technical primitives required for a true theme system and strong visual identity control. The next milestone is not more isolated styling edits. The next milestone is documented interaction architecture:

- Comms-first onboarding flow
- Ops depth model
- Component semantics and visual language rules
- Phase-gated implementation with measurable acceptance checks

This is ready to move to a formal plan.

Follow-on strategy details are documented in:
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-strategy.md
