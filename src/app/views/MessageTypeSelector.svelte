<script lang="ts">
  import {t} from "svelte-i18n"
  import {createEventDispatcher} from "svelte"

  export let showAdvanced = false

  type MessageType = "message" | "check-in" | "alert" | "sitrep" | "spotrep"

  const dispatch = createEventDispatcher<{select: MessageType}>()

  let open = false

  const types: {id: MessageType; labelKey: string; icon: string; phase: "a" | "b"}[] = [
    {id: "message", labelKey: "msgType.message", icon: "💬", phase: "a"},
    {id: "check-in", labelKey: "msgType.checkIn", icon: "📍", phase: "a"},
    {id: "alert", labelKey: "msgType.alert", icon: "🚨", phase: "a"},
    {id: "sitrep", labelKey: "msgType.sitrep", icon: "📋", phase: "b"},
    {id: "spotrep", labelKey: "msgType.spotrep", icon: "📌", phase: "b"},
  ]

  $: visibleTypes = showAdvanced ? types : types.filter(t => t.phase === "a")

  function select(type: MessageType) {
    dispatch("select", type)
    open = false
  }
</script>

<div class="relative">
  <button
    type="button"
    class="flex h-9 w-9 items-center justify-center rounded text-nc-text-muted hover:bg-nc-input hover:text-nc-text"
    title={$t("msgType.selector.title")}
    on:click={() => (open = !open)}>
    📎
  </button>

  {#if open}
    <div
      class="z-10 absolute bottom-full left-0 mb-1 rounded border border-nc-shell-border bg-nc-shell-bg py-1 shadow-lg">
      {#each visibleTypes as type}
        <button
          type="button"
          class="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-sm text-nc-text hover:bg-nc-input"
          on:click={() => select(type.id)}>
          <span>{type.icon}</span>
          <span>{$t(type.labelKey)}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
