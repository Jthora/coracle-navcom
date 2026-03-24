<script lang="ts">
  import Button from "src/partials/Button.svelte"
  import Popover from "src/partials/Popover.svelte"
  import SecurityPosturePanel from "./SecurityPosturePanel.svelte"

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
      <p class="text-2xl font-bold text-nc-text">Infrastructure status</p>
      <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          Your identity credential is configured and relay connections are established. Review the
          status below.
        </div>
      </Popover>
    </div>
    <p class="text-nc-text">
      Your credential is active. Review your security posture before proceeding.
    </p>
  </div>
</div>

<div class="panel mt-4 space-y-2 p-4 text-nc-text">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <span>Relay infrastructure</span>
      <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          Relay servers route your encrypted messages. These defaults ensure connectivity. Configure
          dedicated relays per group in settings.
        </div>
      </Popover>
    </div>
    <span class={relaysApplied ? "text-success" : "text-warning"}
      >{relaysApplied ? "Applied" : "Pending"}</span>
  </div>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <span>Network connections</span>
      <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          Initial connections to the relay network. You can modify these in settings.
        </div>
      </Popover>
    </div>
    <span class={starterApplied ? "text-success" : "text-warning"}
      >{starterApplied ? "Applied" : "Skipped"}</span>
  </div>
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <span>Credential backup</span>
      <Popover triggerType="mouseenter">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          Your private key exists only on this device. If you lose access to this device and
          haven't exported your key, your identity is lost permanently.
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
    Begin operations
  </Button>
</div>

<SecurityPosturePanel />
