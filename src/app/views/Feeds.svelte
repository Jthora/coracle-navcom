<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Button from "src/partials/Button.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {defaultFeed, env} from "src/engine"

  export let feed = null
  export let topics: string[] = []
  export let hideTopicChrome = false
  export let showControls = true

  const showLogin = () => router.at("login").open()
  const hasTopicPreset = Boolean(feed && topics?.length)

  const opsTag = env.OPS_TAG || "starcom_ops"
  const isOpsFeed = topics?.length === 1 && topics[0] === opsTag
  const intelTag = env.INTEL_TAG || "starcom_intel"
  const isIntelFeed = topics?.length === 1 && topics[0] === intelTag

  $: initialFeed = hasTopicPreset ? feed : $defaultFeed
  document.title = "Feeds"
</script>

{#if hasTopicPreset && !isOpsFeed && !isIntelFeed && !hideTopicChrome}
  <div class="mb-3 flex flex-wrap items-center gap-2 text-sm text-neutral-300">
    {#each topics as t (t)}
      <span class="panel border border-neutral-700 px-2 py-1 text-neutral-200">#{t}</span>
    {/each}
  </div>
{/if}

{#if !$pubkey && !hideTopicChrome}
  <div class="py-16 text-center">
    <p class="text-xl">Don't have an account?</p>
    <p>
      Click <Button
        class="text-inherit cursor-pointer bg-transparent p-0 underline"
        on:click={showLogin}>here</Button> to join the nostr network.
    </p>
  </div>
{/if}

<Feed {showControls} feed={initialFeed} />
