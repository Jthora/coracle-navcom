<script lang="ts">
  import Link from "src/partials/Link.svelte"
  import type {GroupBreadcrumbItem} from "src/app/groups/breadcrumbs"

  export let items: GroupBreadcrumbItem[] = []
</script>

<nav
  aria-label="Group breadcrumbs"
  class="mb-3 flex flex-wrap items-center gap-1 text-xs text-neutral-400">
  {#each items as item, index (`breadcrumb-${item.label}-${index}`)}
    {#if index > 0}
      <span class="text-neutral-600">/</span>
    {/if}
    {#if item.href && !item.current}
      <Link class="hover:text-neutral-200" href={item.href}>{item.label}</Link>
    {:else}
      <span class="text-neutral-200" aria-current={item.current ? "page" : undefined}
        >{item.label}</span>
    {/if}
  {/each}
</nav>
