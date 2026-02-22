# UX Flows — Relay Auth + Group Access

## A) Create Group (Secured Relays)

1. Select Security Mode.
2. Select relay preset or custom relay list.
3. Run `Check relay capabilities`.
4. Review relay statuses:
   - `ready` → proceed,
   - `auth-required` → complete challenge/response auth,
   - `no-groups`/`unreachable` → remove/replace relay.
5. Submit create.
6. Receive share package preview (group address + relays + auth requirements).

Blocking Conditions:
- No relay is `ready`.
- Required auth relay is unresolved.

## B) Join Group (Secured Relays)

1. Paste invite/group address.
2. Import suggested relay list from invite (if provided).
3. Run `Check relay capabilities`.
4. Resolve `auth-required` relays.
5. Submit join.
6. Confirm active membership status.

Blocking Conditions:
- No `ready` relay for join path.
- Auth-required relay unresolved when policy demands auth.

## C) Auth Resolution Micro-flow

1. User clicks `Authenticate relay`.
2. UI requests challenge from relay.
3. User signs challenge with signer.
4. Relay verifies auth event.
5. Relay status updates to `authenticated` (with timestamp/expiry if provided).

Failure UX:
- Show actionable cause (`signer unavailable`, `challenge expired`, `relay rejected auth`).
- Offer retry and alternate relay recommendation.

## D) Share Access Package

Sender shares:
- group address,
- selected relays,
- relays requiring auth,
- expected security mode.

Receiver sees:
- import relays button,
- preflight status list,
- auth-required checklist,
- join button enabled only when blockers are resolved.
