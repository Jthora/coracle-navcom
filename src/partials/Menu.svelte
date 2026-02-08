<script lang="ts">
  import cx from "classnames"
  import Card from "src/partials/Card.svelte"
</script>

<Card noPad class={cx($$props.class, "overflow-hidden shadow-lg")}>
  <slot />
</Card>
