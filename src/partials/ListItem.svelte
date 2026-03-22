<script lang="ts">
  import {createEventDispatcher} from "svelte"

  const dispatch = createEventDispatcher()

  const onRemove = () => dispatch("remove")
</script>

<button type="button" class="panel-row w-full">
  <div class="flex items-center gap-4">
    <span
      class="cursor-pointer rounded-full p-2 transition-colors hover:bg-[rgba(var(--accent-rgb),0.1)]"
      on:click={onRemove}>
      <i class="fa fa-times" />
    </span>
    <slot name="label" />
  </div>
  <slot name="data" />
</button>
