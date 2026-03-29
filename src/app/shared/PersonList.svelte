<script lang="ts">
  import {onMount} from "svelte"
  import {flatten, partition} from "@welshman/lib"
  import {profileHasName} from "@welshman/util"
  import {profilesByPubkey} from "@welshman/app"
  import {createScroller} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import VirtualList from "src/app/shared/VirtualList.svelte"

  export let pubkeys

  let element
  let limit = 10

  const loadMore = async () => {
    limit += 10
  }

  const hasName = pubkey => profileHasName($profilesByPubkey.get(pubkey))

  onMount(() => {
    const scroller = createScroller(loadMore, {
      element,
      threshold: 5000,
      delay: 100,
    })

    return () => {
      scroller.stop()
    }
  })

  $: [withName, withoutName] = partition(hasName, pubkeys)
  $: sorted = flatten([...withName, ...withoutName])
  $: results = sorted.slice(0, limit)
</script>

<FlexColumn bind:element>
  {#if results.length === 0}
    <div class="panel p-6 text-center text-nc-text">No people found</div>
  {:else if results.length > 50}
    <!-- Virtualized for large member lists -->
    <VirtualList
      count={results.length}
      estimateSize={48}
      overscan={8}
      containerClass="h-[60vh] max-h-[500px]">
      <div slot="default" let:index>
        <Card>
          <PersonSummary pubkey={results[index]} />
        </Card>
      </div>
    </VirtualList>
  {:else}
    {#each results as pubkey (pubkey)}
      <Card>
        <PersonSummary {pubkey} />
      </Card>
    {/each}
  {/if}
</FlexColumn>
