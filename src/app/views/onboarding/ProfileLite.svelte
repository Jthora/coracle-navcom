<script lang="ts">
  import Button from "src/partials/Button.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Toggle from "src/partials/Toggle.svelte"

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
  <p
    class="-ml-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-base">
    3/4
  </p>
  <div class="flex flex-col gap-1">
    <p class="text-2xl font-bold">Profile (optional)</p>
    <p class="text-neutral-200">
      Add a handle or display name, or skip. Starter follows help you see posts immediately.
    </p>
  </div>
</div>

<div class="mt-4 space-y-4">
  <Field label="Handle (optional)">
    <Input
      name="handle"
      placeholder="handle"
      bind:value={handle}
      on:input={onHandleInput}
      autocomplete="off"
      autocapitalize="off"
      spellcheck={false} />
  </Field>
  <Field label="Display name (optional)">
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
      <p class="text-lg font-semibold">Starter follows</p>
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
