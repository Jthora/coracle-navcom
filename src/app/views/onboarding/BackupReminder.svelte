<script lang="ts">
  import Button from "src/partials/Button.svelte"
  import {router} from "src/app/util/router"
  import {confirmBackup, onboardingState} from "src/app/state/onboarding"

  const goToExport = () => router.at("/settings/keys").push()
</script>

{#if $onboardingState.complete && $onboardingState.backupNeeded}
  <div
    class="fixed bottom-16 right-4 z-toast max-w-sm rounded border border-warning bg-neutral-800 p-3 shadow-xl">
    <p class="text-sm font-semibold text-warning">Back up your key</p>
    <p class="mt-1 text-sm text-neutral-100">
      Export or write down your key. Posting stays enabled, but don’t lose access.
    </p>
    <div class="mt-2 flex gap-2">
      <Button class="btn btn-low flex-1" on:click={goToExport}>
        <i class="fa fa-download" /> Export key
      </Button>
      <Button class="btn btn-accent flex-1" on:click={confirmBackup}>I’ve backed up</Button>
    </div>
  </div>
{/if}
