<script lang="ts">
  import {attestationsByTarget, getAttestationSummary} from "src/engine/trust/attestation"

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
    class="inline-flex items-center gap-0.5 text-xs {confidenceColors[
      summary.highestConfidence || 'low'
    ]}"
    title="{summary.attestations
      .length} attestation(s) — highest confidence: {summary.highestConfidence}">
    <span>✦</span>
    {#if showCount}
      <span>{summary.attestations.length}</span>
    {/if}
  </span>
{/if}
