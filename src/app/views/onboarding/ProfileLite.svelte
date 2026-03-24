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
      class="-ml-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-nc-input text-base text-nc-text">
      3/4
    </p>
  </div>
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-2">
      <p class="text-2xl font-bold text-nc-text">Operator card (optional)</p>
      <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
        <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          Your operator card is visible to other operators on the network. All fields are optional
          and can be changed later in settings.
        </div>
      </Popover>
    </div>
    <p class="text-nc-text">
      A callsign and display name help other operators identify you. Use operational handles, not
      personal information.
    </p>
  </div>
</div>

<div class="mt-4 space-y-4">
  <Field>
    <div slot="label" class="flex justify-between">
      <label
        class="flex items-center gap-2 font-semibold uppercase tracking-[0.06em] text-nc-text">
        Callsign (optional)
      </label>
      <Popover
        triggerType="mouseenter"
        class="inline-flex shrink-0 items-center align-middle text-nc-text">
        <span slot="trigger"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          A unique identifier other operators can use to reference you. Avoid real names or
          personally identifying information.
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
        class="flex items-center gap-2 font-semibold uppercase tracking-[0.06em] text-nc-text">
        Display name (optional)
      </label>
      <Popover
        triggerType="mouseenter"
        class="inline-flex shrink-0 items-center align-middle text-nc-text">
        <span slot="trigger"><i class="fa fa-info-circle" /></span>
        <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
          How your name appears in messages and on the map. Freeform text; editable anytime.
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
        <p class="text-lg font-semibold">Connect to default relay network</p>
        <Popover triggerType="mouseenter" class="inline-flex items-center align-middle">
          <span slot="trigger" class="text-nc-text"><i class="fa fa-info-circle" /></span>
          <div slot="tooltip" class="max-w-xs text-sm text-nc-text">
            Pre-configured relay connections so you can communicate immediately. You can modify
            relay configuration later in settings.
          </div>
        </Popover>
      </div>
      <Toggle bind:value={starterFollows} on:change={() => update({starterFollows})} />
    </div>
    <p class="text-nc-text">
      Pre-configured relay connections so you can communicate immediately. You can modify relay
      configuration later in settings.
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
