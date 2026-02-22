<script lang="ts">
  import {onDestroy, onMount} from "svelte"
  import Input from "src/partials/Input.svelte"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import {router} from "src/app/util/router"
  import {
    getGroupCreateRecoveryMessage,
    publishGroupCreateWithRecovery,
    publishGroupJoin,
  } from "src/engine"
  import {parseGroupAddressResult} from "src/domain/group-id"
  import {buildCreatePolicyPrompts, buildJoinPolicyPrompts} from "src/app/groups/create-join"
  import {trackGroupTelemetry} from "src/app/groups/telemetry"
  import {
    getCreateGroupAddressResult,
    buildRelayGroupAddress,
    type GuidedCreateJoinFlow,
  } from "src/app/groups/guided-create-join"
  import {
    GUIDED_PRIVACY_OPTIONS,
    getGuidedSecurityStatus,
    getRecommendedRelayHost,
    type GuidedPrivacyLevel,
  } from "src/app/groups/guided-create-options"

  export let groupId = ""
  export let preferredMode = ""
  export let missionTier: 0 | 1 | 2 | null = null
  export let label = ""

  let flow: GuidedCreateJoinFlow = "start"
  let createRelayHost = ""
  let createRoomName = ""
  let createPrivacy: GuidedPrivacyLevel = "standard"
  let createGroupIdOverride = ""
  let createTitle = ""
  let createDescription = ""
  let joinGroupAddress = ""
  let createError = ""
  let joinError = ""
  let pendingCreate = false
  let pendingJoin = false
  let preferredRelayHost = "relay.example"
  let setupStartedAt = 0
  let setupCompleted = false
  let setupStarted = false
  let joinSubmittedAt = 0

  $: createGroupId = buildRelayGroupAddress(createRelayHost, createRoomName)
  $: createPrompts = buildCreatePolicyPrompts(createGroupIdOverride || createGroupId)
  $: createWarnings = [
    createRoomName && createGroupId && !createGroupId.endsWith(createRoomName.toLowerCase())
      ? "Room name is normalized to a relay-safe slug."
      : "",
    createRelayHost && !createRelayHost.includes(".")
      ? "Relay host looks incomplete; include a full host name when possible."
      : "",
  ].filter(Boolean)
  $: joinPrompts = buildJoinPolicyPrompts(joinGroupAddress)
  $: securityStatus = getGuidedSecurityStatus(createPrivacy)
  $: joinInviteHints = [
    preferredMode ? `Invite mode hint: ${preferredMode}` : "",
    missionTier === null ? "" : `Invite mission tier hint: ${missionTier}`,
    label ? `Invite label: ${label}` : "",
  ].filter(Boolean)

  $: if (groupId && !joinGroupAddress) {
    joinGroupAddress = groupId
    flow = "join"
  }

  $: preferredRelayHost = getRecommendedRelayHost(groupId)

  $: if (!createRelayHost && flow !== "join") {
    createRelayHost = preferredRelayHost
  }

  $: if (flow === "create") {
    joinError = ""
  }

  $: if (flow === "join") {
    createError = ""
  }

  const goToFlow = (nextFlow: GuidedCreateJoinFlow) => {
    flow = nextFlow
    trackGroupTelemetry("group_setup_flow_selected", {flow: nextFlow})

    if (nextFlow === "join") {
      trackGroupTelemetry(
        "group_join_started",
        {
          mode: "guided",
          entry_point: groupId ? "invite_prefill" : "manual_address",
        },
        {
          dedupeKey: `group-join-started-${groupId || "manual"}`,
          minIntervalMs: 10_000,
        },
      )
    }
  }

  const applyRecommendedRelay = () => {
    createRelayHost = preferredRelayHost
  }

  const onCreate = async () => {
    const createTarget = getCreateGroupAddressResult({
      relayHost: createRelayHost,
      roomName: createRoomName,
      manualAddress: createGroupIdOverride,
    })

    if (!createTarget.ok) {
      createError = createTarget.message
      showWarning(createTarget.message)

      return
    }

    createError = ""
    trackGroupTelemetry("group_setup_create_attempt", {
      privacy: createPrivacy,
      relayHost: createRelayHost,
      hasManualAddress: Boolean(createGroupIdOverride.trim()),
      mode: "guided",
      entry_point: groupId ? "invite_prefill" : "groups_create",
    })

    pendingCreate = true

    try {
      const result = await publishGroupCreateWithRecovery(
        {
          groupId: createTarget.canonicalId,
          title: createTitle || undefined,
          description: createDescription || undefined,
        },
        "admin",
        1,
      )

      const message = getGroupCreateRecoveryMessage(result)

      if (result.ok) {
        setupCompleted = true
        trackGroupTelemetry("group_setup_create_result", {
          result: "success",
          privacy: createPrivacy,
          mode: "guided",
        })
        trackGroupTelemetry("group_setup_completed", {
          mode: "guided",
          entry_point: groupId ? "invite_prefill" : "groups_create",
          elapsed_ms: setupStartedAt > 0 ? Date.now() - setupStartedAt : 0,
          result: "success",
        })
        showInfo(message)
        router.at(`groups/${encodeURIComponent(createTarget.canonicalId)}/chat`).push()
      } else {
        trackGroupTelemetry("group_setup_create_result", {
          result: "warning",
          privacy: createPrivacy,
          mode: "guided",
        })
        createError = `${message} You can retry now or review relay details.`
        showWarning(message)
      }
    } catch (error) {
      trackGroupTelemetry("group_setup_create_result", {
        result: "error",
        privacy: createPrivacy,
        mode: "guided",
      })
      createError = "Group create failed. Check relay details and retry."
      showWarning("Group create failed. Please retry.")
    } finally {
      pendingCreate = false
    }
  }

  const onJoin = async () => {
    const parsed = parseGroupAddressResult(joinGroupAddress)

    if (!parsed.ok) {
      joinError = "Provide a valid group address from an invite to continue."
      showWarning("Provide a valid group address to join.")

      return
    }

    joinError = ""
    trackGroupTelemetry("group_join_started", {
      mode: "guided",
      entry_point: groupId ? "invite_prefill" : "manual_address",
    })
    trackGroupTelemetry("group_setup_join_attempt", {
      hasPrefill: Boolean(groupId),
      mode: "guided",
    })
    trackGroupTelemetry("group_join_submitted", {
      mode: "guided",
      entry_point: groupId ? "invite" : "manual_address",
    })

    joinSubmittedAt = Date.now()

    pendingJoin = true

    try {
      await publishGroupJoin({groupId: parsed.value.canonicalId})
      setupCompleted = true
      trackGroupTelemetry("group_setup_join_result", {result: "success"})
      trackGroupTelemetry("group_setup_completed", {
        mode: "guided",
        entry_point: groupId ? "invite_prefill" : "manual_address",
        elapsed_ms: setupStartedAt > 0 ? Date.now() - setupStartedAt : 0,
        result: "success",
      })
      trackGroupTelemetry("group_join_active_detected", {
        entry_point: groupId ? "invite" : "manual_address",
        time_since_join_submit_ms: joinSubmittedAt > 0 ? Date.now() - joinSubmittedAt : 0,
      })
      showInfo("Join request submitted.")
      router.at(`groups/${encodeURIComponent(parsed.value.canonicalId)}/chat`).push()
    } catch (error) {
      trackGroupTelemetry("group_setup_join_result", {result: "error"})
      joinError =
        "Unable to submit join request. Confirm the address and relay reachability, then retry."
      showWarning("Unable to submit join request.")
    } finally {
      pendingJoin = false
    }
  }

  onMount(() => {
    if (setupStarted) return

    setupStarted = true
    setupStartedAt = Date.now()

    trackGroupTelemetry("group_setup_started", {
      mode: "guided",
      entry_point: groupId ? "invite_prefill" : "groups_create",
      room_context_present: false,
    })

    if (groupId) {
      trackGroupTelemetry("group_join_started", {
        mode: "guided",
        entry_point: "invite",
      })
    }
  })

  onDestroy(() => {
    if (!setupStarted || setupCompleted) return

    trackGroupTelemetry("group_setup_abandoned", {
      mode: "guided",
      entry_point: groupId ? "invite_prefill" : "groups_create",
      last_step: flow,
      elapsed_ms: setupStartedAt > 0 ? Date.now() - setupStartedAt : 0,
      result: "abandon",
    })
  })

  $: document.title =
    flow === "join" ? "Join Group" : flow === "create" ? "Create Group" : "Groups Setup"
</script>

<div class="panel p-4">
  <div class="flex items-center gap-2">
    <i class="fa fa-route text-accent" />
    <h2 class="text-lg uppercase tracking-[0.08em]">Group Setup</h2>
  </div>
  <p class="mt-3 text-neutral-300">Choose what you want to do first.</p>

  <div class="mt-4 grid gap-3 sm:grid-cols-2">
    <button
      class="btn"
      class:btn-accent={flow === "create"}
      type="button"
      on:click={() => goToFlow("create")}>
      <i class="fa-solid fa-plus" /> Create a room
    </button>
    <button
      class="btn"
      class:btn-accent={flow === "join"}
      type="button"
      on:click={() => goToFlow("join")}>
      <i class="fa-solid fa-right-to-bracket" /> Join from invite
    </button>
  </div>
</div>

{#if flow === "start"}
  <div class="panel p-6 text-sm text-neutral-300">
    Start by choosing <strong>Create a room</strong> or <strong>Join from invite</strong>.
  </div>
{/if}

{#if flow === "create"}
  <div class="panel p-4">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <i class="fa fa-plus-circle text-accent" />
        <h2 class="text-lg uppercase tracking-[0.08em]">Create Group</h2>
      </div>
      <button class="btn" type="button" on:click={() => goToFlow("start")}>Back</button>
    </div>

    <div class="mt-3 grid gap-2 sm:grid-cols-2">
      <Input placeholder="Room name (e.g. ops)" bind:value={createRoomName} />
      <Input placeholder="Relay host (e.g. relay.example)" bind:value={createRelayHost} />
      <button class="btn sm:col-span-2" type="button" on:click={applyRecommendedRelay}>
        Use recommended relay ({preferredRelayHost})
      </button>
      <div
        class="rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300 sm:col-span-2">
        <div class="mb-2 font-semibold text-neutral-100">Privacy level</div>
        <div class="space-y-2">
          {#each GUIDED_PRIVACY_OPTIONS as option}
            <label class="flex cursor-pointer items-start gap-2">
              <input
                type="radio"
                name="guided-privacy"
                value={option.id}
                checked={createPrivacy === option.id}
                on:change={() => (createPrivacy = option.id)} />
              <span>
                <span class="block text-neutral-100">{option.label}</span>
                <span class="block text-neutral-400">{option.description}</span>
              </span>
            </label>
          {/each}
        </div>
      </div>
      <Input class="sm:col-span-2" placeholder="Optional room title" bind:value={createTitle} />
      <Input
        class="sm:col-span-2"
        placeholder="Optional description"
        bind:value={createDescription} />
    </div>

    {#if createGroupId}
      <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
        Group address preview: <strong>{createGroupId}</strong>
      </div>
    {/if}

    <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
      <div class="font-semibold text-neutral-100">Security status: {securityStatus.badge}</div>
      <div class="mt-1 text-neutral-400">{securityStatus.hint}</div>
    </div>

    <details class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
      <summary class="cursor-pointer">Advanced: set group address manually</summary>
      <div class="mt-2">
        <Input
          placeholder="Group address (e.g. relay.example'ops)"
          bind:value={createGroupIdOverride} />
      </div>
    </details>

    {#if createError}
      <div class="mt-3 rounded border border-warning px-3 py-2 text-sm text-warning">
        {createError}
      </div>
    {/if}

    <div class="mt-3 space-y-2 text-sm">
      {#each createPrompts as prompt, i (`create-${i}`)}
        <div
          class="rounded border border-neutral-700 px-3 py-2"
          class:text-warning={prompt.level === "warning"}>
          {prompt.message}
        </div>
      {/each}
      {#each createWarnings as warning, i (`create-warning-${i}`)}
        <div class="rounded border border-neutral-700 px-3 py-2 text-neutral-300">{warning}</div>
      {/each}
    </div>

    <div class="mt-4 flex justify-end">
      <button class="btn btn-accent" type="button" on:click={onCreate} disabled={pendingCreate}>
        {pendingCreate ? "Creating…" : "Create Group"}
      </button>
    </div>
  </div>
{/if}

{#if flow === "join"}
  <div class="panel p-4">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <i class="fa fa-sign-in-alt text-accent" />
        <h2 class="text-lg uppercase tracking-[0.08em]">Join Group</h2>
      </div>
      <button class="btn" type="button" on:click={() => goToFlow("start")}>Back</button>
    </div>

    {#if groupId}
      <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
        Invite prefill detected for <strong>{groupId}</strong>.
      </div>
    {/if}

    <div class="mt-3">
      <Input placeholder="Group address" bind:value={joinGroupAddress} />
    </div>

    {#if joinInviteHints.length > 0}
      <div class="mt-3 space-y-2 text-sm text-neutral-300">
        {#each joinInviteHints as hint, i (`invite-hint-${i}`)}
          <div class="rounded border border-neutral-700 px-3 py-2">{hint}</div>
        {/each}
      </div>
    {/if}

    {#if joinError}
      <div class="mt-3 rounded border border-warning px-3 py-2 text-sm text-warning">
        {joinError}
      </div>
    {/if}

    <div class="mt-3 space-y-2 text-sm">
      {#each joinPrompts as prompt, i (`join-${i}`)}
        <div
          class="rounded border border-neutral-700 px-3 py-2"
          class:text-warning={prompt.level === "warning"}>
          {prompt.message}
        </div>
      {/each}
    </div>

    <div class="mt-4 flex justify-end">
      <button class="btn btn-accent" type="button" on:click={onJoin} disabled={pendingJoin}>
        {pendingJoin ? "Joining…" : "Join Group"}
      </button>
    </div>
  </div>
{/if}
