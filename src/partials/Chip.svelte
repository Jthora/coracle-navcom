<script lang="ts">
  import cx from "classnames"

  export let pad = false
  export let dark = true
  export let light = false
  export let accent = false
  export let danger = false
  export let warning = false
  export let small = false
  export let onRemove = null

  $: className = cx($$props.class, "cy-chip", {
    "chip-muted": light,
    "chip-accent": accent,
    "chip-danger": danger,
    "chip-warning": warning,
    "chip-small": small,
    "chip-pad": pad,
  })
</script>

<div class={className} on:click>
  <div class="flex items-center gap-2 whitespace-nowrap">
    {#if onRemove}
      <i class="fa fa-times cursor-pointer" on:click|preventDefault={onRemove} />
    {/if}
    <slot />
  </div>
</div>
