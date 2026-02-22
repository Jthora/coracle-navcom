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
  $: policySummary = asGroupPolicySummary(policy)
  $: securityState = getProjectionSecurityState(projection, Boolean(secureCapabilityWarning))
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
    ? `${projection.group.title || projection.group.id} · ${adminSectionTitle}`
    : "Group Admin"

  $: if (projection) {
    uiMode = getGroupAdminMode(groupId)
  }
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
    <GroupBreadcrumbs items={breadcrumbs} />
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg uppercase tracking-[0.08em]">{adminSectionTitle} · Admin</h2>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <span class="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300">
          Role: {actorRole}
        </span>
        <span class="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300">
          {securityState.label}
        </span>
      </div>
    </div>
    <p class="mt-2 text-sm text-neutral-300">{adminSectionDescription}</p>
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
    <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
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
      <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Guided Summary</h3>
      <p class="mt-2 text-sm text-neutral-400">
        Advanced controls are hidden in guided mode. Current policy state remains preserved.
      </p>
      <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
        Current policy: <span class="text-neutral-100">{policySummary}</span>
      </div>
      <div class="mt-2 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-400">
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
      <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Admin Actions</h3>

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
      <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Admin Actions</h3>
      <p class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-400">
        No admin controls are available for your current role.
      </p>
    </div>
  {/if}

  {#if isExpertMode && adminUi[GROUP_ADMIN_UI_CONTROL.AUDIT_HISTORY].visible}
    <GroupAuditHistoryPanel {projection} actorPubkey={$pubkey || undefined} />
  {/if}
{/if}
