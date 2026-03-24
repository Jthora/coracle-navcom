<script lang="ts">
  import Button from "src/partials/Button.svelte"
  import Popover from "src/partials/Popover.svelte"

  export let onContinue: () => void
  export let hasKey = false
  export let onSkipExisting: (() => void) | null = null
</script>

<div class="flex items-start gap-3">
  <div class="flex items-center gap-2">
    <p
      class="-ml-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-nc-input text-base text-nc-text">
      1/4
    </p>
    <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
      <span slot="trigger" class="text-nc-text">
        <i class="fa fa-info-circle" />
      </span>
      <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
        This is step 1 of 4. Your progress is saved as you go, and you can move back and forth
        without losing choices.
      </div>
    </Popover>
  </div>
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-2">
      <p class="text-2xl font-bold text-nc-text">Operational briefing</p>
      <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text">
          <i class="fa fa-info-circle" />
        </span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          This briefing prepares your identity credential and infrastructure connections. Nothing
          is transmitted until you choose to.
        </div>
      </Popover>
    </div>
    <p class="text-nc-text">
      NavCom is a sovereign communications platform. No central server. No corporate gatekeeper.
      Your messages are encrypted and signed by keys only you control.
    </p>
  </div>
</div>
<div class="panel mt-4 space-y-3 p-4 text-nc-text">
  <div class="flex items-center gap-2">
    <p>What happens next:</p>
    <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
      <span slot="trigger" class="text-nc-text">
        <i class="fa fa-info-circle" />
      </span>
      <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
        This briefing covers your identity credential, operator card, and infrastructure
        connections. Nothing is transmitted until you choose to.
      </div>
    </Popover>
  </div>
  <ul class="list-disc space-y-1 pl-5 text-nc-text">
    <li>
      You receive an identity credential (cryptographic key pair) — this is how the network knows you.
      <Popover triggerType="mouseenter" class="ml-1 inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          A key pair is generated locally on your device. The private key never leaves your device.
          You can export it or replace it with your own key at any time.
        </div>
      </Popover>
    </li>
    <li>
      Optional: import your own credential if you have one.
      <Popover triggerType="mouseenter" class="ml-1 inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          If you already have a Nostr private key (nsec) or encrypted key, you can import it. Full
          custody remains with you.
        </div>
      </Popover>
    </li>
    <li>
      Optional: configure your operator card (callsign, display name).
      <Popover triggerType="mouseenter" class="ml-1 inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          Other operators will see your callsign and display name. Use operational handles, not
          personal names. You can change these later.
        </div>
      </Popover>
    </li>
    <li>
      Infrastructure defaults are applied so you can communicate immediately.
      <Popover triggerType="mouseenter" class="ml-1 inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          Pre-configured relay connections ensure you can send and receive messages immediately.
          You can change relay configuration later in settings.
        </div>
      </Popover>
    </li>
    <li>
      You will see what's protected and what's visible before you begin.
      <Popover triggerType="mouseenter" class="ml-1 inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          Before you start operating, we'll show you exactly what's encrypted and what relay
          operators can observe. No surprises.
        </div>
      </Popover>
    </li>
  </ul>
</div>
<div class="mt-4 flex flex-col gap-2 sm:flex-row">
  <Button class="btn btn-accent flex-1 whitespace-normal text-center" on:click={onContinue}>
    Continue
  </Button>
  {#if hasKey && onSkipExisting}
    <Button class="btn flex-1 whitespace-normal text-center" on:click={onSkipExisting}>
      I already have a key
    </Button>
  {/if}
</div>
