<script lang="ts">
  import Input from "src/partials/Input.svelte"

  export let enabled = false
  export let policy
  export let policyNotices
  export let policyValid = false
  export let metadataTitle = ""
  export let metadataDescription = ""
  export let metadataPicture = ""
  export let metadataReason = ""

  export let onPolicyTierChange
  export let onPolicyModeChange
  export let onPolicyDowngradeChange
  export let onSavePolicyAndMetadata
</script>

<div class="panel p-4">
  <h3 class="text-sm uppercase tracking-[0.08em] text-nc-text">Policy Editor</h3>
  {#if !enabled}
    <div class="mt-3 rounded border border-nc-shell-border px-3 py-2 text-sm text-nc-text-muted">
      You do not have permission to edit policy.
    </div>
  {/if}

  <div class="mt-3 grid gap-2 sm:grid-cols-3">
    <label class="text-sm text-nc-text">
      Mission tier
      <select
        class="mt-1 h-9 w-full rounded border border-nc-shell-border bg-nc-shell-deep px-3 text-nc-text"
        disabled={!enabled}
        bind:value={policy.tier}
        on:change={onPolicyTierChange}>
        <option value={0}>Tier 0</option>
        <option value={1}>Tier 1</option>
        <option value={2}>Tier 2</option>
      </select>
    </label>
    <label class="text-sm text-nc-text">
      Preferred mode
      <select
        class="mt-1 h-9 w-full rounded border border-nc-shell-border bg-nc-shell-deep px-3 text-nc-text"
        disabled={!enabled}
        bind:value={policy.preferredMode}
        on:change={onPolicyModeChange}>
        <option value="baseline-nip29">baseline-nip29</option>
        <option value="secure-nip-ee">secure-nip-ee</option>
      </select>
    </label>
    <label class="text-sm text-nc-text">
      Downgrade
      <select
        class="mt-1 h-9 w-full rounded border border-nc-shell-border bg-nc-shell-deep px-3 text-nc-text"
        disabled={!enabled}
        bind:value={policy.allowDowngrade}
        on:change={onPolicyDowngradeChange}>
        <option value={true}>Allowed</option>
        <option value={false}>Disallowed</option>
      </select>
    </label>
  </div>

  <div class="mt-3 space-y-2 text-sm">
    {#each policyNotices as notice, i (`policy-${i}`)}
      <div
        class="rounded border border-nc-shell-border px-3 py-2"
        class:text-warning={notice.level === "warning"}>
        {notice.message}
      </div>
    {/each}
  </div>

  <div class="mt-3 space-y-2">
    <Input placeholder="Group title" bind:value={metadataTitle} disabled={!enabled} />
    <Input placeholder="Group description" bind:value={metadataDescription} disabled={!enabled} />
    <Input placeholder="Group picture URL" bind:value={metadataPicture} disabled={!enabled} />
    <Input placeholder="Change reason" bind:value={metadataReason} disabled={!enabled} />
  </div>

  <div class="mt-4 flex justify-end">
    <button
      class="btn btn-accent"
      type="button"
      on:click={onSavePolicyAndMetadata}
      disabled={!enabled || !policyValid}>
      Save Settings
    </button>
  </div>
</div>
