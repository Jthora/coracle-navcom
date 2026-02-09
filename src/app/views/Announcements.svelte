<script lang="ts">
  import {makeAuthorFeed, makeIntersectionFeed, makeTagFeed} from "@welshman/feeds"
  import Feeds from "src/app/views/Feeds.svelte"
  import {makeFeed} from "src/domain"
  import {ANNOUNCEMENTS_PUBKEY, ANNOUNCEMENTS_TAG} from "src/app/announcements"

  const definition = makeIntersectionFeed(
    makeTagFeed("#t", ANNOUNCEMENTS_TAG),
    makeAuthorFeed(ANNOUNCEMENTS_PUBKEY),
  )

  const feed = makeFeed({definition})
  const topics = [ANNOUNCEMENTS_TAG]
</script>

<div class="flex flex-col gap-4">
  <h1 class="staatliches text-3xl text-neutral-100">Starcom Announcements</h1>
  <Feeds {feed} {topics} hideTopicChrome showControls={false} />
</div>
