<script lang="ts">
  import {makeTagFeed} from "@welshman/feeds"
  import Feeds from "src/app/views/Feeds.svelte"
  import {makeFeed} from "src/domain"
  import {env} from "src/engine"

  export let feed = null
  export let topic = null

  const fallbackTopics = ["starcom", "navcom", "archangel", "thora"]
  const defaultTopics = (env.DEFAULT_TOPICS?.filter(Boolean) || fallbackTopics).filter(Boolean)

  $: topics = topic ? [topic] : defaultTopics
  $: topicFeed = topic
    ? makeFeed({definition: makeTagFeed("#t", topic)})
    : defaultTopics.length
      ? makeFeed({definition: makeTagFeed("#t", ...defaultTopics)})
      : null
  $: activeFeed = feed || topicFeed
</script>

<Feeds feed={activeFeed} {topics} />
