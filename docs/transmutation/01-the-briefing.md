# 01 — The Briefing

> Phase 1 Implementation Spec · Innovation 6 from [playbook.md](playbook.md)
> **Collapses:** Gap 6 (onboarding teaches nothing about security)
> **Effort:** Low · **Risk:** Minimal · **Architecture changes:** None

---

## Table of Contents

1. [Why This Matters](#why-this-matters)
2. [Current State (Exact)](#current-state-exact)
3. [Target State](#target-state)
4. [Copy Diff: Step by Step](#copy-diff-step-by-step)
5. [New Component: SecurityPosturePanel](#new-component-securityposturepanel)
6. [Integration Details](#integration-details)
7. [What Does NOT Change](#what-does-not-change)
8. [Risks and Mitigations](#risks-and-mitigations)
9. [Testing Plan](#testing-plan)
10. [Acceptance Criteria](#acceptance-criteria)

---

## Why This Matters

Every operator archetype (OVERWATCH, SWITCHBLADE, ARCHITECT) shares the same first question: **"Prove this app is secure."** The onboarding is the first 60 seconds of every operator's experience. Those 60 seconds currently say "social media signup." The operator's mental model is set before they ever see an encryption badge, a tier indicator, or a relay configuration panel.

The vision document says:
> *"The interface should make you feel like you're operating a communications system, not browsing a social app."*

The current onboarding violates this at every step. The word "post" appears 3 times. The words "secure," "encrypt," and "sovereign" appear zero times. The final destination is described as "feed."

This is not a feature gap — it's a framing failure. The onboarding tells operators that NavCom is a social app. Everything that follows is interpreted through that lens. Reframing the copy — same structure, same flow, same props — transforms the first impression from "casual social signup" to "operational briefing."

The transmutation doc says:
> *"Not a reskin, not a refactor — a transmutation."*

The Briefing is the first visible transmutation. It costs almost nothing and resets every operator's expectations.

---

## Current State (Exact)

The onboarding flow is rendered by `src/app/views/onboarding/OnboardingStageHost.svelte`, which conditionally renders 4 step components based on `currentStage`:

### Step 1: `Start.svelte`

**Current title:** "Get started"
**Current subtitle:** "Set up a Navcom key and post in under a minute. No jargon, minimal steps."
**Current "What to expect" list:**
- "We create a Navcom key for you (export anytime)." — tooltip: "We generate a private key and keep it available to you; you can download/export it later or switch to another signer whenever you want."
- "Optional: bring your own key instead." — tooltip: "If you already have an nsec or encrypted key, you can paste it and keep full custody. We'll never store it without your say-so."
- "Optional profile fields; you can skip." — tooltip mentions profiles/feeds
- "Smart defaults so your feed isn't empty." — tooltip mentions curated follows

**Step indicator:** "1/4" with tooltip "This is step 1 of 4. Your progress is saved as you go..."
**Title tooltip:** "This guided setup won't post anything yet. It just prepares your key and preferences so you can start posting smoothly afterwards."

**Problems:**
1. "Post in under a minute" — frames NavCom as a posting platform
2. "No jargon" — actively avoids operational language that would signal the app's purpose
3. "So your feed isn't empty" — social media phrasing; feeds are the assumed destination
4. "Start posting smoothly" — again, posting is the goal
5. No mention of encryption, sovereignty, or why keys matter beyond "you can export it"

### Step 2: `KeyChoice.svelte`

**Current title:** "Choose your key path"
**Current subtitle:** "Recommended: let Navcom manage your key so you can post now. Advanced: bring/import a key or use an external signer."

**Panel 1 — Managed:**
- Title: "Managed (recommended)"
- Description: "We generate and store a Navcom key. You can export it anytime."
- Tooltip: "Fastest path. We generate and store a Navcom key for you. You can export or switch to another signer anytime. Good for getting started quickly."

**Panel 2 — Import:**
- Title: "Import your key"
- Description: Paste nsec or encrypted key

**Panel 3 — External signer / NIP-07 / NIP-55:**
- Already reasonably framed (technical users choose this intentionally)

**Problems:**
1. "So you can post now" — posting is framed as the purpose of having a key
2. "Getting started quickly" — speed, not security, is the value proposition
3. No explanation of what a key IS in operational terms (your identity credential on a sovereign network)
4. No mention that the key never touches a server

### Step 3: `ProfileLite.svelte`

**Current title:** "Profile (optional)"
**Current subtitle:** "Add a handle or display name, or skip. Starter follows help you see posts immediately."
**Field labels:** "Handle (optional)" and "Display name (optional)"
**Toggle:** "Starter follows" with tooltip about curated list populating feed

**Problems:**
1. "Profile" — social media concept
2. "See posts immediately" — feed-oriented value proposition
3. "Handle" — could be operational ("callsign") but isn't framed that way
4. "Starter follows" — social graph concept; should be "network connections" or "default relay network"

### Step 4: `Complete.svelte`

**Current title:** "You're ready"
**Current subtitle:** "Posting is enabled. Defaults are applied so your feed isn't empty."
**Status rows:**
- "Relay defaults" → Applied/Pending
- "Starter follows" → Applied/Skipped
- "Backup reminder" → "We'll remind you" / "Not required"
**Button:** "Go to Navcom"

**Problems:**
1. "Posting is enabled" — posting is the endpoint
2. "Feed isn't empty" — feed is the destination
3. No security posture information — operator completes setup without knowing what's encrypted, what's visible, or what the security model is
4. "Go to Navcom" — generic; doesn't signal the transition to an operational context
5. **This is where "Prove this app is secure" should be answered, and it isn't.**

---

## Target State

Same 4 steps. Same `OnboardingStageHost.svelte` stage machine. Same component props and events. Same `currentStage` values ("start" | "key" | "profile" | "done"). Different copy. One new component.

The framing shifts from "social media registration" to "operational briefing." The step progression becomes:

```
OPERATIONAL BRIEFING → IDENTITY CREDENTIAL → OPERATOR CARD → INFRASTRUCTURE STATUS
```

---

## Copy Diff: Step by Step

### Step 1: Start → OPERATIONAL BRIEFING

| Element | Current | New |
|---------|---------|-----|
| Title | "Get started" | "Operational briefing" |
| Subtitle | "Set up a Navcom key and post in under a minute. No jargon, minimal steps." | "NavCom is a sovereign communications platform. No central server. No corporate gatekeeper. Your messages are encrypted and signed by keys only you control." |
| Title tooltip | "This guided setup won't post anything yet. It just prepares your key and preferences so you can start posting smoothly afterwards." | "This briefing prepares your identity credential and infrastructure connections. Nothing is transmitted until you choose to." |
| List header | "What to expect:" | "What happens next:" |
| List item 1 | "We create a Navcom key for you (export anytime)." | "You receive an identity credential (cryptographic key pair) — this is how the network knows you." |
| Item 1 tooltip | "We generate a private key and keep it available to you; you can download/export it later or switch to another signer whenever you want." | "A key pair is generated locally on your device. The private key never leaves your device. You can export it or replace it with your own key at any time." |
| List item 2 | "Optional: bring your own key instead." | "Optional: import your own credential if you have one." |
| Item 2 tooltip | "If you already have an nsec or encrypted key, you can paste it and keep full custody. We'll never store it without your say-so." | "If you already have a Nostr private key (nsec) or encrypted key, you can import it. Full custody remains with you." |
| List item 3 | "Optional profile fields; you can skip." | "Optional: configure your operator card (callsign, display name)." |
| Item 3 tooltip | (mentions profiles/feeds) | "Other operators will see your callsign and display name. Use operational handles, not personal names. You can change these later." |
| List item 4 | "Smart defaults so your feed isn't empty." | "Infrastructure defaults are applied so you can communicate immediately." |
| Item 4 tooltip | (mentions curated follows) | "Pre-configured relay connections ensure you can send and receive messages immediately. You can change relay configuration later in settings." |
| New item 5 | (doesn't exist) | "You will see what's protected and what's visible before you begin." |
| Item 5 tooltip | — | "Before you start operating, we'll show you exactly what's encrypted and what relay operators can observe. No surprises." |

### Step 2: KeyChoice → IDENTITY CREDENTIAL

| Element | Current | New |
|---------|---------|-----|
| Title | "Choose your key path" | "Identity credential" |
| Subtitle | "Recommended: let Navcom manage your key so you can post now. Advanced: bring/import a key or use an external signer." | "Your key pair is your identity on the network. NavCom can generate one for you, or you can bring your own." |
| Title tooltip | "Pick how you want to hold or sign with your key: quick managed, bring your own key, or use an external signer you already trust." | "Your identity credential is a cryptographic key pair. The private half proves you are you. The public half lets others verify your messages." |
| Panel 1 title | "Managed (recommended)" | "Generate new credential (recommended)" |
| Panel 1 description | "We generate and store a Navcom key. You can export it anytime." | "NavCom creates a key pair and stores it locally on this device. No server ever sees your private key. You can export it anytime." |
| Panel 1 tooltip | "Fastest path. We generate and store a Navcom key for you..." | "Generates a Nostr key pair using your device's cryptographic random number generator. The private key is stored in browser storage and never transmitted." |
| Panel 1 button | "Use recommended" | "Generate credential" |
| Panel 2 title | "Import your key" | "Import existing credential" |
| Panel 2 description | (current description about nsec) | "Paste an existing nsec or encrypted key. Full custody stays with you. NavCom stores nothing without your explicit action." |
| Bottom helper text | "Managed is fastest. Advanced options remain available." | "All credential types are equally secure. 'Generate' is fastest if you don't have an existing key." |

### Step 3: ProfileLite → OPERATOR CARD

| Element | Current | New |
|---------|---------|-----|
| Title | "Profile (optional)" | "Operator card (optional)" |
| Subtitle | "Add a handle or display name, or skip. Starter follows help you see posts immediately." | "A callsign and display name help other operators identify you. Use operational handles, not personal information." |
| Title tooltip | "Adding profile info is optional. You can skip now and edit it later in settings." | "Your operator card is visible to other operators on the network. All fields are optional and can be changed later in settings." |
| Field 1 label | "Handle (optional)" | "Callsign (optional)" |
| Field 1 tooltip | "A short name others can mention you with. Avoid sensitive info; you can change it later." | "A unique identifier other operators can use to reference you. Avoid real names or personally identifying information." |
| Field 2 label | "Display name (optional)" | "Display name (optional)" |
| Field 2 tooltip | "How your name appears in feeds. Freeform text; you can edit it anytime." | "How your name appears in messages and on the map. Freeform text; editable anytime." |
| Toggle label | "Starter follows" | "Connect to default relay network" |
| Toggle tooltip | "A short curated list so your feed isn't empty. You can unfollow any of them anytime." | "Pre-configured relay connections so you can communicate immediately. You can modify relay configuration later in settings." |

### Step 4: Complete → INFRASTRUCTURE STATUS

| Element | Current | New |
|---------|---------|-----|
| Title | "You're ready" | "Infrastructure status" |
| Subtitle | "Posting is enabled. Defaults are applied so your feed isn't empty." | "Your credential is active. Review your security posture before proceeding." |
| Title tooltip | "Posting is enabled. You can tweak relays, follows, and backups later in settings." | "Your identity credential is configured and relay connections are established. Review the status below." |
| Row 1 label | "Relay defaults" | "Relay infrastructure" |
| Row 1 tooltip | "We preloaded relays so you can read and post immediately. You can change them later in settings." | "Relay servers route your encrypted messages. These defaults ensure connectivity. Configure dedicated relays per group in settings." |
| Row 2 label | "Starter follows" | "Network connections" |
| Row 2 tooltip | "A short curated list so your feed isn't empty. You can unfollow any of them anytime." | "Initial connections to the relay network. You can modify these in settings." |
| Row 3 label | "Backup reminder" | "Credential backup" |
| Row 3 tooltip | "If you created or imported a key here, we'll remind you to export or confirm a backup so you don't lose access." | "Your private key exists only on this device. If you lose access to this device and haven't exported your key, your identity is lost permanently." |
| **NEW** | — | `SecurityPosturePanel` component (see below) |
| Button | "Go to Navcom" | "Begin operations" |

---

## New Component: SecurityPosturePanel

**File:** `src/app/views/onboarding/SecurityPosturePanel.svelte`

A collapsible panel rendering on Step 4 (Complete). Shows what's encrypted and what's observable by relay operators. Collapsed by default — the operator can expand to review.

**Why collapsed by default:** The information is available but not forced. Operators who care (ARCHITECT, security-conscious SWITCHBLADE) will expand. Operators in a hurry can proceed. The *existence* of the panel (visible placeholder with "What's Protected / What's Visible" header) signals security awareness even when collapsed.

### Component Implementation

```svelte
<script lang="ts">
  let expanded = false
</script>

<button
  class="panel mt-3 w-full cursor-pointer p-3 text-left text-nc-text"
  on:click={() => (expanded = !expanded)}>
  <div class="flex items-center justify-between">
    <span class="text-sm font-semibold uppercase tracking-wide">
      What's Protected / What's Visible
    </span>
    <i class="fa fa-chevron-{expanded ? 'up' : 'down'} text-xs" />
  </div>

  {#if expanded}
    <div class="mt-3 space-y-3 text-sm">
      <div>
        <p class="font-semibold text-success">🔒 Protected</p>
        <ul class="mt-1 list-disc space-y-1 pl-5">
          <li>Message content in encrypted groups (end-to-end, only group members can read)</li>
          <li>Your private key (never leaves this device, never transmitted to any server)</li>
          <li>Group membership details in Tier 2 groups (dedicated relay isolation)</li>
          <li>Direct message content (NIP-44 encrypted between sender and recipient)</li>
        </ul>
      </div>
      <div>
        <p class="font-semibold text-warning">👁 Visible to relay operators</p>
        <ul class="mt-1 list-disc space-y-1 pl-5">
          <li>Your public key (this is your identity on the network — by design)</li>
          <li>Which relays you connect to and when</li>
          <li>Message timestamps and approximate sizes</li>
          <li>Which relays carry which group traffic (in non-Tier-2 groups)</li>
        </ul>
      </div>
      <p class="text-nc-text-muted">
        This is the nature of relay-based networks. NavCom uses encryption to protect content
        and relay isolation (Tier 2) to limit metadata exposure.
        Configure dedicated relays per group in settings for maximum privacy.
      </p>
    </div>
  {/if}
</button>
```

**Design decisions:**
- Uses existing `panel` CSS class (consistent with other onboarding panels)
- Uses `text-success` for protected items, `text-warning` for visible items (existing color tokens)
- Uses Font Awesome chevron icons (already loaded globally)
- `<button>` element for accessibility (keyboard-focusable, screen-reader announces as interactive)
- Static content — no props, no stores, no reactive data

### Content Rationale

**Protected list — why these four items:**
1. Message content in encrypted groups — this is the headline promise
2. Private key — the most critical security property; "never leaves this device" is the key phrase
3. Tier 2 membership details — establishes the tier model's value (operators will encounter tier badges)
4. Direct message content — DMs are encrypted too (NIP-44); mentioning this covers the second common use case

**Visible list — why these four items:**
1. Public key — operators must understand this is public by design, not a failure
2. Relay connections — the most surprising metadata leak for newcomers
3. Timestamps and sizes — traffic analysis is possible even with encryption
4. Group relay association — the Tier 2 elevator pitch (metadata isolation needs dedicated relays)

**What we deliberately don't say:** We don't say "your messages are safe" or "NavCom protects you." We say exactly what is and isn't protected. The tone is informative, not reassuring. An operator who reads this panel has accurate expectations.

---

## Integration Details

### Complete.svelte Changes

Add the import and component insertion:

```svelte
<script lang="ts">
  // Existing imports...
  import SecurityPosturePanel from "src/app/views/onboarding/SecurityPosturePanel.svelte"
  // ...existing props and logic unchanged
</script>

<!-- Existing status panel (Relay infrastructure, Network connections, Credential backup) -->
<div class="panel mt-4 space-y-2 p-4 text-nc-text">
  <!-- ...existing rows... -->
</div>

<!-- NEW: Security posture panel -->
<SecurityPosturePanel />

<!-- Button row (changed label) -->
<div class="mt-4 flex flex-col gap-2 sm:flex-row">
  <Button class="btn whitespace-normal text-center" on:click={onBack}>
    <i class="fa fa-arrow-left" /> Back
  </Button>
  <Button class="btn btn-accent flex-1 whitespace-normal text-center" on:click={onFinish}>
    Begin operations  <!-- was: "Go to Navcom" -->
  </Button>
</div>
```

### Files Changed Summary

| File | Changes | Risk |
|------|---------|------|
| `src/app/views/onboarding/Start.svelte` | Text content only (~15 strings) | Minimal — no logic changes |
| `src/app/views/onboarding/KeyChoice.svelte` | Text content only (~10 strings) | Minimal — no logic changes |
| `src/app/views/onboarding/ProfileLite.svelte` | Text content + label changes (~8 strings) | Minimal — field names unchanged in data model |
| `src/app/views/onboarding/Complete.svelte` | Text content (~6 strings) + import SecurityPosturePanel + button label | Low — one new import, one new component slot |
| `src/app/views/onboarding/SecurityPosturePanel.svelte` | **NEW FILE** — ~45 lines, zero props | None — new file, no existing code affected |

### What the Data Model Sees

Nothing changes in the data model. The `handle` field is still `handle` in the store — the label change from "Handle" to "Callsign" is display-only. The `displayName` field is unchanged. The `starterFollows` boolean is unchanged. Event dispatch names (`on:managed`, `on:import`, `on:external`, etc.) are unchanged. The `OnboardingStageHost.svelte` prop surface is unchanged.

---

## What Does NOT Change

This needs to be explicit because the scope of "The Briefing" is precisely constrained:

1. **No route changes.** The onboarding route structure is unchanged.
2. **No store changes.** No new Svelte stores. No changes to existing stores.
3. **No event dispatch changes.** All `createEventDispatcher` events remain identical.
4. **No prop changes.** `OnboardingStageHost.svelte` receives the same props.
5. **No stage machine changes.** `currentStage` values ("start" | "key" | "profile" | "done") unchanged.
6. **No data model changes.** `handle`, `displayName`, `starterFollows` — all unchanged.
7. **No dependency additions.** SecurityPosturePanel uses only existing CSS classes and FA icons.
8. **No API calls.** No network requests. No relay queries.
9. **No key generation changes.** The managed/import/external key flows are unchanged.
10. **No post-onboarding navigation changes.** "Begin operations" navigates to the same destination as "Go to Navcom."

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Existing onboarding test assertions fail due to changed copy | High | Low | Update text assertions in `cypress/e2e/beta/onboarding-*.cy.ts` |
| "Operational briefing" language feels too military for some users | Medium | Low | Vision doc explicitly uses operational framing; this is the target identity |
| SecurityPosturePanel content becomes outdated as security model evolves | Low | Medium | Content is static and can be updated in-place; no reactive dependencies |
| "Callsign" label confuses non-military users | Low | Low | Tooltip explains purpose; label is supplementary to the input |
| Accessibility: collapsible panel not keyboard-accessible | Low | Medium | Using `<button>` element ensures keyboard focus and screen reader announcement |

---

## Testing Plan

### Existing Tests That Need Assertion Updates

Any `cypress/e2e/beta/onboarding-*.cy.ts` test that asserts on:
- "Get started" → now "Operational briefing"
- "Choose your key path" → now "Identity credential"
- "Profile (optional)" → now "Operator card (optional)"
- "You're ready" → now "Infrastructure status"
- "Go to Navcom" → now "Begin operations"
- "Posting is enabled" → no longer present
- "feed" → no longer present in onboarding context

### New Test: `onboarding-briefing.cy.ts`

```typescript
describe("The Briefing — Onboarding Reframe", () => {
  it("Step 1 uses operational language", () => {
    // Navigate to onboarding
    // Assert title contains "Operational briefing"
    // Assert subtitle does NOT contain "post" or "feed"
    // Assert "What happens next" list exists
    // Assert "identity credential" language present
  })

  it("Step 2 uses credential language", () => {
    // Advance to step 2
    // Assert title contains "Identity credential"
    // Assert "Generate new credential" button exists
    // Assert no mention of "posting"
  })

  it("Step 3 uses operator card language", () => {
    // Advance to step 3
    // Assert title contains "Operator card"
    // Assert "Callsign" label exists
    // Assert "Connect to default relay network" toggle exists
  })

  it("Step 4 shows infrastructure status", () => {
    // Advance to step 4
    // Assert title contains "Infrastructure status"
    // Assert "Relay infrastructure" row exists
    // Assert "Credential backup" row exists
    // Assert "Begin operations" button exists
  })

  it("SecurityPosturePanel is present and collapsed by default", () => {
    // Advance to step 4
    // Assert "What's Protected / What's Visible" header visible
    // Assert protected/visible lists NOT visible (collapsed)
  })

  it("SecurityPosturePanel expands on click", () => {
    // Advance to step 4
    // Click panel header
    // Assert "Protected" section visible with 4 items
    // Assert "Visible to relay operators" section visible with 4 items
  })

  it("No social media language in any step", () => {
    // Walk through all 4 steps
    // Assert "feed" does not appear anywhere
    // Assert "post" does not appear anywhere (except within "post-quantum" if present)
    // Assert "follow" does not appear as a social concept
  })
})
```

---

## Acceptance Criteria

1. ✅ All four step titles reflect operational framing: "Operational briefing" / "Identity credential" / "Operator card" / "Infrastructure status"
2. ✅ No mention of "posting," "feed," or social-media language in any onboarding step
3. ✅ SecurityPosturePanel renders on step 4, collapsed by default
4. ✅ Expanding SecurityPosturePanel shows Protected (4 items) and Visible (4 items) sections
5. ✅ Final button reads "Begin operations"
6. ✅ "Callsign" label replaces "Handle" in step 3
7. ✅ "Connect to default relay network" replaces "Starter follows" toggle label
8. ✅ Credential backup tooltip mentions permanent key loss risk
9. ✅ No new routes, stores, props, or navigation changes
10. ✅ Existing beta test suite (243 tests) passes after assertion updates
11. ✅ New `onboarding-briefing.cy.ts` test passes
