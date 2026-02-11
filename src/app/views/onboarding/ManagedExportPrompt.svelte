<script lang="ts">
  import Button from "src/partials/Button.svelte"
  import {router} from "src/app/util/router"
  import {dismissManagedExportPrompt, onboardingState} from "src/app/state/onboarding"

  const goToExport = () => router.at("/settings/keys").push()
  const dismiss = () => dismissManagedExportPrompt()
</script>

{#if $onboardingState.complete && !$onboardingState.backupNeeded && $onboardingState.path === "managed" && !$onboardingState.managedExportDismissed}
  <div
    class="bg-neutral-850 fixed bottom-4 right-4 z-toast max-w-sm rounded border border-neutral-700 p-3 shadow-2xl">
    <p class="text-sm font-semibold text-neutral-100">Export your Navcom key</p>
    <p class="mt-1 text-sm text-neutral-200">
      Optional: save a backup so you can sign in elsewhere.
    </p>
    <div class="mt-2 flex gap-2">
      <Button class="btn btn-low flex-1" on:click={dismiss}>Dismiss</Button>
      <Button class="btn btn-accent flex-1" on:click={goToExport}>
        <i class="fa fa-download" /> Export
      </Button>
    </div>
  </div>
{/if}
