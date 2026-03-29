<script lang="ts">
  import {swUpdateState} from "src/app/shared/sw-update-state"

  $: state = $swUpdateState

  const onUpdate = async () => {
    if (state.updateSW) {
      await state.updateSW()
    }
  }
</script>

{#if state.available}
  <div
    class="fixed left-1/2 top-2 z-toast -translate-x-1/2 rounded-lg border {state.securityCritical
      ? 'border-red-500 bg-red-900/95'
      : 'bg-nc-shell-deep/95 border-accent'} px-4 py-2.5 shadow-xl"
    role="alert">
    <div class="flex items-center gap-3 text-sm text-nc-text">
      {#if state.securityCritical}
        <i class="fa fa-shield-halved text-red-400" />
        <span><strong>Security update required</strong> — this update patches a vulnerability</span>
      {:else}
        <i class="fa fa-arrow-up-right-from-square text-accent" />
        <span>New version available — <strong>Update now</strong></span>
      {/if}
      <button
        class="rounded {state.securityCritical
          ? 'bg-red-500 hover:bg-red-400'
          : 'hover:bg-accent/80 bg-accent'} px-3 py-1 text-xs font-semibold text-white transition-colors"
        on:click={onUpdate}>
        Update
      </button>
    </div>
  </div>
{:else if state.registrationError}
  <div
    class="bg-nc-shell-deep/95 fixed left-1/2 top-2 z-toast -translate-x-1/2 rounded-lg border border-warning px-4 py-2.5 shadow-xl"
    role="alert">
    <div class="flex items-center gap-3 text-sm text-warning">
      <i class="fa fa-exclamation-triangle" />
      <span>Auto-update unavailable — refresh manually to get latest version</span>
    </div>
  </div>
{/if}
