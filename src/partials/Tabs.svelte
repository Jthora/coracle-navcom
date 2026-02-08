<script lang="ts">
  import cx from "classnames"
  import {toTitle} from "src/util/misc"

  export let tabs: string[]
  export let activeTab
  export let setActiveTab
</script>

<div
  class={cx(
    $$props.class,
    "relative flex items-center justify-between overflow-auto rounded-lg border border-neutral-700 bg-[linear-gradient(180deg,rgba(15,17,20,0.9),rgba(5,6,8,0.95))] px-2 pb-1 pt-2 shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm",
  )}>
  <div class="bg-neutral-700/70 absolute bottom-0 left-0 right-0 h-px w-full" />
  <div class="flex w-full gap-1">
    {#each tabs as tab}
      <button
        class="relative flex flex-grow cursor-pointer items-end justify-center gap-2 rounded-md border-b-2 border-transparent px-3 pb-3 text-sm uppercase tracking-[0.08em] transition-all hover:text-neutral-50"
        class:border-accent={activeTab === tab}
        class:text-accent={activeTab === tab}
        class:opacity-75={activeTab !== tab}
        on:click|preventDefault={() => setActiveTab(tab)}>
        <slot name="tab" {tab}>{toTitle(tab)}</slot>
        {#if activeTab === tab}
          <span class="absolute -bottom-1 left-6 right-6 h-px bg-[rgba(99,230,255,0.6)]" />
        {/if}
      </button>
    {/each}
  </div>
  <slot />
</div>
