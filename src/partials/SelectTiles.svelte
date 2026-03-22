<script lang="ts">
  import cx from "classnames"
  import Tile from "src/partials/Tile.svelte"
  import SelectList from "src/partials/SelectList.svelte"

  const getClass = active =>
    cx("transition-all", {
      "bg-tinted-500 text-tinted-800": !active,
      "bg-nc-accent text-neutral-900": active,
    })
</script>

<SelectList {...$$props} class={cx("grid justify-between gap-4", $$props.class)}>
  <div slot="item" let:i let:active let:option>
    <Tile class={getClass(active)}>
      <slot name="item" {option} {active} />
    </Tile>
  </div>
</SelectList>
