<script lang="ts">
  export let label = null
  export let icon = null
</script>

<div class="panel flex flex-col gap-2 px-4 py-3">
  <slot name="label">
    <div class="grid grid-cols-2 gap-2">
      <label
        class="flex items-center gap-2 font-semibold uppercase tracking-[0.06em] text-neutral-100">
        {#if icon}
          <i class={`fa ${icon}`} />
        {/if}
        <span>{label}</span>
      </label>
      <slot />
    </div>
  </slot>
  <p class="text-sm text-neutral-400">
    <slot name="info" />
  </p>
</div>
