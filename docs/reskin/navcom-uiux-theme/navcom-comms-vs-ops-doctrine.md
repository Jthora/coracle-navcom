# NavCom Comms vs Ops Doctrine

Date: 2026-03-22
Status: Active doctrine
Depends on:
- docs/navcom-vision.md
- docs/reskin/navcom-uiux-theme/navcom-uiux-theme-strategy.md

## 1. Intent

NavCom supports two operational interaction modes in one product:
- Comms Mode: default, low-friction coordination
- Ops Mode: advanced, high-density situational awareness

Doctrine rule:
- Comms Mode is the default for first-use and routine use.
- Ops Mode is explicit, intentional, and role-driven.

## 2. Comms Mode Contract

Primary goal:
- send and receive secure messages quickly with minimal cognitive load

Desktop layout contract:
- left: channels and group navigation
- center: active conversation and compose
- right: collapsible context panel only

Mobile layout contract:
- default route lands in conversation surface
- map and channel surfaces are one interaction away
- compose action always visible or one-tap accessible

Status contract:
- only critical status indicators remain persistent
- additional diagnostics are drill-in, not always-on

## 3. Ops Mode Contract

Primary goal:
- maintain a fused operational picture for navigation, intelligence, and coordination

Desktop layout contract:
- center priority: map and intel fusion
- side regions: operational channels, telemetry, and details
- bottom status rail: critical infra indicators only

Mobile layout contract:
- map/feed switch with pinned quick actions
- detailed telemetry is layered behind explicit drill-in

Status contract:
- expanded metrics are allowed
- urgency semantics must remain explicit and non-ambiguous

## 4. Mode Switch and Persistence

Rules:
- mode switch is explicit and visible
- last mode may persist, but first-use always starts in Comms Mode
- mode switching must not lose unsent input or critical context

## 5. Anti-Overload Constraints

Comms Mode:
- maximum three persistent status indicators
- one primary action per screen region
- no decorative motion in critical message path

Ops Mode:
- high density allowed only where information supports decisions
- repeated indicators should collapse to summaries where possible

## 6. Security and Trust Presentation

Rules:
- encryption state shown at actionable scope, not everywhere
- trust and role cues shown at decision points
- warning and danger semantics never rely on color alone

## 7. Success Criteria

Comms success:
- first-time operator can join a group and send a message with no training

Ops success:
- advanced operator can evaluate map, status, and intel in one coherent workflow

Cross-mode success:
- visual identity remains unmistakably NavCom across both modes
- theme choices never reduce usability or trust clarity
