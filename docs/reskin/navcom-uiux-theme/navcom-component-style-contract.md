# NavCom Component Style Contract

Date: 2026-03-22
Status: Draft v1
Depends on:
- docs/reskin/navcom-uiux-theme/navcom-token-handbook.md
- docs/reskin/navcom-uiux-theme/navcom-comms-vs-ops-doctrine.md

## 1. Purpose

Define consistent style and behavior rules by component family.

## 2. Shell Components

Applies to:
- Nav, menu shells, status bars, modal shell

Contract:
- shell background and borders must use shell and surface semantic tokens
- accent glow is optional emphasis, not baseline readability mechanism
- shell typography should prioritize hierarchy clarity over decoration

## 3. Controls and Inputs

Applies to:
- button, input, textarea, select, toggle, tabs

Contract:
- shared states must be consistent across families
- primary action treatment must be visually stronger than secondary actions
- focus-visible state must be obvious on every theme combination

## 4. Message and Feed Surfaces

Applies to:
- message bubbles, feed cards, note cards, list rows

Contract:
- content readability is primary
- metadata should be visually secondary but legible
- unread, priority, and urgent states must be distinguishable

## 5. Map and Ops Surfaces

Applies to:
- map toolbars, layer panels, marker popups, ops cards

Contract:
- geospatial content legibility takes precedence over shell effects
- overlays must preserve map context while staying readable
- critical statuses require clear textual or iconic reinforcement

## 6. Onboarding and Trust Surfaces

Applies to:
- onboarding flows, key choice, profile lite, trust badges

Contract:
- first-time flow must keep one clear primary action
- trust cues should appear where they support decisions
- avoid introducing dense status noise in first-use paths

## 7. Motion and Edge Rules

Motion:
- animate only when it supports feedback, transition, or urgency
- avoid constant decorative motion on primary task paths

Edge treatment:
- shell edges can be firmer
- controls should be slightly softer to suggest interactivity
- borders and glow must communicate hierarchy, not style noise

## 8. Regression Criteria

A component update fails contract if:
- style depends on hardcoded literals where semantic tokens exist
- focus or error state becomes hard to perceive
- non-default themes break hierarchy or legibility
- warning/danger semantics are color-only
