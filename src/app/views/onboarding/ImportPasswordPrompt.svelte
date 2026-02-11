<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import Modal from "src/partials/Modal.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"

  export let open = false
  export let loading = false
  export let error: string | null = null

  const dispatch = createEventDispatcher()

  let password = ""

  const submit = () => {
    if (!password || loading) return
    dispatch("submit", {password})
  }

  const cancel = () => {
    password = ""
    if (!loading) dispatch("cancel")
  }
</script>

{#if open}
  <Modal onEscape={cancel}>
    <div class="space-y-3">
      <p class="text-xl font-bold">Decrypt your backup</p>
      <p class="text-neutral-200">Enter the password for your ncryptsec key to continue.</p>
      <Field label="Password">
        <Input
          type="password"
          bind:value={password}
          on:keydown={e => e.key === "Enter" && submit()} />
      </Field>
      {#if error}
        <p class="text-sm text-warning">{error}</p>
      {/if}
      <div class="flex gap-2">
        <Button class="btn" on:click={cancel} disabled={loading}>Cancel</Button>
        <Button class="btn btn-accent flex-1" on:click={submit} disabled={!password || loading}>
          {#if loading}
            <i class="fa fa-spinner fa-spin" /> Decrypting...
          {:else}
            Continue
          {/if}
        </Button>
      </div>
    </div>
  </Modal>
{/if}
