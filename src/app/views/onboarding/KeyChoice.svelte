<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import Button from "src/partials/Button.svelte"
  import Input from "src/partials/Input.svelte"
  import Field from "src/partials/Field.svelte"

  export let selectedPath: "managed" | "import" | "external_signer" = "managed"
  export let loading = false
  export let error: string | null = null

  const dispatch = createEventDispatcher()

  let importValue = ""

  const select = (path: typeof selectedPath) => {
    selectedPath = path
    dispatch("select", {path})
  }

  const continueManaged = () => dispatch("managed")

  const continueImport = () => dispatch("import", {secret: importValue})

  const useExternal = () => dispatch("external")
</script>

<div class="flex flex-wrap items-start gap-3">
  <p
    class="-ml-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-base">
    2/4
  </p>
  <div class="flex flex-col gap-1">
    <p class="text-2xl font-bold">Choose your key path</p>
    <p class="text-neutral-200">
      Recommended: let Navcom manage your key so you can post now. Advanced: bring/import a key or
      use an external signer.
    </p>
  </div>
</div>

<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
  <div class={`panel space-y-2 p-4 ${selectedPath === "managed" ? "border-accent" : ""}`}>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-lg font-semibold">Managed (recommended)</p>
      {#if selectedPath === "managed"}
        <span class="bg-accent/20 rounded-full px-2 py-0.5 text-xs text-accent">Selected</span>
      {/if}
    </div>
    <p class="text-neutral-300">We generate and store a Navcom key. You can export it anytime.</p>
    <div class="flex flex-col gap-2 sm:flex-row">
      <Button
        class="btn btn-accent flex-1 whitespace-normal text-center"
        {loading}
        on:click={continueManaged}>
        Use recommended
      </Button>
      <Button class="btn flex-1 whitespace-normal text-center" on:click={() => select("managed")}
        >Keep selected</Button>
    </div>
  </div>

  <div class={`panel space-y-3 p-4 ${selectedPath === "import" ? "border-accent" : ""}`}>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-lg font-semibold">Import your key</p>
      {#if selectedPath === "import"}
        <span class="bg-accent/20 rounded-full px-2 py-0.5 text-xs text-accent">Selected</span>
      {/if}
    </div>
    <p class="text-neutral-300">
      Paste an existing nsec. You keep custody; we remind you to back it up.
    </p>
    <Field label="nsec key">
      <Input
        name="nsec"
        placeholder="nsec1..."
        bind:value={importValue}
        on:focus={() => select("import")}
        autocomplete="off"
        autocapitalize="off"
        spellcheck={false} />
    </Field>
    <div class="flex flex-col gap-2 sm:flex-row">
      <Button
        class="btn btn-accent flex-1 whitespace-normal text-center"
        {loading}
        on:click={continueImport}>
        Use this key
      </Button>
      <Button class="btn flex-1 whitespace-normal text-center" on:click={() => select("import")}>
        Keep selected
      </Button>
    </div>
  </div>
</div>

<div class="panel mt-3 space-y-2 p-4">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <p class="text-lg font-semibold">Use external signer</p>
    {#if selectedPath === "external_signer"}
      <span class="bg-accent/20 rounded-full px-2 py-0.5 text-xs text-accent">Selected</span>
    {/if}
  </div>
  <p class="text-neutral-300">
    Use your browser/mobile signer. We’ll try it and offer a managed fallback if it fails.
  </p>
  <div class="flex flex-col gap-2 sm:flex-row">
    <Button
      class="btn flex-1 whitespace-normal text-center"
      on:click={() => select("external_signer")}>
      Select signer
    </Button>
    <Button class="btn btn-low flex-1 whitespace-normal text-center" on:click={useExternal}>
      Open signer options
    </Button>
  </div>
</div>

{#if error}
  <p class="mt-3 text-sm text-warning">{error}</p>
{/if}
