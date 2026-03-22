<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Link from "src/partials/Link.svelte"
  import GroupBreadcrumbs from "src/app/groups/GroupBreadcrumbs.svelte"
  import {buildGroupBreadcrumbItems, type GroupBreadcrumbSection} from "src/app/groups/breadcrumbs"
  import GroupAuditHistoryPanel from "src/app/views/GroupAuditHistoryPanel.svelte"
  import GroupSettingsModeSwitch from "src/app/views/GroupSettingsModeSwitch.svelte"
  import GroupSettingsExpertDiagnostics from "src/app/views/GroupSettingsExpertDiagnostics.svelte"
  import GroupSettingsPolicyEditorPanel from "src/app/views/GroupSettingsPolicyEditorPanel.svelte"
  import GroupSettingsMemberActionsPanel from "src/app/views/GroupSettingsMemberActionsPanel.svelte"
  import GroupRelayPolicyEditor from "src/app/views/GroupRelayPolicyEditor.svelte"
  import GroupSettingsModerationComposer from "src/app/views/GroupSettingsModerationComposer.svelte"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import {trackGroupTelemetry} from "src/app/groups/telemetry"
  import {emitRelayPolicyOutcomeTelemetry} from "src/app/groups/telemetry-stage3"
  import {groupProjections, groupsHydrated} from "src/app/groups/state"
  import {
    getGroupAdminMode,
    setGroupAdminMode,
    type GroupAdminMode,
  } from "src/app/groups/admin-mode"
  import {
    createGroupAdminUiVisibilityMap,
    GROUP_ADMIN_UI_CONTROL,
    hasAnyVisibleAdminAction,
  } from "src/app/groups/admin-visibility"
  import {
    publishGroupMetadataEdit,
    publishGroupPutMember,
    publishGroupRemoveMember,
    publishGroupLeave,
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
  import type {GuidedPrivacyLevel} from "src/app/groups/guided-create-options"
  import {getSecureCapabilityGateMessage} from "src/app/groups/capability-gate"
  import {
    createDefaultRoomRelayPolicy,
    loadRoomRelayPolicy,
    type RoomRelayPolicy,
  } from "src/app/groups/relay-policy"
  import {getProjectionSecurityState} from "src/app/groups/security-state"
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
  import {reportGroupError} from "src/app/groups/error-reporting"

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
  let policySecurityMode: GuidedPrivacyLevel = "basic"
  $: policyNotices = evaluateGroupPolicyDraft(policy)
  $: policyValid = isGroupPolicyDraftValid(policy)
  $: policySecurityMode = policy.preferredMode === "secure-nip-ee" ? "secure" : "basic"
  $: secureCapabilityWarning = getSecureCapabilityGateMessage({
    preferredMode: policy.preferredMode,
    securityMode: policySecurityMode,
  })
  $: policySummary = asGroupPolicySummary(policy)
  $: securityState = getProjectionSecurityState(
    projection,
    Boolean(secureCapabilityWarning),
    policySecurityMode,
  )
  $: adminSection =
    typeof window !== "undefined" && window.location.pathname.endsWith("/moderation")
      ? ("moderation" as GroupBreadcrumbSection)
      : ("settings" as GroupBreadcrumbSection)
  $: adminSectionTitle = adminSection === "moderation" ? "Moderation" : "Settings"
  $: adminSectionDescription =
    adminSection === "moderation"
      ? "Review moderation actions, enforce membership controls, and capture governance rationale."
      : "Configure group policy, relay behavior, and admin controls for this group."
  $: breadcrumbs = buildGroupBreadcrumbItems({
    section: adminSection,
    groupId,
    groupTitle: projection?.group.title || groupId,
  })

  let uiMode: GroupAdminMode = "guided"
  $: isExpertMode = uiMode === "expert"

  const onSelectMode = (mode: GroupAdminMode) => {
    uiMode = mode
    setGroupAdminMode(groupId, mode)
    trackGroupTelemetry("group_expert_mode_changed", {mode})
  }

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
  let relayPolicy: RoomRelayPolicy = createDefaultRoomRelayPolicy(groupId)

  $: if (projection) {
    relayPolicy = loadRoomRelayPolicy(groupId)
  }

  const onRelayPolicyChanged = (next: RoomRelayPolicy) => {
    relayPolicy = next
  }

  const onRelayPolicySaved = ({ok, message}: {ok: boolean; message: string}) => {
    emitRelayPolicyOutcomeTelemetry({
      emit: (event, props) => trackGroupTelemetry(event, props || {}),
      relayCount: relayPolicy.relays.length,
      ok,
    })

    if (ok) {
      showInfo(message)
    } else {
      showWarning(message)
    }
  }

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
      const reported = reportGroupError({
        context: "group-admin-save-policy",
        error,
        flow: "create",
        groupId,
        source: "group-settings-admin",
      })

      showWarning(reported.userMessage)
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
      const reported = reportGroupError({
        context: "group-admin-put-member",
        error,
        flow: "create",
        groupId,
        source: "group-settings-admin",
      })

      showWarning(reported.userMessage)
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
      const reported = reportGroupError({
        context: "group-admin-remove-member",
        error,
        flow: "create",
        groupId,
        source: "group-settings-admin",
      })

      showWarning(reported.userMessage)
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
      const reported = reportGroupError({
        context: "group-admin-moderation-submit",
        error,
        flow: "create",
        groupId,
        source: "group-settings-admin",
      })

      showWarning(reported.userMessage)
    }
  }

  let showLeaveConfirm = false
  let leaveConfirmInput = ""
  $: isGroupOwner = actorRole === "owner"
  $: leaveGroupTitle = projection?.group?.title || groupId
  $: leaveConfirmed =
    leaveConfirmInput.trim().toLowerCase() === leaveGroupTitle.trim().toLowerCase()

  const onLeaveGroup = async () => {
    if (!leaveConfirmed || isGroupOwner) return
    try {
      await publishGroupLeave({groupId}, actorRole)
      showInfo("You have left the group.")
      showLeaveConfirm = false
      leaveConfirmInput = ""
      // Navigate back to groups list
      window.location.hash = "#/groups"
    } catch (error) {
      const reported = reportGroupError({
        context: "group-admin-leave",
        error,
        flow: "create",
        groupId,
        source: "group-settings-admin",
      })
      showWarning(reported.userMessage)
    }
  }

  $: document.title = projection
    ? `${projection.group.title || projection.group.id} · ${adminSectionTitle} | NavCom`
    : "Group Admin | NavCom"

  $: if (projection) {
    uiMode = getGroupAdminMode(groupId)
  }
</script>

{#if !$groupsHydrated}
  <div class="panel p-6 text-center text-nc-text">Loading group admin panel…</div>
{:else if !projection}
  <div class="panel p-6 text-center text-nc-text">
    <p>Group not found.</p>
    <div class="mt-4">
      <Link class="btn" href="/groups">Back to Groups</Link>
    </div>
  </div>
{:else}
  <div class="panel p-4">
    <GroupBreadcrumbs items={breadcrumbs} />
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg uppercase tracking-[0.08em]">{adminSectionTitle} · Admin</h2>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <span class="rounded border border-nc-shell-border px-2 py-1 text-xs text-nc-text">
          Role: {actorRole}
        </span>
        <span class="rounded border border-nc-shell-border px-2 py-1 text-xs text-nc-text">
          {securityState.label}
        </span>
      </div>
    </div>
    <p class="mt-2 text-sm text-nc-text">{adminSectionDescription}</p>
    <div class="mt-3 flex flex-wrap gap-2 text-sm">
      <Link
        class={adminSection === "settings" ? "btn btn-accent" : "btn"}
        href={`/groups/${encodeURIComponent(groupId)}/settings`}>Settings</Link>
      <Link
        class={adminSection === "moderation" ? "btn btn-accent" : "btn"}
        href={`/groups/${encodeURIComponent(groupId)}/moderation`}>Moderation</Link>
      <Link class="btn" href={`/groups/${encodeURIComponent(groupId)}`}>Overview</Link>
      <Link class="btn" href={`/groups/${encodeURIComponent(groupId)}/chat`}>Chat</Link>
      <Link class="btn" href={`/groups/${encodeURIComponent(groupId)}/members`}>Members</Link>
    </div>
    <div class="mt-3 rounded border border-nc-shell-border px-3 py-2 text-sm text-nc-text">
      {securityState.hint}
    </div>
  </div>

  <GroupSettingsModeSwitch mode={uiMode} {onSelectMode} />

  {#if isExpertMode}
    <GroupSettingsExpertDiagnostics
      {projection}
      {actorRole}
      {secureCapabilityWarning}
      {policySummary} />

    <GroupRelayPolicyEditor
      policy={relayPolicy}
      onChange={onRelayPolicyChanged}
      onSaved={onRelayPolicySaved} />
  {:else}
    <div class="panel p-4">
      <h3 class="text-sm uppercase tracking-[0.08em] text-nc-text">Guided Summary</h3>
      <p class="mt-2 text-sm text-nc-text-muted">
        Advanced controls are hidden in guided mode. Current policy state remains preserved.
      </p>
      <div class="mt-3 rounded border border-nc-shell-border px-3 py-2 text-sm text-nc-text">
        Current policy: <span class="text-nc-text">{policySummary}</span>
      </div>
      <div class="mt-2 rounded border border-nc-shell-border px-3 py-2 text-sm text-nc-text-muted">
        Switch to Expert mode to edit advanced policy, diagnostics, and moderation controls.
      </div>
    </div>
  {/if}

  {#if isExpertMode && adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].visible}
    <GroupSettingsPolicyEditorPanel
      enabled={adminUi[GROUP_ADMIN_UI_CONTROL.POLICY_EDITOR].enabled}
      {policy}
      {policyNotices}
      {policyValid}
      bind:metadataTitle
      bind:metadataDescription
      bind:metadataPicture
      bind:metadataReason
      {onPolicyTierChange}
      {onPolicyModeChange}
      {onPolicyDowngradeChange}
      {onSavePolicyAndMetadata} />
  {/if}

  {#if isExpertMode && hasVisibleAdminActions}
    <div class="panel p-4">
      <h3 class="text-sm uppercase tracking-[0.08em] text-nc-text">Admin Actions</h3>

      <GroupSettingsModerationComposer
        {adminUi}
        {GROUP_ADMIN_UI_CONTROL}
        {GROUP_MODERATION_ACTION}
        {moderationActions}
        {moderationReasonCodes}
        {moderationDraft}
        {canModerate}
        {onModerationActionChange}
        {onModerationReasonCodeChange}
        {onModerationNoteInput}
        {onModerationTargetPubkeyInput}
        {onSubmitModerationAction} />

      <GroupSettingsMemberActionsPanel
        {adminUi}
        {GROUP_ADMIN_UI_CONTROL}
        {canManageMembers}
        {canRemoveMembers}
        bind:memberPubkey
        bind:memberRole
        bind:memberReason
        bind:removePubkey
        bind:removeReason
        {destructiveToken}
        bind:destructiveConfirmInput
        {onPutMember}
        {onRemoveMember} />
    </div>
  {:else if isExpertMode}
    <div class="panel p-4">
      <h3 class="text-sm uppercase tracking-[0.08em] text-nc-text">Admin Actions</h3>
      <p class="mt-3 rounded border border-nc-shell-border px-3 py-2 text-sm text-nc-text-muted">
        No admin controls are available for your current role.
      </p>
    </div>
  {/if}

  {#if isExpertMode && adminUi[GROUP_ADMIN_UI_CONTROL.AUDIT_HISTORY].visible}
    <GroupAuditHistoryPanel {projection} actorPubkey={$pubkey || undefined} />
  {/if}

  <!-- Danger Zone: Leave Group -->
  <div class="panel border-red-900/40 mt-6 border p-4">
    <h3 class="text-red-400 text-sm uppercase tracking-[0.08em]">Danger Zone</h3>
    {#if isGroupOwner}
      <p class="mt-2 text-sm text-nc-text-muted">
        Group owners cannot leave their own group. Transfer ownership first.
      </p>
    {:else if !showLeaveConfirm}
      <p class="mt-2 text-sm text-nc-text-muted">
        Leaving this group will remove your membership and you will lose access to group messages.
      </p>
      <button
        class="bg-red-900/30 text-red-300 hover:bg-red-900/50 mt-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        on:click={() => (showLeaveConfirm = true)}>
        Leave Group
      </button>
    {:else}
      <p class="mt-2 text-sm text-nc-text">
        Type <strong class="text-red-300">{leaveGroupTitle}</strong> to confirm:
      </p>
      <input
        type="text"
        bind:value={leaveConfirmInput}
        placeholder="Type group name to confirm"
        class="focus:border-red-500 mt-2 w-full rounded-lg border border-nc-shell-border bg-nc-input px-3 py-2 text-sm text-nc-text placeholder-nc-text-muted focus:outline-none" />
      <div class="mt-3 flex gap-2">
        <button
          class="rounded-lg bg-nc-input px-4 py-2 text-sm text-nc-text transition-colors hover:bg-nc-shell-border"
          on:click={() => {
            showLeaveConfirm = false
            leaveConfirmInput = ""
          }}>
          Cancel
        </button>
        <button
          class="rounded-lg px-4 py-2 text-sm font-medium transition-colors
            {leaveConfirmed
            ? 'bg-red-700 hover:bg-red-600 text-white'
            : 'cursor-not-allowed bg-nc-input text-nc-text-muted'}"
          disabled={!leaveConfirmed}
          on:click={onLeaveGroup}>
          Confirm Leave
        </button>
      </div>
    {/if}
  </div>
{/if}
