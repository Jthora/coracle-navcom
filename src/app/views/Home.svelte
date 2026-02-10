<script lang="ts">
  import {makeTagFeed} from "@welshman/feeds"
  import Feeds from "src/app/views/Feeds.svelte"
  import {makeFeed} from "src/domain"

  export let feed = null
  export let topic = null

  $: topics = topic ? [topic] : []
  $: topicFeed = topic ? makeFeed({definition: makeTagFeed("#t", topic)}) : null
  $: activeFeed = feed || topicFeed
</script>

<Feeds feed={activeFeed} {topics} />
