<script lang="ts">
  import Button from "src/partials/Button.svelte"
  import Popover from "src/partials/Popover.svelte"

  export let onFinish: () => void
  export let onBack: () => void
  export let relaysApplied = false
  export let starterApplied = false
  export let backupNeeded = false
</script>

<div class="flex items-start gap-3">
  <div class="flex items-center gap-2">
    <p
      class="-ml-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-nc-input text-base text-nc-text">
      4/4
    </p>
    <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
      <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
      <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
        Final step. You can still go back to adjust profile or key choices if needed.
      </div>
    </Popover>
  </div>
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-2">
      <p class="text-2xl font-bold text-nc-text">You're ready</p>
      <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          Posting is enabled. You can tweak relays, follows, and backups later in settings.
        </div>
      </Popover>
    </div>
    <p class="text-nc-text">
      Posting is enabled. Defaults are applied so your feed isn’t empty.
    </p>
  </div>
</div>

<div class="panel mt-4 space-y-2 p-4 text-nc-text">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <span>Relay defaults</span>
      <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          We preloaded relays so you can read and post immediately. You can change them later in
          settings.
        </div>
      </Popover>
    </div>
    <span class={relaysApplied ? "text-success" : "text-warning"}
      >{relaysApplied ? "Applied" : "Pending"}</span>
  </div>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <span>Starter follows</span>
      <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          A short curated list so your feed isn’t empty. You can unfollow any of them anytime.
        </div>
      </Popover>
    </div>
    <span class={starterApplied ? "text-success" : "text-warning"}
      >{starterApplied ? "Applied" : "Skipped"}</span>
  </div>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <span>Backup reminder</span>
      <Popover triggerType="mouseenter">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          If you created or imported a key here, we’ll remind you to export or confirm a backup so
          you don’t lose access.
        </div>
      </Popover>
    </div>
    <span class={backupNeeded ? "text-warning" : "text-nc-text"}
      >{backupNeeded ? "We'll remind you" : "Not required"}</span>
  </div>
</div>

<div class="mt-4 flex flex-col gap-2 sm:flex-row">
  <Button class="btn whitespace-normal text-center" on:click={onBack}>
    <i class="fa fa-arrow-left" /> Back
  </Button>
  <Button class="btn btn-accent flex-1 whitespace-normal text-center" on:click={onFinish}>
    Go to Navcom
  </Button>
</div>
