# Personas, Jobs-To-Be-Done, and Primary Tasks

Status: Draft
Owner: Product Design
Last Updated: 2026-02-21

## Personas

- New user (guided-first)
- Operator/admin (hybrid)
- Security/power user (expert-first)

## JTBD

- Create a room fast and safely
- Invite others and confirm they joined
- Send and receive messages reliably
- Understand security state at a glance
- Configure room relays including private/self-hosted relays

## Primary Task Checklist

1. Discover Groups from nav
2. Create or join room
3. Configure privacy/security mode
4. Configure room relays
5. Share invite
6. Verify active membership
7. Send first message
8. Manage members/settings

## Output Required

Per task: expected path, max clicks, error states, recovery path, telemetry events.

## Critique of Prior Draft

The earlier version listed personas and tasks but lacked operational specificity.
It did not define measurable thresholds for “easy.”
It did not define who owns validation for each persona-critical flow.
It did not specify which tasks are P0 versus P1.
It did not map tasks to test scenarios or telemetry events.

## Persona Detail Matrix

| Persona | Primary Goal | Technical Comfort | Biggest UX Risk | Critical Outcome |
| --- | --- | --- | --- | --- |
| New user | Create room and chat fast | Low | Terminology overload | First message sent |
| Operator/admin | Coordinate room and members | Medium | Hidden controls and unclear state | Invite and manage with confidence |
| Expert/security | Control policy and relay topology | High | Oversimplified controls | Deterministic, inspectable behavior |

## Task Priority Classification

### P0 Tasks

1. Discover Groups from nav.
2. Create room.
3. Join room via invite.
4. Send first message.
5. Understand active security state.

### P1 Tasks

1. Configure room relays including private relays.
2. Share room invite from room context.
3. Manage members and settings.

### P2 Tasks

1. Deep diagnostics and advanced help discovery.
2. Complex policy tuning workflows.

## Task Success Budgets

### New User

- Max clicks from group entry to first message: 6.
- Max blocking decision points before first message: 2.
- No mandatory protocol vocabulary.

### Operator

- Invite creation from room context in <=2 interactions.
- Member action completion in <=4 interactions.

### Expert

- Access advanced policy and relay controls without hidden navigation.
- Confirm active transport/security state without ambiguity.

## Required Recovery Patterns by Task

1. Invalid group input -> immediate correction guidance.
2. Guard-redirected settings/moderation -> persistent reason and next step.
3. Relay failure -> retry, edit relay set, or continue with fallback.
4. Secure-intent blocked -> clear reason and explicit fallback choice.

## Telemetry Mapping Template

For each task record:

- `task_started`
- `task_step_completed`
- `task_failed`
- `task_abandoned`
- `task_completed`

## Test Mapping Template

For each P0 task:

- One integration/view-level assertion.
- One e2e scenario with error handling branch.

For each P1 task:

- One view-level assertion minimum.

## Dependency Notes

- Guided-mode copy spec must align with persona A.
- Expert-mode control matrix must align with persona C.
- Relay policy spec must support personas B and C.

## Open Questions

1. Should persona selection be explicit in UI or inferred by mode choice?
2. Should guided mode expose optional “advanced now” checkpoints?
3. Should operator role defaults differ by room type?

## Acceptance Criteria

1. Persona matrix reviewed by Product and QA.
2. P0 task list and budgets approved.
3. Task-to-test mapping created in test strategy doc.
4. Task-to-telemetry mapping created in telemetry doc.
# Personas, Jobs-To-Be-Done, and Primary Tasks

Status: Draft
Owner: Product Design
Last Updated: 2026-02-21

## Personas

- New user (guided-first)
- Operator/admin (hybrid)
- Security/power user (expert-first)

## JTBD

- Create a room fast and safely
- Invite others and confirm they joined
- Send and receive messages reliably
- Understand security state at a glance
- Configure room relays including private/self-hosted relays

## Primary Task Checklist

1. Discover Groups from nav
2. Create or join room
3. Configure privacy/security mode
4. Configure room relays
5. Share invite
6. Verify active membership
7. Send first message
8. Manage members/settings

## Output Required

Per task: expected path, max clicks, error states, recovery path, telemetry events.
