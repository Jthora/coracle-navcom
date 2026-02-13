<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Input from "src/partials/Input.svelte"
  import Link from "src/partials/Link.svelte"
  import GroupAuditHistoryPanel from "src/app/views/GroupAuditHistoryPanel.svelte"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import {groupProjections, groupsHydrated} from "src/app/groups/state"
  import {
    createGroupAdminUiVisibilityMap,
    GROUP_ADMIN_UI_CONTROL,
    hasAnyVisibleAdminAction,
  } from "src/app/groups/admin-visibility"
  import {
    publishGroupMetadataEdit,
    publishGroupPutMember,
    publishGroupRemoveMember,
  } from "src/engine"
  import {
    ADMIN_DESTRUCTIVE_ACTION,
    buildDestructiveConfirmationToken,
    canRunDestructiveAction,
  } from "src/app/groups/admin-guardrails"
  import {
    asGroupPolicySummary,
    createDefaultGroupPolicyDraft,
    evaluateGroupPolicyDraft,
    isGroupPolicyDraftValid,
    type GroupMissionTier,
  } from "src/app/groups/policy"
  import {getSecureCapabilityGateMessage} from "src/app/groups/capability-gate"
  import {
    buildModerationReasonText,
    createDefaultModerationDraft,
    getModerationActionOptions,
    getModerationReasonCodeOptions,
    GROUP_MODERATION_ACTION,
    type GroupModerationAction,
    type GroupModerationReasonCode,
    validateModerationDraft,
  } from "src/app/groups/moderation-composer"

  export let groupId: string

  $: projection = $groupProjections.get(groupId)
  $: actorRole = ($pubkey && projection?.members[$pubkey]?.role) || "member"
  $: adminUi = createGroupAdminUiVisibilityMap(actorRole)
  $: canEditPolicy = adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].enabled
  $: canManageMembers = adminUi[GROUP_ADMIN_UI_CONTROL.PUT_MEMBER].enabled
  $: canRemoveMembers = adminUi[GROUP_ADMIN_UI_CONTROL.REMOVE_MEMBER].enabled
  $: canModerate = canEditPolicy || canRemoveMembers
  $: hasVisibleAdminActions = hasAnyVisibleAdminAction(adminUi)

  let policy = createDefaultGroupPolicyDraft()
  $: policyNotices = evaluateGroupPolicyDraft(policy)
  $: policyValid = isGroupPolicyDraftValid(policy)
  $: secureCapabilityWarning = getSecureCapabilityGateMessage({preferredMode: policy.preferredMode})

  const onPolicyTierChange = (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement

    policy = {...policy, tier: Number(target.value) as GroupMissionTier}
  }

  const onPolicyModeChange = (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement

    policy = {...policy, preferredMode: target.value as typeof policy.preferredMode}
  }

  const onPolicyDowngradeChange = (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement

    policy = {...policy, allowDowngrade: target.value === "true"}
  }

  let metadataTitle = ""
  let metadataDescription = ""
  let metadataPicture = ""
  let metadataReason = "policy-editor"

  $: if (projection) {
    metadataTitle = metadataTitle || projection.group.title || ""
    metadataDescription = metadataDescription || projection.group.description || ""
    metadataPicture = metadataPicture || projection.group.picture || ""
  }

  let memberPubkey = ""
  let memberRole: "member" | "moderator" | "admin" | "owner" = "member"
  let memberReason = ""

  let removePubkey = ""
  let removeReason = ""
  let destructiveConfirmInput = ""

  let moderationDraft = createDefaultModerationDraft()
  $: moderationActions = getModerationActionOptions()
  $: moderationReasonCodes = getModerationReasonCodeOptions()

  const onModerationActionChange = (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement

    moderationDraft = {
      ...moderationDraft,
      action: target.value as GroupModerationAction,
    }
  }

  const onModerationReasonCodeChange = (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement

    moderationDraft = {
      ...moderationDraft,
      reasonCode: target.value as GroupModerationReasonCode,
    }
  }

  const onModerationNoteInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement

    moderationDraft = {...moderationDraft, note: target.value}
  }

  const onModerationTargetPubkeyInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement

    moderationDraft = {...moderationDraft, targetPubkey: target.value}
  }

  $: destructiveToken = buildDestructiveConfirmationToken({
    action: ADMIN_DESTRUCTIVE_ACTION.REMOVE_MEMBER,
    groupId,
  })

  const onSavePolicyAndMetadata = async () => {
    if (!projection) return

    if (!policyValid) {
      showWarning("Policy is invalid for the selected tier. Resolve warnings before saving.")

      return
    }

    if (!canEditPolicy) {
      showWarning("You do not have permission to edit group settings.")

      return
    }

    try {
      await publishGroupMetadataEdit(
        {
          groupId,
          title: metadataTitle || undefined,
          description: metadataDescription || undefined,
          picture: metadataPicture || undefined,
          reason: `${metadataReason || "policy-update"}; ${asGroupPolicySummary(policy)}`,
        },
        actorRole,
      )
      showInfo("Group settings update submitted.")
    } catch (error) {
      showWarning("Unable to submit group settings update.")
    }
  }

  const onPutMember = async () => {
    if (!canManageMembers) {
      showWarning("You do not have permission to manage members.")

      return
    }

    if (!memberPubkey.trim()) {
      showWarning("Provide a member pubkey.")

      return
    }

    try {
      await publishGroupPutMember(
        {
          groupId,
          memberPubkey: memberPubkey.trim(),
          role: memberRole,
          reason: memberReason || undefined,
        },
        actorRole,
      )
      showInfo("Member update submitted.")
      memberReason = ""
    } catch (error) {
      showWarning("Unable to submit member update.")
    }
  }

  const onRemoveMember = async () => {
    if (!canRemoveMembers) {
      showWarning("You do not have permission to remove members.")

      return
    }

    const guardrail = canRunDestructiveAction({
      action: ADMIN_DESTRUCTIVE_ACTION.REMOVE_MEMBER,
      groupId,
      confirmationInput: destructiveConfirmInput,
      reason: removeReason,
    })

    if (!guardrail.ok) {
      showWarning(guardrail.message)

      return
    }

    if (!removePubkey.trim()) {
      showWarning("Provide the target member pubkey.")

      return
    }

    try {
      await publishGroupRemoveMember(
        {
          groupId,
          memberPubkey: removePubkey.trim(),
          reason: removeReason.trim(),
        },
        actorRole,
      )
      showInfo("Member removal submitted.")
      removeReason = ""
      destructiveConfirmInput = ""
    } catch (error) {
      showWarning("Unable to submit member removal.")
    }
  }

  const onSubmitModerationAction = async () => {
    if (!canModerate) {
      showWarning("You do not have permission to submit moderation actions.")

      return
    }

    const validation = validateModerationDraft(moderationDraft)

    if (!validation.ok) {
      showWarning(validation.message)

      return
    }

    const reason = buildModerationReasonText(moderationDraft)

    try {
      if (moderationDraft.action === GROUP_MODERATION_ACTION.REMOVE_MEMBER) {
        if (!canRemoveMembers) {
          showWarning("You do not have permission to remove members.")

          return
        }

        await publishGroupRemoveMember(
          {
            groupId,
            memberPubkey: moderationDraft.targetPubkey.trim(),
            reason,
          },
          actorRole,
        )
      } else {
        if (!canEditPolicy) {
          showWarning("You do not have permission to publish moderation notes.")

          return
        }

        await publishGroupMetadataEdit(
          {
            groupId,
            title: projection?.group.title || undefined,
            description: projection?.group.description || undefined,
            picture: projection?.group.picture || undefined,
            reason,
          },
          actorRole,
        )
      }

      showInfo("Moderation action submitted.")
      moderationDraft = {
        ...moderationDraft,
        note: "",
        targetPubkey: "",
      }
    } catch (error) {
      showWarning("Unable to submit moderation action.")
    }
  }

  $: document.title = projection
    ? `${projection.group.title || projection.group.id} · Admin`
    : "Group Admin"
</script>

{#if !$groupsHydrated}
  <div class="panel p-6 text-center text-neutral-300">Loading group admin panel…</div>
{:else if !projection}
  <div class="panel p-6 text-center text-neutral-200">
    <p>Group not found.</p>
    <div class="mt-4">
      <Link class="btn" href="/groups">Back to Groups</Link>
    </div>
  </div>
{:else}
  <div class="panel p-4">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg uppercase tracking-[0.08em]">Group Settings & Admin</h2>
      <span class="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300">
        Role: {actorRole}
      </span>
    </div>
  </div>

  {#if adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].visible}
    <div class="panel p-4">
      <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Policy Editor</h3>
      {#if !adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].enabled}
        <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-400">
          {adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].disabledReason}
        </div>
      {/if}
      <div class="mt-3 grid gap-2 sm:grid-cols-3">
        <label class="text-sm text-neutral-300">
          Mission tier
          <select
            class="mt-1 h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
            disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].enabled}
            bind:value={policy.tier}
            on:change={onPolicyTierChange}>
            <option value={0}>Tier 0</option>
            <option value={1}>Tier 1</option>
            <option value={2}>Tier 2</option>
          </select>
        </label>
        <label class="text-sm text-neutral-300">
          Preferred mode
          <select
            class="mt-1 h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
            disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].enabled}
            bind:value={policy.preferredMode}
            on:change={onPolicyModeChange}>
            <option value="baseline-nip29">baseline-nip29</option>
            <option value="secure-nip-ee">secure-nip-ee</option>
          </select>
        </label>
        <label class="text-sm text-neutral-300">
          Downgrade
          <select
            class="mt-1 h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
            disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].enabled}
            bind:value={policy.allowDowngrade}
            on:change={onPolicyDowngradeChange}>
            <option value={true}>Allowed</option>
            <option value={false}>Disallowed</option>
          </select>
        </label>
      </div>

      <div class="mt-3 space-y-2 text-sm">
        {#if secureCapabilityWarning}
          <div class="rounded border border-neutral-700 px-3 py-2 text-warning">
            {secureCapabilityWarning}
          </div>
        {/if}
        {#each policyNotices as notice, i (`policy-${i}`)}
          <div
            class="rounded border border-neutral-700 px-3 py-2"
            class:text-warning={notice.level === "warning"}>
            {notice.message}
          </div>
        {/each}
      </div>

      <div class="mt-3 space-y-2">
        <Input
          placeholder="Group title"
          bind:value={metadataTitle}
          disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].enabled} />
        <Input
          placeholder="Group description"
          bind:value={metadataDescription}
          disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].enabled} />
        <Input
          placeholder="Group picture URL"
          bind:value={metadataPicture}
          disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].enabled} />
        <Input
          placeholder="Change reason"
          bind:value={metadataReason}
          disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].enabled} />
      </div>

      <div class="mt-4 flex justify-end">
        <button
          class="btn btn-accent"
          type="button"
          on:click={onSavePolicyAndMetadata}
          disabled={!canEditPolicy || !policyValid}>
          Save Settings
        </button>
      </div>
    </div>
  {/if}

  {#if hasVisibleAdminActions}
    <div class="panel p-4">
      <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Admin Actions</h3>

      {#if adminUi[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].visible}
        <div class="mt-3 rounded border border-neutral-700 p-3">
          <h4 class="text-sm uppercase tracking-[0.08em] text-neutral-300">
            Moderation Action Composer
          </h4>
          <div class="mt-2 grid gap-2 sm:grid-cols-3">
            <label class="text-sm text-neutral-300">
              Action type
              <select
                class="mt-1 h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
                disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].enabled}
                bind:value={moderationDraft.action}
                on:change={onModerationActionChange}>
                {#each moderationActions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </label>

            <label class="text-sm text-neutral-300">
              Reason code
              <select
                class="mt-1 h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
                disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].enabled}
                bind:value={moderationDraft.reasonCode}
                on:change={onModerationReasonCodeChange}>
                {#each moderationReasonCodes as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </label>

            <Input
              placeholder="Optional moderation note"
              disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].enabled}
              bind:value={moderationDraft.note}
              on:input={onModerationNoteInput} />
          </div>

          {#if moderationDraft.action === GROUP_MODERATION_ACTION.REMOVE_MEMBER}
            <div class="mt-2">
              <Input
                placeholder="Target member pubkey (64-char hex)"
                disabled={!adminUi[GROUP_ADMIN_UI_CONTROL.MODERATION_COMPOSER].enabled}
                bind:value={moderationDraft.targetPubkey}
                on:input={onModerationTargetPubkeyInput} />
            </div>
          {/if}

          <div class="mt-3 flex justify-end">
            <button
              class="btn"
              type="button"
              on:click={onSubmitModerationAction}
              disabled={!canModerate}>
              Submit Moderation Action
            </button>
          </div>
        </div>
      {/if}

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
            <button
              class="btn"
              type="button"
              on:click={onRemoveMember}
              disabled={!canRemoveMembers}>
              Remove Member
            </button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="panel p-4">
      <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Admin Actions</h3>
      <p class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-400">
        No admin controls are available for your current role.
      </p>
    </div>
  {/if}

  {#if adminUi[GROUP_ADMIN_UI_CONTROL.AUDIT_HISTORY].visible}
    <GroupAuditHistoryPanel {projection} actorPubkey={$pubkey || undefined} />
  {/if}
{/if}
