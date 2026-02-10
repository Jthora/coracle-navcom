<script lang="ts">
  import {makeTagFeed} from "@welshman/feeds"
  import Feeds from "src/app/views/Feeds.svelte"
  import {makeFeed} from "src/domain"
  import {defaultFeed} from "src/engine"

  export let feed = null
  export let topic = null

  $: topics = topic ? [topic] : []
  $: topicFeed = topic ? makeFeed({definition: makeTagFeed("#t", topic)}) : null
  $: activeFeed = feed || topicFeed || $defaultFeed
</script>

<Feeds feed={activeFeed} {topics} />
