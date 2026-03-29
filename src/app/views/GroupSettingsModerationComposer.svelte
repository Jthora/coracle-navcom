<script lang="ts">
  import Input from "src/partials/Input.svelte"

  export let adminUi
  export let GROUP_ADMIN_UI_CONTROL
  export let GROUP_MODERATION_ACTION
  export let moderationActions
  export let moderationReasonCodes
  export let moderationDraft
  export let canModerate

  export let onModerationActionChange
  export let onModerationReasonCodeChange
  export let onModerationNoteInput
  export let onModerationTargetPubkeyInput
  export let onSubmitModerationAction
</script>

{#if adminUi[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].visible}
  <div class="mt-3 rounded border border-nc-shell-border p-3">
    <h4 class="text-sm uppercase tracking-[0.08em] text-nc-text">Moderation Action Composer</h4>
    <div class="mt-2 grid gap-2 sm:grid-cols-3">
      <label class="text-sm text-nc-text">
        Action type
        <select
          class="mt-1 h-9 w-full rounded border border-nc-shell-border bg-nc-shell-deep px-3 text-nc-text"
          disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].enabled}
          value={moderationDraft.action}
          on:change={onModerationActionChange}>
          {#each moderationActions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>

      <label class="text-sm text-nc-text">
        Reason code
        <select
          class="mt-1 h-9 w-full rounded border border-nc-shell-border bg-nc-shell-deep px-3 text-nc-text"
          disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].enabled}
          value={moderationDraft.reasonCode}
          on:change={onModerationReasonCodeChange}>
          {#each moderationReasonCodes as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>

      <Input
        placeholder="Optional moderation note"
        disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].enabled}
        value={moderationDraft.note}
        on:input={onModerationNoteInput} />
    </div>

    {#if moderationDraft.action === GROUP_MODERATION_ACTION.REMOVE_MEMBER}
      <div class="mt-2">
        <Input
          placeholder="Target member pubkey (64-char hex)"
          disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].enabled}
          value={moderationDraft.targetPubkey}
          on:input={onModerationTargetPubkeyInput} />
      </div>
    {/if}

    <div class="mt-3 flex justify-end">
      <button class="btn" type="button" on:click={onSubmitModerationAction} disabled={!canModerate}>
        Submit Moderation Action
      </button>
    </div>
  </div>
{/if}
