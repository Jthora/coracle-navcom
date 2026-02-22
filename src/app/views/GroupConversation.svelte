<script lang="ts">
  import {formatTimestamp} from "@welshman/lib"
  import {signer} from "@welshman/app"
  import {onMount, onDestroy} from "svelte"
  import Link from "src/partials/Link.svelte"
  import GroupBreadcrumbs from "src/app/groups/GroupBreadcrumbs.svelte"
  import {buildGroupBreadcrumbItems} from "src/app/groups/breadcrumbs"
  import Input from "src/partials/Input.svelte"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import {ensureGroupsHydrated, groupProjections, groupsHydrated} from "src/app/groups/state"
  import {getGroupDowngradeBannerMessage} from "src/app/groups/downgrade-banner"
  import {trackGroupTelemetry} from "src/app/groups/telemetry"
  import {
    emitRelayFallbackUsageTelemetry,
    emitSecurityStateTransitionTelemetry,
  } from "src/app/groups/telemetry-stage3"
  import {getRelayFallbackPlan, loadRoomRelayPolicy} from "src/app/groups/relay-policy"
  import type {GroupSecurityState} from "src/app/groups/security-state"
  import {getProjectionSecurityState} from "src/app/groups/security-state"
  import {
    getAbsoluteGroupJoinPrefillHref,
    getGroupInviteCreateHref,
  } from "src/app/groups/invite-share"
  import {classifyGroupEventKind} from "src/domain/group-kinds"
  import {publishGroupMessage, setChecked} from "src/engine"

  export let groupId: string

  let draft = ""
  let pendingSend = false
  let downgradeBanner: string | null = null
  let inviteCue: string | null = null
  let didTrackSecurityShown = false
  let previousSecurityState: GroupSecurityState | "unknown" | null = null

  $: projection = $groupProjections.get(groupId)
  $: securityState = getProjectionSecurityState(projection, Boolean(downgradeBanner))
  $: groupTitle = projection?.group.title || groupId
  $: messages = projection
    ? projection.sourceEvents
        .filter(event => classifyGroupEventKind(event.kind) === "message" && event.content)
        .slice()
        .sort(
          (left, right) => left.created_at - right.created_at || left.id.localeCompare(right.id),
        )
    : []
  $: activeRecipients = projection
    ? Object.values(projection.members || {})
        .filter(member => member?.status === "active" && typeof member?.pubkey === "string")
        .map(member => member.pubkey)
    : []
  $: breadcrumbs = buildGroupBreadcrumbItems({
    section: "chat",
    groupId,
    groupTitle: projection?.group.title || groupId,
  })

  $: document.title = projection ? `${groupTitle} · Group Chat` : "Group Chat"

  const baseRoute = () => `/groups/${encodeURIComponent(groupId)}`
  const inviteCreateHref = () => getGroupInviteCreateHref(groupId)

  const asShortKey = (pubkey: string) => `${pubkey.slice(0, 8)}…${pubkey.slice(-8)}`

  const markGroupRead = () => {
    setChecked(`groups/${groupId}`)
  }

  const onShareInvite = async () => {
    const url = getAbsoluteGroupJoinPrefillHref(groupId)

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: `${groupTitle} invite`,
          text: `Join ${groupTitle} on NAVCOM`,
          url,
        })

        trackGroupTelemetry("group_invite_share_success", {channel: "native-share"})
        showInfo("Invite link shared.")
        inviteCue = "Next: ask members to open the link to join this group."

        return
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        trackGroupTelemetry("group_invite_share_fallback", {channel: "clipboard"})
        showInfo("Invite link copied to clipboard.")
        inviteCue = "Next: paste the link in chat so members can open it and join."

        return
      }

      showWarning("Sharing is unavailable on this device. Open Invite to generate a QR link.")
      inviteCue = "Next: open Invite to generate a QR or link, then share it."
    } catch (error) {
      showWarning("Unable to share invite. Open Invite to continue.")
      inviteCue = "Next: open Invite to continue with link or QR sharing."
    }
  }

  const onOpenInvite = () => {
    inviteCue = "Opening Invite: generate a link or QR, then share it with members."
    trackGroupTelemetry("group_invite_create_opened", {route: "group-chat"})
  }

  onMount(() => {
    ensureGroupsHydrated()
    downgradeBanner = getGroupDowngradeBannerMessage(groupId)
    markGroupRead()
    trackGroupTelemetry("group_chat_opened", {
      route: "group-chat",
      groupIdShape: groupId.includes("'") ? "relay-address" : "opaque",
      resolved_transport_mode: projection?.group?.transportMode || "baseline-nip29",
      security_state: securityState.state,
      security_state_label: securityState.label,
    })
  })

  $: if (securityState?.state && !didTrackSecurityShown) {
    didTrackSecurityShown = true
    previousSecurityState = securityState.state

    trackGroupTelemetry("group_security_state_shown", {
      route: "group-chat",
      state: securityState.state,
      security_state: securityState.state,
      security_state_label: securityState.label,
      resolved_transport_mode: projection?.group?.transportMode || "baseline-nip29",
    })

    emitSecurityStateTransitionTelemetry({
      emit: (event, props) => trackGroupTelemetry(event, props || {}),
      route: "group-chat",
      previousState: "unknown",
      nextState: securityState.state,
    })
  }

  $: if (
    securityState?.state &&
    previousSecurityState &&
    previousSecurityState !== securityState.state
  ) {
    emitSecurityStateTransitionTelemetry({
      emit: (event, props) => trackGroupTelemetry(event, props || {}),
      route: "group-chat",
      previousState: previousSecurityState,
      nextState: securityState.state,
    })

    previousSecurityState = securityState.state
  }

  onDestroy(() => {
    markGroupRead()
    trackGroupTelemetry(
      "group_mark_read",
      {
        route: "group-chat",
      },
      {
        dedupeKey: `group-mark-read-${groupId}`,
        minIntervalMs: 15_000,
      },
    )
  })

  const onSend = async () => {
    const content = draft.trim()

    if (!content) {
      showWarning("Enter a message before sending.")

      return
    }

    if (!$signer) {
      showWarning("Sign in to send group messages.")

      return
    }

    const isFirstMessageAttempt = messages.length === 0

    trackGroupTelemetry("group_first_message_attempted", {
      route: "group-chat",
      entry_point: "chat_compose",
      is_first_message: isFirstMessageAttempt,
      security_state: securityState.state,
      security_state_label: securityState.label,
      resolved_transport_mode: projection?.group?.transportMode || "baseline-nip29",
    })

    pendingSend = true

    try {
      await publishGroupMessage({
        groupId,
        content,
        requestedMode: projection?.group?.transportMode || "baseline-nip29",
        recipients: activeRecipients,
        localState: projection,
      })

      if (isFirstMessageAttempt) {
        trackGroupTelemetry("group_first_message_succeeded", {
          entry_point: "chat_compose",
          security_runtime_state: securityState.state,
        })
      }

      trackGroupTelemetry("group_send_success", {
        messageLengthBucket:
          content.length < 80 ? "short" : content.length < 240 ? "medium" : "long",
      })
      draft = ""
    } catch (error) {
      const fallbackPlan = getRelayFallbackPlan(loadRoomRelayPolicy(groupId))

      if (fallbackPlan.primary) {
        emitRelayFallbackUsageTelemetry({
          emit: (event, props) => trackGroupTelemetry(event, props || {}),
          groupId,
          fallbackCount: fallbackPlan.fallbacks.length,
        })
      }

      trackGroupTelemetry("group_send_error", {
        errorType: error instanceof Error ? error.name || "Error" : "unknown",
      })

      if (isFirstMessageAttempt) {
        trackGroupTelemetry("group_first_message_failed", {
          entry_point: "chat_compose",
          error_type: error instanceof Error ? error.name || "Error" : "unknown",
        })
      }

      if (fallbackPlan.fallbacks.length > 0) {
        showWarning(
          `${error instanceof Error ? error.message : "Unable to send group message."} Retry will use backup relays in order: ${fallbackPlan.fallbacks.join(" → ")}.`,
        )
      } else {
        showWarning(error instanceof Error ? error.message : "Unable to send group message.")
      }
    } finally {
      downgradeBanner = getGroupDowngradeBannerMessage(groupId)
      pendingSend = false
    }
  }
</script>

{#if !$groupsHydrated}
  <div class="panel p-6 text-center text-neutral-300">Loading group chat…</div>
{:else if !projection}
  <div class="panel p-6 text-center text-neutral-200">
    <p>Group not found.</p>
    <p class="mt-2 text-sm text-neutral-400">Open a valid group address to start chatting.</p>
    <div class="mt-4">
      <Link class="btn" href="/groups">Back to Groups</Link>
    </div>
  </div>
{:else}
  <div class="panel p-4">
    <GroupBreadcrumbs items={breadcrumbs} />
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold text-neutral-50">{groupTitle}</h2>
        <p class="mt-1 text-sm text-neutral-300">Group Chat</p>
        <div class="mt-2 flex flex-wrap gap-2 text-xs">
          <span class="rounded border border-neutral-700 px-2 py-1 text-neutral-300">
            {securityState.label}
          </span>
        </div>
        {#if downgradeBanner}
          <p
            class="border-warning/50 bg-warning/10 mt-2 rounded border px-2 py-1 text-xs text-warning">
            {downgradeBanner}
          </p>
        {/if}
      </div>
      <div class="flex gap-2 text-sm">
        <Link class="btn btn-accent" href={`${baseRoute()}/chat`}>Chat</Link>
        <Link class="btn" href={baseRoute()}>Overview</Link>
        <Link class="btn" href={`${baseRoute()}/members`}>Members</Link>
        <Link class="btn" href={`${baseRoute()}/settings`}>Settings</Link>
        <Link class="btn" href={inviteCreateHref()} on:click={onOpenInvite}>Invite</Link>
        <button class="btn" type="button" on:click={onShareInvite}>Share</button>
      </div>
    </div>
    <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
      {securityState.hint}
    </div>
    {#if inviteCue}
      <div class="mt-2 rounded border border-neutral-700 px-3 py-2 text-xs text-neutral-300">
        {inviteCue}
      </div>
    {/if}
  </div>

  <div class="panel p-4">
    <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Conversation</h3>
    <div class="mt-3 space-y-2">
      {#each messages as message (message.id)}
        <div class="rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
          <div class="flex items-center justify-between gap-2 text-xs text-neutral-400">
            <span class="font-mono">{asShortKey(message.pubkey)}</span>
            <span>{formatTimestamp(message.created_at)}</span>
          </div>
          <div class="mt-1 whitespace-pre-wrap break-words text-neutral-100">{message.content}</div>
        </div>
      {:else}
        <p class="text-sm text-neutral-400">No messages yet. Send the first group message.</p>
      {/each}
    </div>
  </div>

  <div class="panel p-4">
    <h3 class="text-sm uppercase tracking-[0.08em] text-neutral-300">Send Message</h3>
    <div class="mt-3 space-y-3">
      <Input placeholder="Type a message" bind:value={draft} disabled={pendingSend} />
      <div class="flex justify-end">
        <button class="btn btn-accent" type="button" on:click={onSend} disabled={pendingSend}>
          {pendingSend ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  </div>
{/if}
