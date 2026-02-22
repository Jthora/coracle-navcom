<script lang="ts">
  import Input from "src/partials/Input.svelte"

  export let adminUi
  export let GROUP_ADMIN_UI_CONTROL
  export let canManageMembers = false
  export let canRemoveMembers = false
  export let memberPubkey = ""
  export let memberRole = "member"
  export let memberReason = ""
  export let removePubkey = ""
  export let removeReason = ""
  export let destructiveToken = ""
  export let destructiveConfirmInput = ""

  export let onPutMember
  export let onRemoveMember
</script>

{#if adminUi[GROUP_ADMIN_UI_CONTROL.PUT_MEMBER].visible}
  <div class="mt-3 grid gap-2 sm:grid-cols-3">
    <Input placeholder="Member pubkey" bind:value={memberPubkey} />
    <label class="text-sm text-neutral-300">
      Role
      <select
        class="mt-1 h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
        bind:value={memberRole}>
        <option value="member">member</option>
        <option value="moderator">moderator</option>
        <option value="admin">admin</option>
        <option value="owner">owner</option>
      </select>
    </label>
    <Input placeholder="Reason" bind:value={memberReason} />
  </div>

  <div class="mt-3 flex justify-end">
    <button class="btn" type="button" on:click={onPutMember} disabled={!canManageMembers}>
      Put Member
    </button>
  </div>
{/if}

{#if adminUi[GROUP_ADMIN_UI_CONTROL.REMOVE_MEMBER].visible}
  <div class="mt-6 border-t border-neutral-700 pt-4">
    <h4 class="text-sm uppercase tracking-[0.08em] text-danger">
      Destructive Action: Remove Member
    </h4>
    <div class="mt-2 grid gap-2 sm:grid-cols-2">
      <Input placeholder="Target member pubkey" bind:value={removePubkey} />
      <Input placeholder="Removal reason" bind:value={removeReason} />
    </div>
    <div class="mt-2 text-xs text-neutral-400">
      Type <strong>{destructiveToken}</strong> to confirm.
    </div>
    <div class="mt-2">
      <Input placeholder={destructiveToken} bind:value={destructiveConfirmInput} />
    </div>
    <div class="mt-3 flex justify-end">
      <button class="btn" type="button" on:click={onRemoveMember} disabled={!canRemoveMembers}>
        Remove Member
      </button>
    </div>
  </div>
{/if}
