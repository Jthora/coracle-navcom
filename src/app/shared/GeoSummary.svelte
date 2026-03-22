<script lang="ts">
  import type {GeointState} from "src/app/util/geoint"

  export let value: GeointState
  export let onEdit: () => void
  export let onClear: () => void

  const fmt = (n: number | null) => (n === null || n === undefined ? "--" : n.toFixed(6))
</script>

{#if value?.lat !== null && value?.lon !== null}
  <div
    class="bg-nc-shell-bg flex flex-wrap items-center gap-3 rounded-xl border border-nc-shell-border px-3 py-2 text-sm text-nc-text">
    <div class="flex flex-col leading-tight">
      <span class="font-semibold">Coordinates</span>
      <span class="text-nc-text">{fmt(value.lat)}, {fmt(value.lon)}</span>
      {#if value?.subtype}
        <span class="text-nc-text">Subtype: {value.subtype}</span>
      {/if}
      {#if value?.confidence !== null && value?.confidence !== undefined}
        <span class="text-nc-text"
          >Confidence: {Math.round(
            value.confidence > 1 ? value.confidence : value.confidence * 100,
          )}%</span>
      {/if}
    </div>
    <div class="flex gap-2">
      <button
        type="button"
        class="rounded border border-nc-shell-border px-3 py-1 text-xs"
        on:click={onEdit}>
        Edit
      </button>
      <button
        type="button"
        class="rounded border border-nc-shell-border px-3 py-1 text-xs"
        on:click={onClear}>
        Clear
      </button>
    </div>
  </div>
{/if}
