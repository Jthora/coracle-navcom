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
      class="-ml-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-base text-neutral-100">
      1/4
    </p>
    <Popover triggerType="mouseenter">
      <span slot="trigger" class="text-neutral-300">
        <i class="fa fa-info-circle" />
      </span>
      <div slot="tooltip" class="max-w-xs text-sm text-neutral-100">
        This is step 1 of 4. Your progress is saved as you go, and you can move back and forth
        without losing choices.
      </div>
    </Popover>
  </div>
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-2">
      <p class="text-2xl font-bold text-neutral-100">Get started</p>
      <Popover triggerType="mouseenter">
        <span slot="trigger" class="text-neutral-300">
          <i class="fa fa-info-circle" />
        </span>
        <div slot="tooltip" class="max-w-xs text-sm text-neutral-100">
          This guided setup won’t post anything yet. It just prepares your key and preferences so
          you can start posting smoothly afterwards.
        </div>
      </Popover>
    </div>
    <p class="text-neutral-200">
      Set up a Navcom key and post in under a minute. No jargon, minimal steps.
    </p>
  </div>
</div>
<div class="panel mt-4 space-y-3 p-4 text-neutral-200">
  <div class="flex items-center gap-2">
    <p>What to expect:</p>
    <Popover triggerType="mouseenter">
      <span slot="trigger" class="text-neutral-300">
        <i class="fa fa-info-circle" />
      </span>
      <div slot="tooltip" class="max-w-xs text-sm text-neutral-100">
        A quick preview of what we’ll do: create or import a key, set optional profile details, and
        apply defaults so you see content right away.
      </div>
    </Popover>
  </div>
  <ul class="list-disc space-y-1 pl-5 text-neutral-300">
    <li>
      We create a Navcom key for you (export anytime).
      <Popover triggerType="mouseenter">
        <span slot="trigger" class="ml-1 text-neutral-300"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-neutral-100">
          We generate a private key and keep it available to you; you can download/export it later
          or switch to another signer whenever you want.
        </div>
      </Popover>
    </li>
    <li>
      Optional: bring your own key instead.
      <Popover triggerType="mouseenter">
        <span slot="trigger" class="ml-1 text-neutral-300"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-neutral-100">
          If you already have an nsec or encrypted key, you can paste it and keep full custody.
          We’ll never store it without your say-so.
        </div>
      </Popover>
    </li>
    <li>
      Optional profile fields; you can skip.
      <Popover triggerType="mouseenter">
        <span slot="trigger" class="ml-1 text-neutral-300"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-neutral-100">
          Handle and display name are optional. You can fill them in now or update them later in
          settings.
        </div>
      </Popover>
    </li>
    <li>
      Defaults applied silently so you can see posts immediately.
      <Popover triggerType="mouseenter">
        <span slot="trigger" class="ml-1 text-neutral-300"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-neutral-100">
          We add starter relays and follows so your feed isn’t empty. You can remove or change them
          anytime after onboarding.
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
