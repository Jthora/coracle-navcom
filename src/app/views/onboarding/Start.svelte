<script lang="ts">
  import Button from "src/partials/Button.svelte"

  export let onContinue: () => void
  export let hasKey = false
  export let onSkipExisting: (() => void) | null = null
</script>

<div class="flex items-start gap-3">
  <p
    class="-ml-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-base">
    1/4
  </p>
  <div class="flex flex-col gap-1">
    <p class="text-2xl font-bold">Get started</p>
    <p class="text-neutral-200">
      Set up a Navcom key and post in under a minute. No jargon, minimal steps.
    </p>
  </div>
</div>
<div class="panel mt-4 space-y-3 p-4 text-neutral-200">
  <p>What to expect:</p>
  <ul class="list-disc space-y-1 pl-5 text-neutral-300">
    <li>We create a Navcom key for you (export anytime).</li>
    <li>Optional: bring your own key instead.</li>
    <li>Optional profile fields; you can skip.</li>
    <li>Defaults applied silently so you can see posts immediately.</li>
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
