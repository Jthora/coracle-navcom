<script lang="ts">
  import {activeLoaderStatus} from "src/app/status/loader-status"
</script>

{#if $activeLoaderStatus}
  <div class="z-50 pointer-events-none fixed left-1/2 top-20 -translate-x-1/2 px-4">
    <div
      class="bg-neutral-900/95 rounded-md px-4 py-2 text-center text-sm text-white shadow-lg backdrop-blur-sm">
      <div>{$activeLoaderStatus.message}</div>
      {#if $activeLoaderStatus.detail}
        <div class="mt-1 text-xs text-neutral-300">{$activeLoaderStatus.detail}</div>
      {/if}
    </div>
  </div>
{/if}
