<script lang="ts">
  import Button from "src/partials/Button.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Popover from "src/partials/Popover.svelte"

  export let handle = ""
  export let displayName = ""
  export let starterFollows = true
  export let loading = false
  export let onChange: (values: {
    handle: string
    displayName: string
    starterFollows: boolean
  }) => void
  export let onContinue: () => void
  export let onBack: () => void

  const update = (
    partial: Partial<{handle: string; displayName: string; starterFollows: boolean}>,
  ) => {
    onChange({handle, displayName, starterFollows, ...partial})
  }

  const onHandleInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement
    update({handle: target?.value || ""})
  }

  const onDisplayNameInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement
    update({displayName: target?.value || ""})
  }
</script>

<div class="flex items-start gap-3">
  <div class="flex items-center gap-2">
    <p
      class="-ml-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-base text-neutral-100">
      3/4
    </p>
  </div>
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-2">
      <p class="text-2xl font-bold text-neutral-100">Profile (optional)</p>
      <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
        <span slot="trigger" class="text-neutral-300"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-neutral-100">
          Adding profile info is optional. You can skip now and edit it later in settings.
        </div>
      </Popover>
    </div>
    <p class="text-neutral-200">
      Add a handle or display name, or skip. Starter follows help you see posts immediately.
    </p>
  </div>
</div>

<div class="mt-4 space-y-4">
  <Field>
    <div slot="label" class="flex justify-between">
      <label
        class="flex items-center gap-2 font-semibold uppercase tracking-[0.06em] text-neutral-100">
        Handle (optional)
      </label>
      <Popover
        triggerType="mouseenter"
        class="inline-flex shrink-0 items-center align-middle text-neutral-300">
        <span slot="trigger"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-neutral-100">
          A short name others can mention you with. Avoid sensitive info; you can change it later.
        </div>
      </Popover>
    </div>
    <Input
      name="handle"
      placeholder="handle"
      bind:value={handle}
      on:input={onHandleInput}
      autocomplete="off"
      autocapitalize="off"
      spellcheck={false} />
  </Field>
  <Field>
    <div slot="label" class="flex justify-between">
      <label
        class="flex items-center gap-2 font-semibold uppercase tracking-[0.06em] text-neutral-100">
        Display name (optional)
      </label>
      <Popover
        triggerType="mouseenter"
        class="inline-flex shrink-0 items-center align-middle text-neutral-300">
        <span slot="trigger"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-neutral-100">
          How your name appears in feeds. Freeform text; you can edit it anytime.
        </div>
      </Popover>
    </div>
    <Input
      name="displayName"
      placeholder="Display name"
      bind:value={displayName}
      on:input={onDisplayNameInput}
      autocomplete="off"
      autocapitalize="sentences"
      spellcheck={false} />
  </Field>
  <div class="panel space-y-2 p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <p class="text-lg font-semibold">Starter follows</p>
        <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
          <span slot="trigger" class="text-neutral-300"><i class="fa fa-info-circle" /></span>
          <div slot="tooltip" class="max-w-xs text-sm text-neutral-100">
            Adds a small curated list so your feed isn’t empty. You can unfollow any of them later.
          </div>
        </Popover>
      </div>
      <Toggle bind:value={starterFollows} on:change={() => update({starterFollows})} />
    </div>
    <p class="text-neutral-300">
      Adds a small curated list so your feed isn’t empty. You can unfollow anytime.
    </p>
  </div>
</div>

<div class="mt-4 flex flex-col gap-2 sm:flex-row">
  <Button class="btn whitespace-normal text-center" on:click={onBack}>
    <i class="fa fa-arrow-left" /> Back
  </Button>
  <Button
    class="btn btn-accent flex-1 whitespace-normal text-center"
    {loading}
    on:click={onContinue}>
    Continue
  </Button>
</div>
