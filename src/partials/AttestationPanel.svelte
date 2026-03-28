<script lang="ts">
  import {
    attestationsByTarget,
    getAttestationSummary,
    getMethodLabel,
  } from "src/engine/trust/attestation"
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
      <div class="border-nc-border bg-nc-surface-2 rounded border p-2 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-medium">
            {displayProfileByPubkey(attestation.attester) || attestation.attester.slice(0, 8)}
          </span>
          <span class="text-nc-text-muted">{relativeTime(attestation.createdAt)}</span>
        </div>
        <div class="mt-1 flex items-center gap-2 text-nc-text-muted">
          <span class="bg-nc-surface-3 rounded px-1">{getMethodLabel(attestation.method)}</span>
          <span class="capitalize">{attestation.confidence}</span>
          <span>· {attestation.scope}</span>
        </div>
        {#if attestation.context}
          <p class="mt-1 italic text-nc-text-muted">"{attestation.context}"</p>
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
        <div
          class="border-nc-border/50 bg-nc-surface-2/50 mt-1 rounded border p-2 text-xs opacity-60">
          <span
            >{displayProfileByPubkey(attestation.attester) ||
              attestation.attester.slice(0, 8)}</span>
          — {getMethodLabel(attestation.method)} ({attestation.confidence}) · Expired
        </div>
      {/each}
    </details>
  {/if}
</div>
