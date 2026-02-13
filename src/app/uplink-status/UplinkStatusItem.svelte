<script lang="ts">
  export let label: string
  export let value: string
  export let valueClass = "text-accent"
</script>

<div class="aldrich flex items-center gap-1.5 whitespace-nowrap text-[11px] tracking-[0.12em]">
  <span class="font-semibold uppercase text-neutral-300">{label}:</span>
  <span class={`font-semibold ${valueClass}`}>{value}</span>
</div>
