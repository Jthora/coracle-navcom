<script lang="ts">
  import Button from "src/partials/Button.svelte"

  export let onFinish: () => void
  export let onBack: () => void
  export let relaysApplied = false
  export let starterApplied = false
  export let backupNeeded = false
</script>

<div class="flex items-start gap-3">
  <p
    class="-ml-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-base">
    4/4
  </p>
  <div class="flex flex-col gap-1">
    <p class="text-2xl font-bold">You're ready</p>
    <p class="text-neutral-200">
      Posting is enabled. Defaults are applied so your feed isn’t empty.
    </p>
  </div>
</div>

<div class="panel mt-4 space-y-2 p-4 text-neutral-200">
  <div class="flex items-center justify-between">
    <span>Relay defaults</span>
    <span class={relaysApplied ? "text-success" : "text-warning"}
      >{relaysApplied ? "Applied" : "Pending"}</span>
  </div>
  <div class="flex items-center justify-between">
    <span>Starter follows</span>
    <span class={starterApplied ? "text-success" : "text-warning"}
      >{starterApplied ? "Applied" : "Skipped"}</span>
  </div>
  <div class="flex items-center justify-between">
    <span>Backup reminder</span>
    <span class={backupNeeded ? "text-warning" : "text-neutral-300"}
      >{backupNeeded ? "We'll remind you" : "Not required"}</span>
  </div>
</div>

<div class="mt-4 flex flex-col gap-2 sm:flex-row">
  <Button class="btn" on:click={onBack}><i class="fa fa-arrow-left" /> Back</Button>
  <Button class="btn btn-accent flex-1" on:click={onFinish}>Go to Navcom</Button>
</div>
