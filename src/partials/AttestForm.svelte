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
  export let existingAttestation: {
    method: string
    confidence: string
    scope: string
    context: string
  } | null = null

  const dispatch = createEventDispatcher<{attested: void}>()

  let method: AttestationMethod = (existingAttestation?.method as AttestationMethod) || "in-person"
  let confidence: Confidence = (existingAttestation?.confidence as Confidence) || "high"
  let scope: Scope = (existingAttestation?.scope as Scope) || "operational"
  let context = existingAttestation?.context || ""
  let setExpiry = false
  let expiryDays = 90
  let submitting = false

  const methods = Object.entries(METHOD_LABELS) as [AttestationMethod, string][]
  const confidenceLevels: Confidence[] = ["high", "medium", "low"]
  const scopeOptions: Scope[] = ["operational", "personal", "financial"]

  async function submit() {
    submitting = true
    try {
      const validUntil = setExpiry ? Math.floor(Date.now() / 1000) + expiryDays * 86400 : undefined

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
    <select
      bind:value={method}
      class="border-nc-border bg-nc-surface-2 mt-1 w-full rounded border p-1.5 text-sm">
      {#each methods as [value, label]}
        <option {value}>{label}</option>
      {/each}
    </select>
  </div>

  <div>
    <label class="text-xs font-bold uppercase text-nc-text-muted">Confidence</label>
    <div class="mt-1 flex gap-2">
      {#each confidenceLevels as level}
        <button
          type="button"
          on:click={() => (confidence = level)}
          class="rounded px-3 py-1 text-xs capitalize"
          class:bg-accent={confidence === level}
          class:text-white={confidence === level}
          class:bg-nc-surface-2={confidence !== level}>
          {level}
        </button>
      {/each}
    </div>
  </div>

  <div>
    <label class="text-xs font-bold uppercase text-nc-text-muted">Scope</label>
    <div class="mt-1 flex gap-2">
      {#each scopeOptions as s}
        <button
          type="button"
          on:click={() => (scope = s)}
          class="rounded px-3 py-1 text-xs capitalize"
          class:bg-accent={scope === s}
          class:text-white={scope === s}
          class:bg-nc-surface-2={scope !== s}>
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
      class="border-nc-border bg-nc-surface-2 mt-1 w-full rounded border p-1.5 text-sm" />
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
        class="border-nc-border bg-nc-surface-2 w-16 rounded border p-1 text-sm" />
      <span class="text-xs text-nc-text-muted">days</span>
    {/if}
  </div>

  <button
    type="submit"
    disabled={submitting}
    class="w-full rounded bg-accent py-1.5 text-sm font-medium text-white disabled:opacity-50">
    {submitting ? "Attesting..." : existingAttestation ? "Update Attestation" : "Attest"}
  </button>
</form>
