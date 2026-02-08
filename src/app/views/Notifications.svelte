<script lang="ts">
  import {onMount} from "svelte"
  import {createScroller} from "src/util/misc"
  import Tabs from "src/partials/Tabs.svelte"
  import Chip from "src/partials/Chip.svelte"
  import OnboardingTasks from "src/app/shared/OnboardingTasks.svelte"
  import NotificationSectionMain from "src/app/views/NotificationSectionMain.svelte"
  import NotificationSectionReactions from "src/app/views/NotificationSectionReactions.svelte"
  import {router} from "src/app/util/router"
  import {
    sessionWithMeta,
    loadNotifications,
    unreadMainNotifications,
    unreadReactionNotifications,
  } from "src/engine"

  const allTabs = ["Mentions & Replies", "Reactions"]

  const setActiveTab = tab => router.at("notifications").at(tab).push()

  const loadMore = async () => {
    limit += 2
  }

  export let activeTab = allTabs[0]

  let limit = 2
  let innerWidth = 0
  let element = null

  document.title = "Notifications"

  onMount(() => {
    loadNotifications()

    const scroller = createScroller(loadMore, {element})

    return () => {
      scroller.stop()
    }
  })
</script>

<svelte:window bind:innerWidth />

<div class="panel p-3">
  <Tabs tabs={allTabs} {activeTab} {setActiveTab}>
    <div slot="tab" let:tab class="flex items-center gap-2">
      <div>{tab}</div>
      {#if activeTab !== tab}
        {#if tab === allTabs[0] && $unreadMainNotifications.length > 0}
          <Chip small pad accent class="!px-2">{$unreadMainNotifications.length}</Chip>
        {:else if tab === allTabs[1] && $unreadReactionNotifications.length > 0}
          <Chip small pad accent class="!px-2">{$unreadReactionNotifications.length}</Chip>
        {/if}
      {/if}
    </div>
  </Tabs>
</div>

{#if $sessionWithMeta?.onboarding_tasks_completed}
  <OnboardingTasks />
{/if}

<div bind:this={element}>
  {#if activeTab === allTabs[0]}
    <NotificationSectionMain {limit} />
  {:else if activeTab === allTabs[1]}
    <NotificationSectionReactions {limit} />
  {/if}
</div>
