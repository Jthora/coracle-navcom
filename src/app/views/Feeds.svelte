<script lang="ts">
  import {pubkey} from "@welshman/app"
  import {synced, localStorageProvider} from "@welshman/store"
  import Button from "src/partials/Button.svelte"
  import Card from "src/partials/Card.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {defaultFeed, env} from "src/engine"

  export let feed = null
  export let topics: string[] = []

  const feedMode = synced({
    key: "Feed.mode",
    defaultValue: "topic",
    storage: localStorageProvider,
  })

  const showLogin = () => router.at("login").open()
  const hasTopicPreset = Boolean(feed && topics?.length)

  const opsTag = env.OPS_TAG || "starcom-ops"
  const opsFeedHref = `/topics/${opsTag}`

  $: initialFeed = hasTopicPreset && $feedMode === "topic" ? feed : $defaultFeed
  $: topicLabel = topics?.length ? topics.map(t => `#${t}`).join(", ") : ""

  document.title = "Feeds"
</script>

{#if hasTopicPreset}
  <div class="mb-3 flex flex-wrap items-center gap-2 text-sm text-neutral-300">
    {#each topics as t (t)}
      <span class="panel border border-neutral-700 px-2 py-1 text-neutral-200">#{t}</span>
    {/each}
    <Button
      class="btn btn-low px-3 py-1"
      on:click={() => feedMode.set("topic")}
      disabled={$feedMode === "topic"}>
      Reset HQ scope
    </Button>
  </div>
{/if}

<Card class="panel-interactive mb-3 flex items-center justify-between gap-3">
  <div class="flex flex-col text-sm text-neutral-200">
    <span class="font-semibold">Ops Feed</span>
    <span class="text-neutral-400">Open coordination on #{opsTag}.</span>
  </div>
  <Button class="btn btn-accent" on:click={() => router.go({path: opsFeedHref})}>Open feed</Button>
</Card>

{#if !$pubkey}
  <div class="py-16 text-center">
    <p class="text-xl">Don't have an account?</p>
    <p>
      Click <Button
        class="text-inherit cursor-pointer bg-transparent p-0 underline"
        on:click={showLogin}>here</Button> to join the nostr network.
    </p>
  </div>
{/if}

{#if hasTopicPreset}
  <div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-300">
    <div class="flex items-center gap-1">
      <Button
        class={"btn px-3 py-1 " + ($feedMode === "topic" ? "btn-accent" : "btn-low")}
        on:click={() => feedMode.set("topic")}>
        Topic feed
      </Button>
      <Button
        class={"btn px-3 py-1 " + ($feedMode === "user" ? "btn-accent" : "btn-low")}
        on:click={() => feedMode.set("user")}>
        My feed
      </Button>
    </div>
    {#if topicLabel}
      <div class="text-neutral-400">
        HQ scope filters to {topicLabel}; My feed shows your follows.
      </div>
    {/if}
  </div>
{/if}

<Feed showControls feed={initialFeed} />
