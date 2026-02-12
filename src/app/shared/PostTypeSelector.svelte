<script lang="ts">
  export let selected: "default" | "ops" | "geoint" = "default"
  export let onSelect: (value: "default" | "ops" | "geoint") => void

  const types: Array<{key: "default" | "ops" | "geoint"; label: string; helper?: string}> = [
    {key: "default", label: "Default"},
    {key: "ops", label: "Ops", helper: "Adds #starcom_ops"},
    {key: "geoint", label: "GEOINT", helper: "Adds location + payload"},
  ]

  const click = (key: "default" | "ops" | "geoint") => {
    if (key !== selected) {
      onSelect?.(key)
    }
  }

  const selectByIndex = (index: number) => {
    const next = types[(index + types.length) % types.length]
    click(next.key)
  }

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      click(types[index].key)
      return
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault()
      selectByIndex(index + 1)
      return
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault()
      selectByIndex(index - 1)
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      const target = event.currentTarget as HTMLButtonElement
      target?.blur()
    }
  }
</script>

<div class="flex flex-wrap gap-2" role="group" aria-label="Post type selector">
  {#each types as type, index}
    <button
      type="button"
      class={`rounded-lg border px-3 py-2 text-sm transition-all ${
        selected === type.key
          ? "bg-white text-black"
          : "border-neutral-600 bg-transparent text-white"
      }`}
      aria-pressed={selected === type.key}
      aria-label={`Select ${type.label} post type`}
      on:click={() => click(type.key)}
      on:keydown={event => handleKeyDown(event, index)}>
      <div class="flex items-center gap-2">
        <span class="font-semibold">{type.label}</span>
        {#if type.helper}
          <span class="text-xs text-neutral-300">{type.helper}</span>
        {/if}
      </div>
    </button>
  {/each}
</div>
