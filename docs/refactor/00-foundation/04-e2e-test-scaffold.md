# 00-04: E2E Test Scaffold

> Build a minimal Cypress test suite covering critical paths before the two-mode rewrite.

**Priority**: Do before rewriting any layout code — these tests are the safety net.  
**Effort**: MEDIUM (2–3 days)  
**Depends on**: Nothing  
**Source**: [navcom-future-risks.md](../../navcom-future-risks.md) §8

---

## Problem

Unit tests cover crypto and group state (556 tests passing via vitest). The `cypress/` directory exists but has no working E2E tests. UI layer coverage is near zero. The two-mode architecture rewrite will restructure App.svelte, Routes.svelte, Nav.svelte, and all layout components — without E2E tests, regressions are invisible.

---

## Scope: 5 Critical-Path Tests

Focus on the flows that **must not break** during the rewrite. Not exhaustive coverage — just the golden paths.

### Test 1: First Visit → Onboarding → Landing Page

```
1. Visit / with no session
2. Verify landing page loads (not blank, not error)
3. Click "Create Account" (or equivalent)
4. Complete onboarding (name entry → key generation)
5. Verify user lands on a functional page (channel list or notes)
```

### Test 2: Invite Link → Group Join → Conversation

```
1. Visit invite link URL
2. Complete onboarding (if new user)
3. Verify user is placed in the invited group's conversation
4. Verify messages load (or empty state shows correctly)
```

### Test 3: Group Chat → Send Message

```
1. Navigate to a group conversation (fixture or mock)
2. Type a message in the compose bar
3. Send the message
4. Verify message appears in the stream
```

### Test 4: Navigation → All Major Views Load

```
1. Navigate to each primary route: /notes, /groups, /settings, /intel/map
2. Verify each renders without error (not blank)
3. Verify back navigation works
```

### Test 5: Theme Toggle → Visual Persistence

```
1. Toggle theme from dark to light
2. Verify body class changes
3. Refresh page
4. Verify theme persists (localStorage)
```

---

## Setup

### Cypress Configuration

`cypress.config.ts` already exists. Verify:
- `baseUrl` points to dev server
- `viewportWidth`/`viewportHeight` set for mobile and desktop
- `video: false` for faster CI runs

### Test Fixtures

Create minimal fixtures in `cypress/fixtures/`:
- `user.json` — pre-generated nsec/npub for test identity
- `group.json` — pre-configured group with relay hints
- `invite.json` — invite link data

### Custom Commands

Add to `cypress/support/commands.ts`:
- `cy.login(nsec)` — inject key into localStorage to skip onboarding
- `cy.visitRoute(path)` — navigate and wait for route to load (with timeout)

---

## File Structure

```
cypress/
  e2e/
    01-first-visit.cy.ts
    02-invite-join.cy.ts
    03-send-message.cy.ts
    04-navigation.cy.ts
    05-theme-toggle.cy.ts
  fixtures/
    user.json
    group.json
    invite.json
  support/
    commands.ts
```

---

## Post-Rewrite: Expand Coverage

After the two-mode architecture is built, add:
- Test 6: Mode switching (Comms → Map → Ops → Comms)
- Test 7: Channel sidebar persistence across mode switches
- Test 8: PQC encryption indicator visibility
- Test 9: Check-In quick action flow
- Test 10: Dashboard data rendering

---

## Verification

- [ ] `npx cypress run` passes all 5 tests
- [ ] Tests run in < 60 seconds total
- [ ] Tests work in headless mode (CI-compatible)
- [ ] At least one test covers mobile viewport (375×812)
