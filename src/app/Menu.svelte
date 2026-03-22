<script lang="ts">
  import MenuMobile from "src/app/MenuMobile.svelte"
  import ChannelSidebar from "src/app/views/ChannelSidebar.svelte"

  let innerWidth = 0
</script>

<svelte:window bind:innerWidth />

{#if innerWidth < 1024}
  <MenuMobile />
{:else}
  <div class="top-sai left-sai bottom-sai fixed z-nav flex w-72 flex-col">
    <div class="flex-1 overflow-hidden border-r border-nc-shell-border bg-nc-shell-deep">
      <ChannelSidebar />
    </div>
  </div>
{/if}
