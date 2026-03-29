# 06 — Trust Attestation Events

> Phase 4 Implementation Spec · Innovation 3 from [playbook.md](playbook.md)
> **Collapses:** Gap 6 (WoT is a number, not a judgment) + Gap 8 (map pins lack trust context)
> **Effort:** Medium · **Risk:** Medium · **Architecture changes:** New event kind usage, new derived store, WotPopover extension, map marker trust overlay

---

## Table of Contents

1. [Why Trust Attestation Exists](#why-trust-attestation-exists)
2. [The WoT Gap: Score Without Semantics](#the-wot-gap)
3. [Design Philosophy: Attestation, Not Rating](#design-philosophy)
4. [Event Structure](#event-structure)
5. [Attestation Methods](#attestation-methods)
6. [Trust Decay and Expiry](#trust-decay-and-expiry)
7. [Current State: What Already Exists](#current-state)
8. [New Files](#new-files)
9. [Modified Files](#modified-files)
10. [Store Architecture](#store-architecture)
11. [Map Marker Trust Overlay](#map-marker-trust-overlay)
12. [Board Integration](#board-integration)
13. [What Does NOT Change](#what-does-not-change)
14. [Phase Dependencies](#phase-dependencies)
15. [Risks and Mitigations](#risks-and-mitigations)
16. [Testing Plan](#testing-plan)
17. [Acceptance Criteria](#acceptance-criteria)

---

## Why Trust Attestation Exists

ARCHITECT manages three cells. Each cell has members recruited through different channels: some are long-standing colleagues vouched for in person, others were onboarded through a key-signing party, and two members joined through a referral chain ARCHITECT cannot personally verify. The WoT score for all of them is 2 — they're all two hops away in the social graph. The number tells ARCHITECT nothing about *how* they were verified or *when* that verification happened.

OVERWATCH monitors the map and sees check-in markers from 8 operators. Five of them are people OVERWATCH has met face-to-face and attested. Three are members who joined through someone else's vouching. When a critical alert comes from one of the unattested members, OVERWATCH must decide: act immediately, or verify first? The map gives no visual signal to distinguish attested from unattested markers.

The vision says: *"Trust is layered."* The current WoT system has one layer: social graph distance. Trust Attestation adds a second layer: explicit, human-declared trust with method, confidence, and temporal validity. Combined, the two layers give operators a two-dimensional trust picture:

| WoT Score | Attestation | Interpretation |
|-----------|------------|----------------|
| High | Yes | Strongly trusted: known in social graph AND explicitly attested |
| High | No | Socially known but not explicitly vouched for this context |
| Low | Yes | Attested through operational channel but not in social graph |
| Low | No | Unknown — no social proof, no attestation |

---

## The WoT Gap: Score Without Semantics {#the-wot-gap}

From `@welshman/app`:

```typescript
export declare const getUserWotScore: (tpk: string) => number
```

This function returns a number. That's all. It's the shortest path through the follow graph. It doesn't encode:
- **How** the trust was established (in-person? key exchange? referral?)
- **When** the trust was established (last week? two years ago?)
- **For what context** the trust applies (personal? operational? financial?)
- **How confident** the attester is (certain? probable? tentative?)

The existing `WotPopover.svelte` displays this score as a ring visualization. It shows the profile, the score, a help link. That's it.

The existing `src/engine/trust/` directory has:
- **Delegation certificates** (`delegation.ts`): kind-30078 events with `d=delegation` that grant permissions from one pubkey to another. Used for organizational delegation, not peer attestation.
- **Trust chain verification** (`chain.ts`): Walks operator→admin→member chain using delegation certificates. Defines `TrustLevel = "operator" | "admin" | "member" | "unknown"`.
- **Revocation cache** (`revocation.ts`): In-memory cache of kind-30078 `d=revocation` events.

Delegation certificates answer "does this person have permission?" Trust attestations answer "do I vouch for this person?"

---

## Design Philosophy: Attestation, Not Rating {#design-philosophy}

An attestation is a **declaration** — "I have verified this person through a specific method and I vouch for them with a stated confidence." It is:

1. **Explicit.** The attester consciously creates it.
2. **Attributed.** The attester's pubkey signs the event.
3. **Methodological.** The attestation states how verification was done.
4. **Temporal.** It has a creation time and an expiry.
5. **Scoped.** It applies to a specific context (operational, personal, financial).

An attestation is **not** a rating. There is no 1-5 star scale. No thumbs up/down. No aggregation into an average. The system presents attestations as individual declarations by specific people, preserving provenance.

**Why kind-30078?** NIP-78 (application-specific data) defines kind 30078 as a parameterized replaceable event. Using `d=attestation:<target-pubkey>` makes each attestation replaceable: if the attester updates their attestation of a target, the old event is replaced. The attester can have exactly one active attestation per target pubkey.

The existing codebase already uses kind-30078 for:
- App settings data (`d` varies, content encrypted)
- Delegation certificates (`d=delegation`)
- Revocation notices (`d=revocation`)

Adding `d=attestation:<pubkey>` is consistent with this pattern.

---

## Event Structure

### Attestation Event (kind 30078)

```json
{
  "kind": 30078,
  "pubkey": "<attester-pubkey>",
  "created_at": 1711152000,
  "tags": [
    ["d", "attestation:<target-pubkey>"],
    ["p", "<target-pubkey>"],
    ["method", "in-person"],
    ["confidence", "high"],
    ["scope", "operational"],
    ["valid-until", "1742688000"],
    ["context", "Verified identity at Q1 key-signing event"]
  ],
  "content": "",
  "id": "<computed>",
  "sig": "<computed>"
}
```

### Tag Definitions

| Tag | Required | Values | Description |
|-----|----------|--------|-------------|
| `d` | ✅ | `attestation:<target-pubkey>` | NIP-78 d-tag. Makes event replaceable per attester-target pair. |
| `p` | ✅ | `<target-pubkey>` | The pubkey being attested. Enables relay filtering by `#p`. |
| `method` | ✅ | See [methods table](#attestation-methods) | How the verification was performed. |
| `confidence` | ✅ | `"high"` \| `"medium"` \| `"low"` | Attester's confidence in the identity claim. |
| `scope` | ✅ | `"operational"` \| `"personal"` \| `"financial"` | Context in which this attestation applies. |
| `valid-until` | ❌ | Unix timestamp (seconds) | Expiry time. If absent, attestation does not expire. |
| `context` | ❌ | Free text (max 280 chars) | Human-readable note about the attestation circumstance. |

### D-tag Design

The d-tag `attestation:<target-pubkey>` encodes:
- The purpose prefix (`attestation:`) — distinguishes from delegation/revocation/app-data events
- The target pubkey — ensures one attestation per attester per target

Because kind-30078 is parameterized replaceable, the latest event with a given `d` tag from a given `pubkey` replaces all previous ones. This means:
- Attestations are updatable (change confidence, method, expiry)
- Attestations are retractable (publish replacement with past `valid-until` or empty content)
- Only one active attestation per (attester, target) pair

---

## Attestation Methods

| Method ID | Label | Description | Confidence Guidance |
|-----------|-------|-------------|-------------------|
| `in-person` | In Person | Identity verified face-to-face | High |
| `key-exchange` | Key Exchange | Public key verified via secure key exchange (NIP-05, keybase, QR scan) | High |
| `video-call` | Video Call | Identity verified via live video | Medium-High |
| `voice-call` | Voice Call | Identity verified via voice recognition | Medium |
| `referral` | Referral | Vouched for by another attested member | Medium (depends on referrer) |
| `organizational` | Organizational | Member of a known organization or group | Medium |
| `long-standing` | Long Standing | Known through extended online interaction without formal verification | Low-Medium |
| `self-declared` | Self Declared | Target claims identity without independent verification | Low |

The method is a tag value, not a controlled enum in the protocol. Any string is valid as a method value. The methods above are the recommended vocabulary. UI shows the label for known methods and the raw string for unknown methods.

---

## Trust Decay and Expiry

### Expiry Semantics

If `valid-until` tag is present:
- Before expiry: attestation is **active** — displayed normally
- After expiry: attestation is **expired** — displayed with "Expired" label, dimmed, not counted as active attestation
- No expiry tag: attestation is **permanent** — no decay, remains active indefinitely

### Decay and Staleness (Enhancement)

Beyond hard expiry, attestations grow stale over time. A 2-year-old "in-person" verification carries less certainty than a 2-week-old one. The system can display age:

| Age | Label | Visual |
|-----|-------|--------|
| < 30 days | Fresh | Full opacity |
| 30-180 days | Aging | 80% opacity |
| 180-365 days | Stale | 60% opacity |
| > 365 days | Old | 50% opacity, "Consider re-attesting" prompt |

Decay is purely visual — it doesn't invalidate the attestation. The operator decides whether to re-attest.

---

## Current State: What Already Exists {#current-state}

### WoT System (from @welshman/app)

```typescript
// Social graph distance — number of hops through follows
getUserWotScore(pubkey: string): number

// Maximum score across all known pubkeys (for normalization)
maxWot: Readable<number>
```

- `WotPopover.svelte`: Profile popup with WoT ring, name, bio, npub, zap button
- `WotScore.svelte`: SVG donut ring, proportional to score/max

### Trust Engine (src/engine/trust/)

```typescript
// delegation.ts
buildDelegationEvent(params): UnsignedEvent    // kind 30078, d=delegation
buildRevocationEvent(params): UnsignedEvent     // kind 30078, d=revocation
validateDelegationEvent(event): ValidationResult

// chain.ts
type TrustLevel = "operator" | "admin" | "member" | "unknown"
type DelegationCertificate = {
  id: string; from: string; to: string;
  permissions: string[]; validUntil: number; raw: TrustedEvent
}
verifyTrustChain(target, projections): TrustChainResult
parseDelegationCertificate(event): DelegationCertificate | null

// revocation.ts
ingestRevocations(events): void
isRevoked(pubkey): boolean
isCertificateRevoked(certId): boolean
```

### Map Marker System

```typescript
// marker-derivation.ts
const MARKER_STYLES: Record<ChannelMarker["type"], {icon: string; color: string; cssClass: string}> = {
  "check-in": {icon: "📍", color: "#22c55e", cssClass: "marker-checkin"},
  alert:      {icon: "🚨", color: "#ef4444", cssClass: "marker-alert"},
  sitrep:     {icon: "📋", color: "#f59e0b", cssClass: "marker-sitrep"},
  spotrep:    {icon: "📌", color: "#22d3ee", cssClass: "marker-spotrep"},
  message:    {icon: "•",  color: "#9ca3af", cssClass: "marker-message"},
}
```

No trust dimension. No opacity variation. No border/ring distinction between attested and unattested markers.

### deriveEvents Pattern

```typescript
// From @welshman/app
import {deriveEvents} from "@welshman/app"

// Usage pattern (from groups/state.ts):
const groupEvents = deriveEvents({repository, filters: [{kinds: groupKinds}], includeDeleted: true})
```

Returns a readable Svelte store of `TrustedEvent[]` matching the filter. Reactive — updates as new events arrive from relays. This is how we'll derive attestation events.

---

## New Files

### `src/engine/trust/attestation.ts` — Attestation Store and Functions

```typescript
import {derived, type Readable} from "svelte/store"
import {deriveEvents, repository} from "@welshman/app"
import type {TrustedEvent} from "@welshman/util"

// ── Types ──────────────────────────────────────────────────

export type AttestationMethod =
  | "in-person"
  | "key-exchange"
  | "video-call"
  | "voice-call"
  | "referral"
  | "organizational"
  | "long-standing"
  | "self-declared"
  | string  // arbitrary method strings accepted

export type Confidence = "high" | "medium" | "low"
export type Scope = "operational" | "personal" | "financial"

export type Attestation = {
  id: string                // Event ID
  attester: string          // Pubkey of the person who created the attestation
  target: string            // Pubkey being attested
  method: AttestationMethod
  confidence: Confidence
  scope: Scope
  createdAt: number         // Unix timestamp
  validUntil: number | null // Unix timestamp or null for no expiry
  context: string           // Free-text attestation note
  expired: boolean          // Computed: validUntil < now
  raw: TrustedEvent         // The original Nostr event
}

export type AttestationSummary = {
  pubkey: string
  attestations: Attestation[]     // All active (non-expired) attestations for this pubkey
  expiredAttestations: Attestation[] // Expired attestations
  highestConfidence: Confidence | null  // Max confidence among active attestations
  isAttested: boolean              // At least one active attestation exists
  methods: AttestationMethod[]     // Unique methods used
}

// ── Method Labels ──────────────────────────────────────────

export const METHOD_LABELS: Record<string, string> = {
  "in-person": "In Person",
  "key-exchange": "Key Exchange",
  "video-call": "Video Call",
  "voice-call": "Voice Call",
  "referral": "Referral",
  "organizational": "Organizational",
  "long-standing": "Long Standing",
  "self-declared": "Self Declared",
}

export const getMethodLabel = (method: string): string =>
  METHOD_LABELS[method] || method

// ── Event Parser ───────────────────────────────────────────

const ATTESTATION_D_PREFIX = "attestation:"

export const isAttestationEvent = (event: TrustedEvent): boolean => {
  if (event.kind !== 30078) return false
  const dTag = event.tags.find(t => t[0] === "d")?.[1]
  return dTag?.startsWith(ATTESTATION_D_PREFIX) ?? false
}

const getTag = (event: TrustedEvent, name: string): string | undefined =>
  event.tags.find(t => t[0] === name)?.[1]

export const parseAttestation = (event: TrustedEvent): Attestation | null => {
  if (!isAttestationEvent(event)) return null

  const dTag = getTag(event, "d")
  const target = dTag?.slice(ATTESTATION_D_PREFIX.length)
  const pTag = getTag(event, "p")

  // Validate target pubkey consistency
  if (!target || (pTag && pTag !== target)) return null

  const method = getTag(event, "method") || "self-declared"
  const confidence = getTag(event, "confidence") as Confidence || "low"
  const scope = getTag(event, "scope") as Scope || "operational"
  const validUntilStr = getTag(event, "valid-until")
  const validUntil = validUntilStr ? parseInt(validUntilStr, 10) : null
  const context = getTag(event, "context") || ""

  const now = Math.floor(Date.now() / 1000)
  const expired = validUntil !== null && validUntil < now

  return {
    id: event.id,
    attester: event.pubkey,
    target,
    method,
    confidence,
    scope,
    createdAt: event.created_at,
    validUntil,
    context,
    expired,
    raw: event,
  }
}

// ── Derived Store ──────────────────────────────────────────

/**
 * All attestation events from the repository.
 *
 * Uses deriveEvents with kind 30078 filter. The d-tag prefix filtering
 * happens in parseAttestation (after delivery), not in the relay filter,
 * because NIP-78 d-tags can't be partial-matched in relay filters.
 *
 * To subscribe to attestations for people in your groups, the relay request
 * should filter by #p tags for known pubkeys.
 */
const attestationEvents = deriveEvents({
  repository,
  filters: [{kinds: [30078]}],
})

/**
 * Parsed attestations by target pubkey.
 *
 * Map<targetPubkey, Attestation[]> — all attestations (active + expired)
 * for each target. Sorted by createdAt descending (newest first).
 */
export const attestationsByTarget: Readable<Map<string, Attestation[]>> = derived(
  attestationEvents,
  $events => {
    const result = new Map<string, Attestation[]>()

    for (const event of $events) {
      const attestation = parseAttestation(event)
      if (!attestation) continue

      const existing = result.get(attestation.target) || []
      existing.push(attestation)
      result.set(attestation.target, existing)
    }

    // Sort each target's attestations by createdAt desc
    for (const [, attestations] of result) {
      attestations.sort((a, b) => b.createdAt - a.createdAt)
    }

    return result
  },
)

// ── Helpers ────────────────────────────────────────────────

/**
 * Get the attestation summary for a specific pubkey.
 */
export const getAttestationSummary = (
  attestations: Map<string, Attestation[]>,
  pubkey: string,
): AttestationSummary => {
  const all = attestations.get(pubkey) || []
  const active = all.filter(a => !a.expired)
  const expired = all.filter(a => a.expired)

  const confidenceOrder: Record<Confidence, number> = {high: 3, medium: 2, low: 1}
  const highestConfidence = active.length > 0
    ? active.reduce((best, a) =>
        confidenceOrder[a.confidence] > confidenceOrder[best.confidence] ? a : best
      ).confidence
    : null

  return {
    pubkey,
    attestations: active,
    expiredAttestations: expired,
    highestConfidence,
    isAttested: active.length > 0,
    methods: [...new Set(active.map(a => a.method))],
  }
}

/**
 * Check if a pubkey has at least one active attestation from anyone.
 */
export const isAttested = (
  attestations: Map<string, Attestation[]>,
  pubkey: string,
): boolean => {
  const all = attestations.get(pubkey) || []
  return all.some(a => !a.expired)
}

// ── Event Builder ──────────────────────────────────────────

/**
 * Build an unsigned attestation event template.
 * Caller passes to signAndPublish().
 */
export const buildAttestationTemplate = ({
  target,
  method,
  confidence,
  scope,
  validUntil,
  context,
}: {
  target: string
  method: AttestationMethod
  confidence: Confidence
  scope: Scope
  validUntil?: number
  context?: string
}) => ({
  kind: 30078,
  tags: [
    ["d", `attestation:${target}`],
    ["p", target],
    ["method", method],
    ["confidence", confidence],
    ["scope", scope],
    ...(validUntil ? [["valid-until", String(validUntil)]] : []),
    ...(context ? [["context", context.slice(0, 280)]] : []),
  ],
  content: "",
})
```

### `src/partials/AttestationBadge.svelte` — Trust Badge for Profiles

```svelte
<script lang="ts">
  import {attestationsByTarget, getAttestationSummary, type AttestationSummary} from "src/engine/trust/attestation"

  export let pubkey: string
  export let showCount = false

  $: summary = getAttestationSummary($attestationsByTarget, pubkey)

  const confidenceColors: Record<string, string> = {
    high: "text-success",
    medium: "text-warning",
    low: "text-nc-text-muted",
  }
</script>

{#if summary.isAttested}
  <span
    class="inline-flex items-center gap-0.5 text-xs {confidenceColors[summary.highestConfidence || 'low']}"
    title="{summary.attestations.length} attestation(s) — highest confidence: {summary.highestConfidence}"
  >
    <span>✦</span>
    {#if showCount}
      <span>{summary.attestations.length}</span>
    {/if}
  </span>
{/if}
```

### `src/partials/AttestationPanel.svelte` — Detailed Attestation List

```svelte
<script lang="ts">
  import {attestationsByTarget, getAttestationSummary, getMethodLabel} from "src/engine/trust/attestation"
  import {displayProfileByPubkey} from "@welshman/app"

  export let pubkey: string

  $: summary = getAttestationSummary($attestationsByTarget, pubkey)

  function relativeTime(ts: number): string {
    const diff = Math.floor(Date.now() / 1000) - ts
    if (diff < 86400) return "today"
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return `${Math.floor(diff / 604800)}w ago`
  }
</script>

<div class="space-y-2">
  {#if summary.attestations.length > 0}
    <h4 class="text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">
      Attestations ({summary.attestations.length})
    </h4>
    {#each summary.attestations as attestation}
      <div class="rounded border border-nc-border bg-nc-surface-2 p-2 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-medium">
            {$displayProfileByPubkey(attestation.attester)?.name || attestation.attester.slice(0, 8)}
          </span>
          <span class="text-nc-text-muted">{relativeTime(attestation.createdAt)}</span>
        </div>
        <div class="mt-1 flex items-center gap-2 text-nc-text-muted">
          <span class="rounded bg-nc-surface-3 px-1">{getMethodLabel(attestation.method)}</span>
          <span class="capitalize">{attestation.confidence}</span>
          <span>· {attestation.scope}</span>
        </div>
        {#if attestation.context}
          <p class="mt-1 text-nc-text-muted italic">"{attestation.context}"</p>
        {/if}
        {#if attestation.validUntil}
          <p class="mt-1 text-[10px] {attestation.expired ? 'text-danger' : 'text-nc-text-muted'}">
            {attestation.expired ? "Expired" : `Expires ${relativeTime(attestation.validUntil)}`}
          </p>
        {/if}
      </div>
    {/each}
  {:else}
    <p class="text-xs text-nc-text-muted">No attestations for this person.</p>
  {/if}

  {#if summary.expiredAttestations.length > 0}
    <details class="mt-2">
      <summary class="cursor-pointer text-[10px] text-nc-text-muted">
        {summary.expiredAttestations.length} expired attestation(s)
      </summary>
      {#each summary.expiredAttestations as attestation}
        <div class="mt-1 rounded border border-nc-border/50 bg-nc-surface-2/50 p-2 text-xs opacity-60">
          <span>{$displayProfileByPubkey(attestation.attester)?.name || attestation.attester.slice(0, 8)}</span>
          — {getMethodLabel(attestation.method)} ({attestation.confidence})
          · Expired
        </div>
      {/each}
    </details>
  {/if}
</div>
```

### `src/partials/AttestForm.svelte` — Create/Update Attestation UI

```svelte
<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import {
    buildAttestationTemplate,
    METHOD_LABELS,
    type AttestationMethod,
    type Confidence,
    type Scope,
  } from "src/engine/trust/attestation"
  import {signAndPublish} from "src/engine"

  export let targetPubkey: string
  export let existingAttestation: {method: string; confidence: string; scope: string; context: string} | null = null

  const dispatch = createEventDispatcher<{attested: void}>()

  let method: AttestationMethod = (existingAttestation?.method as AttestationMethod) || "in-person"
  let confidence: Confidence = (existingAttestation?.confidence as Confidence) || "high"
  let scope: Scope = (existingAttestation?.scope as Scope) || "operational"
  let context = existingAttestation?.context || ""
  let setExpiry = false
  let expiryDays = 90
  let submitting = false

  const methods = Object.entries(METHOD_LABELS) as [AttestationMethod, string][]

  async function submit() {
    submitting = true
    try {
      const validUntil = setExpiry
        ? Math.floor(Date.now() / 1000) + expiryDays * 86400
        : undefined

      const template = buildAttestationTemplate({
        target: targetPubkey,
        method,
        confidence,
        scope,
        validUntil,
        context: context.trim(),
      })

      await signAndPublish(template)
      dispatch("attested")
    } finally {
      submitting = false
    }
  }
</script>

<form on:submit|preventDefault={submit} class="space-y-3 text-sm">
  <div>
    <label class="text-xs font-bold uppercase text-nc-text-muted">Verification Method</label>
    <select bind:value={method} class="mt-1 w-full rounded border border-nc-border bg-nc-surface-2 p-1.5 text-sm">
      {#each methods as [value, label]}
        <option {value}>{label}</option>
      {/each}
    </select>
  </div>

  <div>
    <label class="text-xs font-bold uppercase text-nc-text-muted">Confidence</label>
    <div class="mt-1 flex gap-2">
      {#each ["high", "medium", "low"] as level}
        <button
          type="button"
          on:click={() => confidence = level}
          class="rounded px-3 py-1 text-xs capitalize"
          class:bg-accent={confidence === level}
          class:text-white={confidence === level}
          class:bg-nc-surface-2={confidence !== level}
        >
          {level}
        </button>
      {/each}
    </div>
  </div>

  <div>
    <label class="text-xs font-bold uppercase text-nc-text-muted">Scope</label>
    <div class="mt-1 flex gap-2">
      {#each ["operational", "personal", "financial"] as s}
        <button
          type="button"
          on:click={() => scope = s}
          class="rounded px-3 py-1 text-xs capitalize"
          class:bg-accent={scope === s}
          class:text-white={scope === s}
          class:bg-nc-surface-2={scope !== s}
        >
          {s}
        </button>
      {/each}
    </div>
  </div>

  <div>
    <label class="text-xs font-bold uppercase text-nc-text-muted">Context (optional)</label>
    <input
      type="text"
      bind:value={context}
      maxlength="280"
      placeholder="e.g., Verified at Q1 key-signing event"
      class="mt-1 w-full rounded border border-nc-border bg-nc-surface-2 p-1.5 text-sm"
    />
  </div>

  <div class="flex items-center gap-2">
    <input type="checkbox" bind:checked={setExpiry} id="set-expiry" />
    <label for="set-expiry" class="text-xs">Set expiry</label>
    {#if setExpiry}
      <input
        type="number"
        bind:value={expiryDays}
        min="1"
        max="365"
        class="w-16 rounded border border-nc-border bg-nc-surface-2 p-1 text-sm"
      />
      <span class="text-xs text-nc-text-muted">days</span>
    {/if}
  </div>

  <button
    type="submit"
    disabled={submitting}
    class="w-full rounded bg-accent py-1.5 text-sm font-medium text-white disabled:opacity-50"
  >
    {submitting ? "Attesting..." : existingAttestation ? "Update Attestation" : "Attest"}
  </button>
</form>
```

---

## Modified Files

### `src/app/shared/WotPopover.svelte` — Extend with Attestation Section

Add attestation badge and panel to the existing WoT popover:

```svelte
<script>
  // Add imports:
  import AttestationBadge from "src/partials/AttestationBadge.svelte"
  import AttestationPanel from "src/partials/AttestationPanel.svelte"
  import AttestForm from "src/partials/AttestForm.svelte"
  import {attestationsByTarget, getAttestationSummary} from "src/engine/trust/attestation"

  // Add reactive:
  $: attestSummary = getAttestationSummary($attestationsByTarget, pubkey)
  let showAttestForm = false
</script>

<!-- In the trigger slot (alongside WotScore ring): -->
<AttestationBadge {pubkey} />

<!-- In the tooltip slot (after existing WoT score section): -->
<div class="mt-2 border-t border-nc-border pt-2">
  <AttestationPanel {pubkey} />
  {#if pubkey !== $session?.pubkey}
    <button
      on:click={() => showAttestForm = !showAttestForm}
      class="mt-2 text-xs text-accent hover:underline"
    >
      {showAttestForm ? "Cancel" : attestSummary.isAttested ? "Update attestation" : "Attest this person"}
    </button>
    {#if showAttestForm}
      <div class="mt-2">
        <AttestForm targetPubkey={pubkey} on:attested={() => showAttestForm = false} />
      </div>
    {/if}
  {/if}
</div>
```

### `src/app/views/marker-derivation.ts` — Add Trust Dimension to Markers

Extend `ChannelMarker` type with attestation status:

```typescript
// Add to ChannelMarker:
export interface ChannelMarker {
  // ...existing fields...
  attested: boolean       // Whether the author has at least one active attestation
}
```

In `deriveMarkers()`, accept an attestation lookup parameter:

```typescript
export function deriveMarkers(
  messages: TrustedEvent[],
  attestationMap?: Map<string, Attestation[]>,
): ChannelMarker[] {
  return messages
    .filter(e => /* has location tag */)
    .map(e => ({
      // ...existing mapping...
      attested: attestationMap
        ? (attestationMap.get(e.pubkey) || []).some(a => !a.expired)
        : false,
    }))
}
```

### `src/app/views/MapView.svelte` — Render Trust Overlay on Markers

In `syncMarkers()`, use the `attested` field to differentiate marker rendering:

```typescript
// In the marker creation loop:
const markerStyle = MARKER_STYLES[marker.type]
const opacity = marker.attested ? 1.0 : 0.5
const borderStyle = marker.attested
  ? "border: 2px solid rgba(34,197,94,0.8)"   // Green solid border
  : "border: 2px dashed rgba(156,163,175,0.6)" // Gray dashed border

const icon = L.divIcon({
  className: "navcom-marker-icon",
  html: `<div class="navcom-marker-shell" style="
    background: ${markerStyle.color};
    opacity: ${opacity};
    ${borderStyle};
  ">${markerStyle.icon}</div>`,
  iconSize: [28, 28],
})
```

Visual result:
- **Attested marker:** Full opacity, solid green border ring
- **Unattested marker:** 50% opacity, dashed gray border

OVERWATCH can now visually distinguish attested from unattested markers at a glance.

### `src/engine/requests.ts` — Request Attestation Events

Add attestation event filters to the relay subscription:

```typescript
// When loading group members, also request their attestation events
// Alongside existing group event requests, add:
{kinds: [30078], "#p": memberPubkeys}
```

This fetches attestation events for known group members from relays. The `#p` filter ensures we only get attestations relevant to operators we know about.

---

## Store Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Relays → repository (in-memory event cache)                     │
│  ↓                                                               │
│  deriveEvents({kinds: [30078]}) → attestationEvents (auto-filter)│
│  ↓                                                               │
│  attestationsByTarget (derived Map<pubkey, Attestation[]>)       │
│  ├→ AttestationBadge (✦ icon per pubkey)                         │
│  ├→ AttestationPanel (detailed list in WotPopover)               │
│  ├→ isAttested() → ChannelMarker.attested → map marker opacity   │
│  └→ Trust Overview tile (Board, Phase 4)                         │
│                                                                   │
│  buildAttestationTemplate() → signAndPublish() → relay publish   │
│  ↓                                                               │
│  repository receives own event → attestationsByTarget updates    │
└─────────────────────────────────────────────────────────────────┘
```

### Filter Efficiency

The `deriveEvents({kinds: [30078]})` filter returns ALL kind-30078 events (app data, delegations, revocations, attestations). The `parseAttestation()` function filters to attestations only (d-tag prefix check). This is consistent with how the existing delegation system works — `parseDelegationCertificate()` filters kind-30078 events to delegations.

At scale, if the repository contains many kind-30078 events, the attestation parsing iteration is O(n) per derivation. For typical group sizes (10-100 members, each with 0-5 attestations), this is negligible.

---

## Map Marker Trust Overlay

### Visual Specification

| Author attestation | Marker opacity | Marker border | Popup indicator |
|-------------------|---------------|---------------|-----------------|
| ≥1 active attestation (any confidence) | 1.0 (full) | 2px solid green | ✦ Attested |
| 0 active attestations | 0.5 (half) | 2px dashed gray | No badge |
| ≥1 expired, 0 active | 0.6 (dim) | 2px dashed amber | ⚠ Attestation expired |

### Why Opacity

Opacity is a pre-attentive visual variable — the human eye detects opacity differences effortlessly without reading labels. OVERWATCH scanning a map with 50 markers can instantly distinguish the sharp, fully opaque markers (attested) from the faded, half-transparent ones (unattested). No cognitive load.

### Popup Extension

When clicking a marker, the popup shows the existing preview content plus attestation status:

```html
<div class="navcom-popup-shell">
  <div>📍 Check-in from Alice</div>
  <div>3 minutes ago</div>
  <div>✦ Attested (In Person, High confidence)</div>  <!-- NEW -->
</div>
```

Or for unattested:

```html
<div class="navcom-popup-shell">
  <div>🚨 Alert from Unknown-3f2a</div>
  <div>12 minutes ago</div>
  <div style="opacity:0.6">Not attested</div>  <!-- NEW -->
</div>
```

---

## Board Integration

### Trust Overview Tile (Board, Phase 4)

The Board (Phase 3) supports adding tiles via the Tile Picker. Phase 4 adds one new tile type:

```typescript
// Add to TILE_REGISTRY in board-state.ts:
"trust-overview": {
  name: "Trust Overview",
  icon: "✦",
  description: "Attestation summary: attested vs unattested members, recent attestations",
}

// Add to TileType:
| "trust-overview"
```

### `src/app/board/tiles/TrustOverviewTile.svelte`

```svelte
<script lang="ts">
  import {attestationsByTarget, getAttestationSummary} from "src/engine/trust/attestation"
  import {groupProjections} from "src/app/groups/state"

  // Compute attestation coverage across all groups
  $: allMembers = (() => {
    const members = new Set<string>()
    for (const [, proj] of $groupProjections) {
      for (const pubkey of Object.keys(proj.members)) {
        members.add(pubkey)
      }
    }
    return [...members]
  })()

  $: attested = allMembers.filter(pk =>
    getAttestationSummary($attestationsByTarget, pk).isAttested
  )

  $: unattested = allMembers.filter(pk =>
    !getAttestationSummary($attestationsByTarget, pk).isAttested
  )

  $: recentAttestations = (() => {
    const all: Array<{attester: string; target: string; method: string; createdAt: number}> = []
    for (const [, attestations] of $attestationsByTarget) {
      for (const a of attestations) {
        if (!a.expired) all.push(a)
      }
    }
    return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
  })()
</script>

<div class="flex h-full flex-col p-2 text-xs">
  <h4 class="text-[10px] font-bold uppercase tracking-widest text-nc-text-muted">Trust</h4>
  <div class="mt-2 flex gap-4">
    <div>
      <span class="text-lg font-bold text-success">{attested.length}</span>
      <span class="text-nc-text-muted"> attested</span>
    </div>
    <div>
      <span class="text-lg font-bold text-nc-text-muted">{unattested.length}</span>
      <span class="text-nc-text-muted"> unattested</span>
    </div>
  </div>
  {#if recentAttestations.length > 0}
    <div class="mt-2">
      <p class="text-[10px] font-bold uppercase text-nc-text-muted">Recent</p>
      {#each recentAttestations as a}
        <p class="truncate text-nc-text-muted">✦ {a.method} — {a.target.slice(0, 8)}</p>
      {/each}
    </div>
  {/if}
</div>
```

---

## What Does NOT Change

1. **WoT score system is unchanged.** `getUserWotScore()` continues to return social graph distance. Attestation is additive, not a replacement.
2. **WotScore.svelte ring is unchanged.** The SVG donut still shows the WoT score. Attestation shows alongside it, not inside it.
3. **Delegation system is unchanged.** `src/engine/trust/delegation.ts` and `chain.ts` continue to handle permission delegation. Attestation is a peer attestation system, not permission delegation.
4. **Kind 30078 usage for app data is unchanged.** `setAppData()` continues to use kind 30078 with non-attestation d-tags.
5. **Group membership is unchanged.** Attestation doesn't gate group membership. An unattested member can still participate fully.
6. **Publishing pipeline is unchanged.** `signAndPublish()` handles attestation events like any other event.
7. **No new relay subscriptions beyond member attestation loading.** The `#p` filter piggybacks on existing member loading.
8. **Marker derivation core logic is unchanged.** `deriveMarkers()` gains an optional parameter; existing callers without it continue to work (attestation defaults to `false`).
9. **MARKER_STYLES is unchanged.** The color/icon per message type is preserved. Trust is an orthogonal visual layer (opacity + border).
10. **Tier policy is unchanged.** Attestation is informational, not a policy gate.

---

## Phase Dependencies

### What earlier phases provide to Trust Attestation

- **02-Presence-from-Publishing:** Presence + attestation = two-dimensional trust picture. "This person is attested AND active" vs "This person is attested but cold." PresenceBadge + AttestationBadge together on member lists.

- **04-Sovereign-Mode:** Attestation events created in Sovereign Mode are queued and published on reconnect. The `created_at` timestamp reflects signing time (when the operator made the attestation), preserving temporal accuracy.

- **05-The-Board:** The Trust Overview tile integrates attestation data into the configurable dashboard. The Board's tile extensibility means adding the trust tile requires one component + one registry entry.

### What Trust Attestation provides to potential future work

- **Attestation-based marker filtering:** MAP mode could add a layer toggle: "Show only attested markers." This filters `markers.filter(m => m.attested)`.
- **Group-level trust scores:** Compute "attestation coverage" per group: what percentage of members are attested? Display in GroupStatusTile.
- **Trust requirements:** A future Tier 3 could require all members to be attested by at least one existing member before joining.

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Kind 30078 filter returns many non-attestation events → slow parsing | Medium | Low | `isAttestationEvent()` check is cheap (kind + d-tag prefix). Only matching events are fully parsed. |
| Attestation spam (malicious actors publishing fake attestations) | Low | Medium | Attestations are attributed (signed by attester). UI shows attester identity. WoT score of attester provides meta-trust. |
| Privacy: attestation events reveal social graph connections | Medium | Medium | Attestation events are public kind-30078 events. Operators must understand that attesting someone reveals a connection. Include privacy note in AttestForm. |
| `deriveMarkers` API change breaks existing callers | Low | Medium | `attestationMap` parameter is optional with default behavior. No existing caller breaks. |
| Opacity rendering on map looks bad on certain tile sets | Low | Low | Tested with street/satellite/terrain tile sets. Green border provides secondary signal beyond opacity. |
| Trust Overview tile overwhelms small Board layouts | Low | Low | Tile is 1×1 by default (small). Can be hidden or resized. |
| Attestation events not fetched for non-group-member pubkeys | Medium | Low | `#p` filter scoped to known pubkeys. Markers from unknown pubkeys show as unattested (conservative default). |

---

## Testing Plan

### Unit Tests (Vitest) — `tests/unit/engine/trust/attestation.spec.ts`

```typescript
describe("engine/trust/attestation", () => {
  describe("isAttestationEvent", () => {
    it("returns true for kind 30078 with d=attestation: prefix")
    it("returns false for kind 30078 with d=delegation prefix")
    it("returns false for non-30078 kinds")
  })

  describe("parseAttestation", () => {
    it("parses valid attestation event into Attestation object")
    it("returns null for delegation events")
    it("returns null for events with mismatched d-tag and p-tag")
    it("marks expired attestations correctly")
    it("handles missing optional tags (validUntil, context)")
    it("defaults confidence to 'low' when missing")
    it("defaults method to 'self-declared' when missing")
  })

  describe("getAttestationSummary", () => {
    it("returns isAttested=true when active attestations exist")
    it("returns isAttested=false when only expired attestations exist")
    it("computes highestConfidence correctly")
    it("collects unique methods")
    it("returns empty summary for unknown pubkey")
  })

  describe("buildAttestationTemplate", () => {
    it("builds kind 30078 event with correct d-tag")
    it("includes p-tag matching target")
    it("omits valid-until when not provided")
    it("truncates context to 280 chars")
  })
})
```

### Cypress E2E — `trust-attestation.cy.ts`

```typescript
describe("Trust Attestation", () => {
  it("WotPopover shows attestation section", () => {
    // Hover over a member to show WotPopover
    // Assert "Attestations" heading visible
    // Assert "Attest this person" button visible
  })

  it("can create an attestation via AttestForm", () => {
    // Open WotPopover for a member
    // Click "Attest this person"
    // Fill form: method=in-person, confidence=high, scope=operational
    // Submit
    // Assert AttestationBadge (✦) appears
  })

  it("map markers differentiate attested from unattested", () => {
    // Navigate to MAP mode
    // Assert attested markers have full opacity
    // Assert unattested markers have reduced opacity
  })

  it("attestation badge appears on attested members in member lists", () => {
    // Navigate to OPS mode
    // Assert ✦ badge next to attested members
    // Assert no badge next to unattested members
  })

  it("does not show Attest button for own pubkey", () => {
    // Open WotPopover for self
    // Assert "Attest this person" button NOT visible
  })
})
```

---

## Acceptance Criteria

1. ✅ `attestation.ts` module in `src/engine/trust/` with types, parser, store, builder
2. ✅ `attestationsByTarget` derived store from `deriveEvents({kinds: [30078]})`
3. ✅ `parseAttestation()` correctly parses kind-30078 events with `d=attestation:` prefix
4. ✅ `buildAttestationTemplate()` creates correct unsigned event
5. ✅ `AttestationBadge.svelte` shows ✦ for attested pubkeys
6. ✅ `AttestationPanel.svelte` lists all attestations with method, confidence, scope, context
7. ✅ `AttestForm.svelte` allows creating/updating attestations via `signAndPublish()`
8. ✅ `WotPopover.svelte` extended with attestation section (badge + panel + form)
9. ✅ `ChannelMarker.attested` field added to marker type
10. ✅ Map markers render with trust overlay: full opacity + green border (attested) vs 50% opacity + dashed gray (unattested)
11. ✅ Marker popups show attestation status
12. ✅ `TrustOverviewTile.svelte` shows attested/unattested counts and recent attestations
13. ✅ Trust Overview tile added to `TILE_REGISTRY`
14. ✅ Relay subscriptions include `{kinds: [30078], "#p": memberPubkeys}` for attestation loading
15. ✅ Delegation system (`delegation.ts`, `chain.ts`, `revocation.ts`) unchanged
16. ✅ WoT score system unchanged
17. ✅ Existing beta test suite passes
18. ✅ Unit tests for attestation parsing, summary, and template building pass
19. ✅ Cypress trust-attestation spec passes
