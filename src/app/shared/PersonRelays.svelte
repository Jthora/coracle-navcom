<script lang="ts">
  import {uniq} from "@welshman/lib"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let urls
</script>

<FlexColumn>
  {#if urls.length === 0}
    <div class="panel p-6 text-center text-neutral-200">No relays found</div>
  {:else}
    <FlexColumn small>
      {#each uniq(urls) as url (url)}
        <RelayCard {url} />
      {/each}
    </FlexColumn>
  {/if}
</FlexColumn>
