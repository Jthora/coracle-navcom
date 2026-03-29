# 01-08: Enrollment Flow

> Simplify first-visit experience from 4-step ceremony to 1-screen setup.

**Priority**: HIGH — the current flow loses users and drops invite context.  
**Effort**: MEDIUM (~150 lines of changes)  
**Depends on**: 01-03 (Comms View) — the user must land in comms, not `/notes`  
**Source**: [navcom-two-modes.md](../../navcom-two-modes.md) §Enrollment, [navcom-ux-critique.md](../../navcom-ux-critique.md) §9, [navcom-gap-analysis.md](../../navcom-gap-analysis.md) §5

---

## Current Problems (from UX audit)

1. **Invite links lose context** — `InviteAccept.svelte` accepts an `invite` prop but only logs a boolean; it never passes `returnTo` to `Onboarding.svelte`
2. **Post-onboarding dumps to `/notes`** — the `exit()` function in `Onboarding.svelte` falls through to `router.at("notes").push()` because no `returnTo` is set
3. **4-step key ceremony** — name → key display → key backup prompt → relay selection. New users don't understand why they need a key or what relays are.
4. **"Callsign" adds a concept** — per UX critique §9, use familiar terminology ("Choose a name" not "Set your callsign")

---

## Target Flow

### Path A: Invite Link (most common)

```
1. Tap invite link → NavCom loads
2. One screen:
   ┌──────────────────────────┐
   │      NAVCOM LOGO         │
   │                          │
   │  Choose a name           │
   │  ┌────────────────────┐  │
   │  │ [                ] │  │
   │  └────────────────────┘  │
   │                          │
   │  [Optional: add avatar]  │
   │                          │
   │  ┌────────────────────┐  │
   │  │    JOIN GROUP       │  │
   │  └────────────────────┘  │
   │                          │
   │  By continuing, you      │
   │  agree to Terms          │
   └──────────────────────────┘

3. Behind the scenes:
   - Generate keypair silently
   - Set relays from group hints in the invite
   - Auto-join the invited group
   
4. Land in Comms Mode, inside that group's conversation
   (total time: < 5 seconds)

5. 24 hours later: prompt to back up keys
```

### Path B: Direct Visit (no invite)

```
1. Visit navcom.app directly
2. Same one-screen setup (without "JOIN GROUP" — just "GET STARTED")
3. Land in Comms Mode with empty channel list
4. See: "No channels yet. Join or create one." + [Join] [Create] buttons
```

### Path C: Existing Nostr Identity

```
1. Visit navcom.app
2. Click "I have a Nostr identity" (small link, not primary)
3. NIP-07 extension login or nsec paste
4. Land in Comms Mode with their existing groups populated
```

---

## Implementation

### 1. Wire `returnTo` from InviteAccept to Onboarding

**File**: `src/app/views/InviteAccept.svelte`

The `invite` prop contains group information. After accept, pass the group's conversation URL as `returnTo`:

```typescript
// After accepting invite
const returnTo = `/groups/${groupId}/conversation`
router.at("onboarding").qp({returnTo}).push()
```

### 2. Simplify Onboarding to One Screen

**File**: `src/app/views/Onboarding.svelte`

Collapse the multi-step flow:
- **Keep**: Name input, optional avatar
- **Remove from primary flow**: Key display, key backup prompt, relay selection
- **Add**: Silent key generation on submit
- **Add**: Auto-set relays from invite hints (or defaults)
- **Change exit()**: Navigate to `returnTo` if set, otherwise to Comms Mode (channel list)

### 3. Defer Key Backup

After onboarding, set a localStorage flag: `key-backup-reminded: false` with timestamp.

24 hours later (or on next visit after 24h), show a non-blocking notification:
```
"Your identity key hasn't been backed up. If you lose access to this device, 
you'll lose your identity. [Back Up Now] [Remind Me Later]"
```

### 4. Fix Post-Onboarding Landing

**File**: `src/app/views/Onboarding.svelte`

Change the `exit()` fallback from `router.at("notes").push()` to:
- If `returnTo` is set → navigate there (the invited group's conversation)
- If no `returnTo` → navigate to Comms Mode channel list (the new default home)

---

## Terminology

| Current (Nostr jargon) | New (plain language) |
|------------------------|---------------------|
| "Generate your keys" | (hide — done silently) |
| "Your nsec/npub" | "Your account" |
| "Choose relays" | (hide — auto-configured) |
| "Callsign" | "Name" or "Display name" |
| "Signer" | (hide — internal concept) |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/views/InviteAccept.svelte` | Pass `returnTo` with group conversation URL |
| `src/app/views/Onboarding.svelte` | Collapse to 1 screen, silent keygen, fix exit() |
| `src/app/App.svelte` or router guards | Default post-auth landing from `/notes` → Comms Mode |

---

## Verification

- [ ] Invite link → one screen → in group conversation (< 5 seconds)
- [ ] Direct visit → one screen → empty channel list with join/create buttons
- [ ] Keys generated silently (user never sees nsec during onboarding)
- [ ] Relays auto-configured (no relay selection screen)
- [ ] Key backup prompt appears 24h after first setup
- [ ] Existing Nostr identity login still works
- [ ] `returnTo` properly preserved through the entire invite → onboard → landing flow
