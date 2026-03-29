<script lang="ts">
  import Link from "src/partials/Link.svelte"
  import type {GroupBreadcrumbItem} from "src/app/groups/breadcrumbs"

  export let items: GroupBreadcrumbItem[] = []
</script>

<nav
  aria-label="Group breadcrumbs"
  class="mb-3 flex flex-wrap items-center gap-1 text-xs text-nc-text-muted">
  {#each items as item, index (`breadcrumb-${item.label}-${index}`)}
    {#if index > 0}
      <span class="text-nc-text-muted">/</span>
    {/if}
    {#if item.href && !item.current}
      <Link class="hover:text-nc-text" href={item.href}>{item.label}</Link>
    {:else}
      <span class="text-nc-text" aria-current={item.current ? "page" : undefined}
        >{item.label}</span>
    {/if}
  {/each}
</nav>
