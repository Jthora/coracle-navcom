<!--
  SitrepCard.svelte — Rendered SITREP message card in the conversation feed.
-->

<script lang="ts">
  import {formatTimestamp} from "@welshman/lib"

  export let message: {pubkey: string; content: string; tags: string[][]; created_at: number}

  $: severity = message.tags.find(t => t[0] === "severity")?.[1] || "routine"
  $: location = message.tags.find(t => t[0] === "location")?.[1] || null
  $: borderColor =
    severity === "urgent"
      ? "border-red-600"
      : severity === "important"
        ? "border-amber-500"
        : "border-blue-500"
  $: severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1)
  $: severityColor =
    severity === "urgent"
      ? "text-red-300"
      : severity === "important"
        ? "text-amber-300"
        : "text-blue-300"

  function asShortKey(pk: string): string {
    return pk.slice(0, 8) + "..."
  }
</script>

<div class="bg-neutral-800/60 rounded-lg border-l-4 px-3 py-2.5 {borderColor}">
  <div class="mb-1 flex items-center gap-2">
    <span class="text-sm">📋</span>
    <span class="text-xs font-bold uppercase tracking-wide {severityColor}"
      >SITREP — {severityLabel}</span>
  </div>
  <div class="mb-1.5 flex items-center gap-1.5 text-[11px] text-neutral-400">
    <span class="font-mono">{asShortKey(message.pubkey)}</span>
    <span>•</span>
    <span>{formatTimestamp(message.created_at)}</span>
  </div>
  <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-100">
    {message.content}
  </p>
  {#if location}
    <div class="mt-1.5 text-xs text-neutral-400">📍 {location}</div>
  {/if}
</div>
