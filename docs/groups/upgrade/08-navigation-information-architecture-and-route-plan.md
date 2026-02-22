# Navigation, Information Architecture, and Route Plan

Status: Draft
Owner: Product Design + Frontend
Last Updated: 2026-02-21

## Objective

Define destination architecture and route behaviors for discoverable, low-friction group operations.

## Coverage

- Nav entry points
- Create/join route structure
- Invite/share from room context
- Admin/settings route behavior
- Guard redirect recovery UX

## Required Outputs

- Route map for guided and expert paths
- Explicit dead-end elimination plan
- Persistent recovery pattern for guard redirects

## Acceptance Criteria

- Core tasks are reachable with minimal navigation ambiguity
- Guard failures include persistent explanation and next action

## Critique of Prior Draft

The prior draft listed destination goals but not route-level contracts.
It did not define explicit IA for guided versus expert transitions.
It did not specify recovery persistence requirements after redirects.

## IA Principles

1. Core group actions visible from primary navigation.
2. Room-centric actions located in room context.
3. No dead-end routes without visible next action.
4. Guard failures never silently discard user intent.

## Route Taxonomy

### Entry Routes

- Groups index.
- Create/join start route.

### Room Routes

- Room conversation.
- Room details/overview.
- Room invite/share.
- Room settings/admin.

### Advanced Routes

- Expert policy controls.
- Relay policy editor.
- Diagnostics and security detail.

## Guard and Redirect Contract

1. Redirect must include visible reason.
2. Redirect destination must include recovery CTA.
3. Prior intended action must be restatable without re-entry burden.

## Navigation Discoverability Requirements

- Groups entry appears in both desktop and mobile primary nav.
- Create/join CTA always visible on groups index.
- Invite/share CTA appears in room header or first-level action area.

## Cross-Surface Consistency

Required consistency across desktop and mobile:

- Route labels.
- Action order.
- Error/recovery semantics.

## Interaction Budgets

- Groups entry -> create/join start: <=1 interaction.
- Room open -> invite action: <=2 interactions.
- Room open -> relay settings: guided <=3, expert <=2 interactions.

## Telemetry for Navigation Health

- `groups_nav_opened`
- `groups_route_mismatch_detected`
- `guard_redirect_shown`
- `guard_redirect_recovered`

## QA Route Scenarios

1. Discover and enter groups from nav.
2. Create room through guided path.
3. Access expert controls from room context.
4. Trigger guard redirect and recover without dead end.

## Exit Criteria

IA and route plan is complete when:

- Core paths are fully mapped and test-covered.
- Guard recovery contract is implemented and validated.
- Mobile/desktop route parity checks pass.

