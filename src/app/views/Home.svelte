<script lang="ts">
  import {makeTagFeed} from "@welshman/feeds"
  import Feeds from "src/app/views/Feeds.svelte"
  import {makeFeed} from "src/domain"
  import {env} from "src/engine"

  export let feed = null
  export let topic = null

  const opsTag = env.OPS_TAG || "starcom_ops"

  $: topics = topic ? [topic] : [opsTag]
  $: topicFeed = topic
    ? makeFeed({definition: makeTagFeed("#t", topic)})
    : makeFeed({definition: makeTagFeed("#t", opsTag)})
  $: activeFeed = feed || topicFeed
</script>

<Feeds feed={activeFeed} {topics} />
