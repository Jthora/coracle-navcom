<script lang="ts">
  import type {GeointState} from "src/app/util/geoint"

  export let value: GeointState
  export let onEdit: () => void
  export let onClear: () => void

  const fmt = (n: number | null) => (n === null || n === undefined ? "--" : n.toFixed(6))
</script>

{#if value?.lat !== null && value?.lon !== null}
  <div
    class="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white">
    <div class="flex flex-col leading-tight">
      <span class="font-semibold">Coordinates</span>
      <span class="text-neutral-200">{fmt(value.lat)}, {fmt(value.lon)}</span>
      {#if value?.subtype}
        <span class="text-neutral-300">Subtype: {value.subtype}</span>
      {/if}
      {#if value?.confidence !== null && value?.confidence !== undefined}
        <span class="text-neutral-300"
          >Confidence: {Math.round(
            value.confidence > 1 ? value.confidence : value.confidence * 100,
          )}%</span>
      {/if}
    </div>
    <div class="flex gap-2">
      <button class="rounded border border-neutral-600 px-3 py-1 text-xs" on:click={onEdit}>
        Edit
      </button>
      <button class="rounded border border-neutral-600 px-3 py-1 text-xs" on:click={onClear}>
        Clear
      </button>
    </div>
  </div>
{/if}
