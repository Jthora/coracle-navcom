<script lang="ts">
  import {makeTagFeed} from "@welshman/feeds"
  import Feeds from "src/app/views/Feeds.svelte"
  import {makeFeed} from "src/domain"
  import {defaultFeed, env} from "src/engine"

  export let feed = null
  export let topic = null

  const opsTag = env.OPS_TAG || "starcom_ops"
  const intelTag = env.INTEL_TAG || "starcom_intel"

  $: topics = topic ? [topic] : []
  $: topicFeed = topic ? makeFeed({definition: makeTagFeed("#t", topic)}) : null
  $: activeFeed = feed || topicFeed || $defaultFeed
  $: isOpsFeed = topics?.length === 1 && topics[0] === opsTag
  $: isIntelFeed = topics?.length === 1 && topics[0] === intelTag
</script>

<Feeds
  feed={activeFeed}
  {topics}
  hideTopicChrome={isOpsFeed || isIntelFeed}
  showControls={!isOpsFeed && !isIntelFeed} />
