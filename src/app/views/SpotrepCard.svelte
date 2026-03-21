<!--
  SpotrepCard.svelte — Rendered SPOTREP message card in the conversation feed.
-->

<script lang="ts">
  import {formatTimestamp} from "@welshman/lib"

  export let message: {pubkey: string; content: string; tags: string[][]; created_at: number}

  $: location = message.tags.find(t => t[0] === "location")?.[1] || null
  $: imetaTag = message.tags.find(t => t[0] === "imeta")
  $: photoUrl = imetaTag
    ? imetaTag
        .slice(1)
        .find(v => v.startsWith("url "))
        ?.slice(4) || null
    : null

  function asShortKey(pk: string): string {
    return pk.slice(0, 8) + "..."
  }
</script>

<div class="border-cyan-500 bg-neutral-800/60 rounded-lg border-l-4 px-3 py-2.5">
  <div class="mb-1 flex items-center gap-2">
    <span class="text-sm">📌</span>
    <span class="text-cyan-300 text-xs font-bold uppercase tracking-wide">SPOTREP</span>
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
  {#if photoUrl}
    <div class="mt-2">
      <img
        src={photoUrl}
        alt="SPOTREP photo"
        class="max-h-48 rounded-lg border border-neutral-700 object-cover"
        loading="lazy" />
    </div>
  {/if}
</div>
