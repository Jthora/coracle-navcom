<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import Button from "src/partials/Button.svelte"
  import Input from "src/partials/Input.svelte"
  import Field from "src/partials/Field.svelte"

  export let selectedPath: "managed" | "import" | "external_signer" = "managed"
  export let loading = false
  export let error: string | null = null
  export let hasNip07 = false
  export let signerApps: {name: string; packageName: string; iconUrl: string}[] = []

  const dispatch = createEventDispatcher()

  let importValue = ""

  const select = (path: typeof selectedPath) => {
    selectedPath = path
    dispatch("select", {path})
  }

  const continueManaged = () => dispatch("managed")

  const continueImport = () => dispatch("import", {secret: importValue})

  const useExternal = () => dispatch("external")

  const useExtension = () => dispatch("extension")

  const useSignerApp = (app: {name: string; packageName: string; iconUrl: string}) =>
    dispatch("signerApp", {app})
</script>

<div class="flex flex-wrap items-start gap-3">
  <p
    class="-ml-1 -mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-base text-neutral-100">
    2/4
  </p>
  <div class="flex flex-col gap-1">
    <p class="text-2xl font-bold text-neutral-100">Choose your key path</p>
    <p class="text-neutral-200">
      Recommended: let Navcom manage your key so you can post now. Advanced: bring/import a key or
      use an external signer.
    </p>
  </div>
</div>

<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
  <div class={`panel space-y-2 p-4 ${selectedPath === "managed" ? "border-accent" : ""}`}>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-lg font-semibold text-neutral-100">Managed (recommended)</p>
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
      <p class="text-lg font-semibold text-neutral-100">Import your key</p>
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
    <p class="text-lg font-semibold text-neutral-100">Use external signer</p>
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

{#if hasNip07}
  <div
    class={`panel mt-3 space-y-2 p-4 ${selectedPath === "external_signer" ? "border-accent" : ""}`}>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-lg font-semibold text-neutral-100">Use browser extension</p>
      {#if selectedPath === "external_signer"}
        <span class="bg-accent/20 rounded-full px-2 py-0.5 text-xs text-accent">Selected</span>
      {/if}
    </div>
    <p class="text-neutral-300">Sign in with your installed NIP-07 browser extension.</p>
    <div class="flex flex-col gap-2 sm:flex-row">
      <Button
        class="btn btn-accent flex-1 whitespace-normal text-center"
        {loading}
        on:click={useExtension}>
        Use extension
      </Button>
      <Button
        class="btn flex-1 whitespace-normal text-center"
        on:click={() => select("external_signer")}>
        Keep selected
      </Button>
    </div>
  </div>
{/if}

{#if signerApps.length > 0}
  <div class="panel mt-3 space-y-2 p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-lg font-semibold text-neutral-100">Use signer app</p>
      <span class="bg-accent/20 rounded-full px-2 py-0.5 text-xs text-accent">Mobile</span>
    </div>
    <p class="text-neutral-300">Choose an installed signer app detected on this device.</p>
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {#each signerApps as app (app.packageName)}
        <Button
          class="btn flex w-full items-center justify-center gap-2 whitespace-normal text-center"
          on:click={() => useSignerApp(app)}>
          <img src={app.iconUrl} alt={app.name} width="20" height="20" />
          Use {app.name}
        </Button>
      {/each}
    </div>
  </div>
{/if}

{#if error}
  <p class="mt-3 text-sm text-warning">{error}</p>
{/if}
