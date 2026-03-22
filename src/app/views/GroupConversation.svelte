<script lang="ts">
  import {formatTimestamp} from "@welshman/lib"
  import {signer, pubkey} from "@welshman/app"
  import {onMount, onDestroy} from "svelte"
  import {get} from "svelte/store"
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
  import {reportGroupError} from "src/app/groups/error-reporting"
  import {classifyGroupEventKind, GROUP_KINDS} from "src/domain/group-kinds"
  import {publishGroupMessage, setChecked} from "src/engine"
  import {resolveEpochKey} from "src/engine/group-transport-secure-ops"
  import {validateAndDecryptSecureGroupEventContent} from "src/engine/group-epoch-decrypt"
  import {parseSealedContent, sealedMetaToTags} from "src/engine/group-epoch-content"
  import {getGroupMessageEpochId} from "src/engine/group-epoch-message"
  import {adoptSecureGroupEpochState} from "src/engine/group-epoch-state"
  import {getActivePassphrase, loadPqcKeyPair} from "src/engine/pqc/pq-key-store"
  import {receiveEpochKeyShare} from "src/engine/group-epoch-key-share"
  import {storeKey} from "src/engine/keys/secure-store"
  import MessageTypeSelector from "src/app/views/MessageTypeSelector.svelte"
  import CheckInCard from "src/app/views/CheckInCard.svelte"
  import AlertCard from "src/app/views/AlertCard.svelte"
  import SitrepCard from "src/app/views/SitrepCard.svelte"
  import SpotrepCard from "src/app/views/SpotrepCard.svelte"
  import SitrepForm from "src/app/views/SitrepForm.svelte"
  import SpotrepForm from "src/app/views/SpotrepForm.svelte"
  import {composeDrafts, selectedMarkerId, selectedMessageId} from "src/app/navcom-mode"
  import {outboxStatus, getChannelQueue, refreshOutboxStatus} from "src/engine/offline/queue-status"
  import VirtualList from "src/app/shared/VirtualList.svelte"

  export let groupId: string

  type NavComMessageType = "message" | "check-in" | "alert" | "sitrep" | "spotrep"

  // Draft persistence: restore from composeDrafts store (localStorage-synced)
  let draft = $composeDrafts[groupId] || ""
  let pendingSend = false
  let downgradeBanner: string | null = null
  let inviteCue: string | null = null
  let didTrackSecurityShown = false
  let previousSecurityState: GroupSecurityState | "unknown" | null = null
  let selectedType: NavComMessageType = "message"
  let alertPriority: "low" | "medium" | "high" = "medium"
  const setAlertPriority = (val: string) => {
    alertPriority = val as "low" | "medium" | "high"
  }
  let showSitrepForm = false
  let showSpotrepForm = false
  let searchQuery = ""
  let showSearch = false

  // Progressive disclosure: show type selector after N messages sent
  const MSG_COUNT_KEY = "compose-message-count"
  const PHASE_A_THRESHOLD = 10
  const PHASE_B_THRESHOLD = 30

  function getSentCount(): number {
    try {
      return parseInt(localStorage.getItem(MSG_COUNT_KEY) || "0", 10) || 0
    } catch {
      return 0
    }
  }

  function incrementSentCount(): void {
    try {
      localStorage.setItem(MSG_COUNT_KEY, String(getSentCount() + 1))
    } catch {
      /* localStorage unavailable */
    }
  }

  let sentCount = getSentCount()
  $: showTypeSelector = sentCount >= PHASE_A_THRESHOLD
  $: showAdvancedTypes = sentCount >= PHASE_B_THRESHOLD

  // Persist draft to composeDrafts store on every change
  $: if (draft) {
    $composeDrafts = {...$composeDrafts, [groupId]: draft}
  } else if ($composeDrafts[groupId]) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {[groupId]: _, ...rest} = $composeDrafts
    $composeDrafts = rest
  }

  function getMessageType(event: {tags: string[][]}): string | null {
    const tag = event.tags.find(t => t[0] === "msg-type")
    return tag ? tag[1] : null
  }

  /** Check if a message has geo-location data (for marker-message linking) */
  function isGeoTagged(event: {tags: string[][]}): boolean {
    return event.tags.some(t => t[0] === "location" || t[0] === "g")
  }

  /** Handle hover on a geo-tagged message → highlight its marker on the map */
  function onMessageHover(messageId: string) {
    selectedMarkerId.set(messageId)
  }

  function onMessageLeave() {
    selectedMarkerId.set(null)
  }

  /** Scroll to and highlight a message when selected from the map */
  $: if ($selectedMessageId) {
    const el = document.getElementById(`msg-${$selectedMessageId}`)
    if (el) {
      el.scrollIntoView({behavior: "smooth", block: "center"})
      el.classList.add("ring-2", "ring-accent")
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-accent")
        selectedMessageId.set(null)
      }, 2000)
    }
  }

  // Minimal geohash encoder (base32, 6 chars ≈ ±610m)
  function simpleGeohash(lat: number, lng: number, precision: number): string {
    const base32 = "0123456789bcdefghjkmnpqrstuvwxyz"
    let minLat = -90,
      maxLat = 90,
      minLng = -180,
      maxLng = 180
    let hash = "",
      bits = 0,
      ch = 0,
      isEven = true
    while (hash.length < precision) {
      if (isEven) {
        const mid = (minLng + maxLng) / 2
        if (lng >= mid) {
          ch |= 1 << (4 - bits)
          minLng = mid
        } else {
          maxLng = mid
        }
      } else {
        const mid = (minLat + maxLat) / 2
        if (lat >= mid) {
          ch |= 1 << (4 - bits)
          minLat = mid
        } else {
          maxLat = mid
        }
      }
      isEven = !isEven
      if (++bits === 5) {
        hash += base32[ch]
        bits = 0
        ch = 0
      }
    }
    return hash
  }

  function onTypeSelect(event: CustomEvent<NavComMessageType>) {
    selectedType = event.detail
    if (selectedType === "sitrep") {
      showSitrepForm = true
      selectedType = "message" // reset selector
    } else if (selectedType === "spotrep") {
      showSpotrepForm = true
      selectedType = "message"
    } else if (selectedType === "check-in") {
      draft = draft || ""
    }
  }

  async function handleSitrepSubmit(
    e: CustomEvent<{content: string; severity: string; location: string | null}>,
  ) {
    const {content, severity, location} = e.detail
    const extraTags: string[][] = [
      ["msg-type", "sitrep"],
      ["severity", severity],
    ]
    if (location) {
      extraTags.push(["location", location])
      const parts = location.split(",")
      if (parts.length === 2) {
        const lat = parseFloat(parts[0])
        const lng = parseFloat(parts[1])
        if (!isNaN(lat) && !isNaN(lng)) {
          extraTags.push(["g", simpleGeohash(lat, lng, 6)])
        }
      }
    }
    try {
      await publishGroupMessage({groupId, content, extraTags})
      incrementSentCount()
      sentCount = getSentCount()
      showSitrepForm = false
      showInfo("SITREP sent.")
    } catch (err) {
      showWarning("Failed to send SITREP.")
    }
  }

  async function handleSpotrepSubmit(
    e: CustomEvent<{content: string; location: string; photoUrl: string | null}>,
  ) {
    const {content, location, photoUrl} = e.detail
    const extraTags: string[][] = [
      ["msg-type", "spotrep"],
      ["location", location],
    ]
    const parts = location.split(",")
    if (parts.length === 2) {
      const lat = parseFloat(parts[0])
      const lng = parseFloat(parts[1])
      if (!isNaN(lat) && !isNaN(lng)) {
        extraTags.push(["g", simpleGeohash(lat, lng, 6)])
      }
    }
    // NIP-92 imeta for photo attachment
    let finalContent = content
    if (photoUrl) {
      finalContent = `${content} ${photoUrl}`
      extraTags.push(["imeta", `url ${photoUrl}`, "m image/jpeg"])
    }
    try {
      await publishGroupMessage({groupId, content: finalContent, extraTags})
      incrementSentCount()
      sentCount = getSentCount()
      showSpotrepForm = false
      showInfo("SPOTREP sent.")
    } catch (err) {
      showWarning("Failed to send SPOTREP.")
    }
  }

  $: projection = $groupProjections.get(groupId)
  $: securityState = getProjectionSecurityState(projection, Boolean(downgradeBanner))
  $: groupTitle = projection?.group.title || groupId
  // Reset decryption cache when switching groups
  $: if (groupId) decryptedContent = new Map()
  $: messages = projection
    ? projection.sourceEvents
        .filter(event => classifyGroupEventKind(event.kind) === "message" && event.content)
        .slice()
        .sort(
          (left, right) => left.created_at - right.created_at || left.id.localeCompare(right.id),
        )
    : []

  $: searchLower = searchQuery.trim().toLowerCase()
  $: filteredMessages = searchLower
    ? messages.filter(m => getDisplayContent(m).toLowerCase().includes(searchLower))
    : messages
  $: searchMatchCount = searchLower ? filteredMessages.length : 0

  // PQC decryption layer: decrypt secure group messages for display
  let decryptedContent: Map<string, string> = new Map()
  let decryptionFailed: Set<string> = new Set()
  let decryptionPending = false
  let decryptionTrigger = 0

  async function decryptSecureMessages(msgs: typeof messages, gid: string) {
    if (decryptionPending) return
    decryptionPending = true

    try {
      const currentEpochId = projection?.group.currentEpochId
      if (!currentEpochId) return // WELCOME not received yet

      const passphrase = getActivePassphrase()
      if (!passphrase) return

      const epochKey = await resolveEpochKey(gid, currentEpochId, passphrase)
      if (!epochKey) return

      const next = new Map(decryptedContent)
      let changed = false

      for (const msg of msgs) {
        if (next.has(msg.id)) continue
        if (msg.kind !== GROUP_KINDS.NIP_EE.GROUP_EVENT) continue

        // Try current epoch key first
        const result = await validateAndDecryptSecureGroupEventContent({
          event: msg,
          expectedEpochId: currentEpochId,
          epochKeyBytes: epochKey,
        })

        if (result.ok && result.plaintext) {
          const sealed = parseSealedContent(result.plaintext)
          next.set(msg.id, sealed.text)
          // Re-inject sealed metadata as event tags for UI rendering
          const metaTags = sealedMetaToTags(sealed.meta)
          if (metaTags.length > 0) {
            msg.tags = [...msg.tags, ...metaTags]
          }
          changed = true
          continue
        }

        // Fallback: try the epoch tagged in the message (multi-epoch retention)
        const msgEpochId = getGroupMessageEpochId(msg)
        if (msgEpochId && msgEpochId !== currentEpochId) {
          const altKey = await resolveEpochKey(gid, msgEpochId, passphrase)
          if (altKey) {
            const altResult = await validateAndDecryptSecureGroupEventContent({
              event: msg,
              expectedEpochId: msgEpochId,
              epochKeyBytes: altKey,
            })
            if (altResult.ok && altResult.plaintext) {
              const altSealed = parseSealedContent(altResult.plaintext)
              next.set(msg.id, altSealed.text)
              const altMetaTags = sealedMetaToTags(altSealed.meta)
              if (altMetaTags.length > 0) {
                msg.tags = [...msg.tags, ...altMetaTags]
              }
              changed = true
              continue
            }
          }
        }

        // Both attempts failed — mark as decryption failure
        if (!next.has(msg.id)) {
          decryptionFailed = new Set([...decryptionFailed, msg.id])
        }
      }

      if (changed) {
        decryptedContent = next
      }
    } finally {
      decryptionPending = false
    }
  }

  $: if (
    projection?.group.transportMode === "secure-nip-ee" &&
    messages.length > 0 &&
    decryptionTrigger >= 0
  ) {
    decryptSecureMessages(messages, projection.group.id)
  }

  // Process incoming kind 446 key shares addressed to us
  let processedKeyShares = new Set<string>()
  let keyShareProcessing = false

  async function processIncomingKeyShares(gid: string) {
    if (keyShareProcessing || !projection) return
    keyShareProcessing = true

    try {
      const myPub = get(pubkey)
      if (!myPub) return

      const passphrase = getActivePassphrase()
      if (!passphrase) return

      const keyPair = await loadPqcKeyPair(myPub)
      if (!keyPair) return

      const keyShareEvents = projection.sourceEvents.filter(
        e =>
          e.kind === GROUP_KINDS.NIP_EE.EPOCH_KEY_SHARE &&
          !processedKeyShares.has(e.id) &&
          e.tags.some(t => t[0] === "p" && t[1] === myPub),
      )

      for (const event of keyShareEvents) {
        const result = await receiveEpochKeyShare(event.content, myPub, keyPair.secretKey)

        if (result.ok) {
          await storeKey(
            `pqc-group-master:${result.groupId}:epoch:${result.epochId}`,
            result.masterKey,
            passphrase,
            "pqc-secret",
            {groupId: result.groupId, epochId: result.epochId},
          )
          adoptSecureGroupEpochState(result.groupId, {
            epochId: result.epochId,
            sequence: result.epochSequence,
          })
          // Re-trigger decryption with new key
          decryptedContent = new Map()
          decryptionTrigger++
        }

        processedKeyShares = new Set([...processedKeyShares, event.id])
      }
    } finally {
      keyShareProcessing = false
    }
  }

  $: if (projection?.group.transportMode === "secure-nip-ee") {
    processIncomingKeyShares(groupId)
  }

  // Helper to get display content — decrypted if available, raw otherwise
  const getDisplayContent = (msg: {id: string; content: string}) =>
    decryptedContent.get(msg.id) || msg.content

  /** Check if a message failed decryption (integrity check or key mismatch) */
  const isDecryptionFailed = (msg: {id: string; kind?: number}) =>
    msg.kind === GROUP_KINDS.NIP_EE.GROUP_EVENT && decryptionFailed.has(msg.id)

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

  $: document.title = projection ? `${groupTitle} · Group Chat | NavCom` : "Group Chat | NavCom"

  // Offline queue: show pending/failed messages for this channel
  $: queuedForChannel = getChannelQueue($outboxStatus, groupId)

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
      const reported = reportGroupError({
        context: "invite-share",
        error,
        flow: "invite",
        groupId,
        source: "GroupConversation.onShareInvite",
      })
      showWarning(reported.userMessage)
      inviteCue = "Next: open Invite to continue with link or QR sharing."
    }
  }

  const onOpenInvite = () => {
    inviteCue = "Opening Invite: generate a link or QR, then share it with members."
    trackGroupTelemetry("group_invite_create_opened", {route: "group-chat"})
  }

  function toggleSearch() {
    showSearch = !showSearch
    if (!showSearch) {
      searchQuery = ""
    }
  }

  function onSearchKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      showSearch = false
      searchQuery = ""
    }
  }

  onMount(() => {
    ensureGroupsHydrated()
    refreshOutboxStatus()
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

    if (!content && selectedType === "message") {
      showWarning("Enter a message before sending.")
      return
    }

    if (!$signer) {
      showWarning("Sign in to send group messages.")
      return
    }

    // Build extraTags based on selected message type
    const extraTags: string[][] = []

    if (selectedType !== "message") {
      extraTags.push(["msg-type", selectedType])
    }

    if (selectedType === "alert") {
      extraTags.push(["priority", alertPriority])
    }

    // Auto-attach geolocation for check-in and alert
    if (
      (selectedType === "check-in" || selectedType === "alert") &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 5000}),
        )
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        extraTags.push(["location", `${lat},${lng}`])
        // Simple geohash from lat/lng (6 chars ≈ ±610m precision)
        extraTags.push(["g", simpleGeohash(lat, lng, 6)])
      } catch {
        // Location unavailable; send without it
      }
    }

    const sendContent = selectedType === "check-in" && !content ? "Check-in" : content

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
        content: sendContent,
        requestedMode: projection?.group?.transportMode || "baseline-nip29",
        recipients: activeRecipients,
        localState: projection,
        extraTags: extraTags.length > 0 ? extraTags : undefined,
      })

      if (isFirstMessageAttempt) {
        trackGroupTelemetry("group_first_message_succeeded", {
          entry_point: "chat_compose",
          security_runtime_state: securityState.state,
        })
      }

      trackGroupTelemetry("group_send_success", {
        messageLengthBucket:
          sendContent.length < 80 ? "short" : sendContent.length < 240 ? "medium" : "long",
      })
      draft = ""
      selectedType = "message"
      incrementSentCount()
      sentCount = getSentCount()
    } catch (error) {
      const reported = reportGroupError({
        context: "group-send",
        error,
        flow: "chat",
        groupId,
        source: "GroupConversation.onSend",
      })
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
          `${reported.userMessage} Retry will use backup relays in order: ${fallbackPlan.fallbacks.join(" → ")}.`,
        )
      } else {
        showWarning(reported.userMessage)
      }
    } finally {
      downgradeBanner = getGroupDowngradeBannerMessage(groupId)
      pendingSend = false
    }
  }
</script>

{#if !$groupsHydrated}
  <div class="panel p-6 text-center text-nc-text">Loading group chat…</div>
{:else if !projection}
  <div class="panel p-6 text-center text-nc-text">
    <p>Group not found.</p>
    <p class="mt-2 text-sm text-nc-text-muted">Open a valid group address to start chatting.</p>
    <div class="mt-4">
      <Link class="btn" href="/groups">Back to Groups</Link>
    </div>
  </div>
{:else}
  <div class="panel p-4">
    <GroupBreadcrumbs items={breadcrumbs} />
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold text-nc-text">{groupTitle}</h2>
        <p class="mt-1 text-sm text-nc-text">Group Chat</p>
        <div class="mt-2 flex flex-wrap gap-2 text-xs">
          <span class="rounded border border-nc-shell-border px-2 py-1 text-nc-text">
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
        <button class="btn" type="button" on:click={toggleSearch} title="Search messages">
          <i class="fa fa-search" />
        </button>
      </div>
    </div>
    <div class="mt-3 rounded border border-nc-shell-border px-3 py-2 text-sm text-nc-text">
      {securityState.hint}
    </div>
    {#if inviteCue}
      <div class="mt-2 rounded border border-nc-shell-border px-3 py-2 text-xs text-nc-text">
        {inviteCue}
      </div>
    {/if}
    {#if showSearch}
      <div class="mt-2 flex items-center gap-2">
        <div class="relative flex-1">
          <input
            type="text"
            bind:value={searchQuery}
            on:keydown={onSearchKeydown}
            placeholder="Search messages…"
            class="w-full rounded-lg border border-nc-shell-border bg-nc-input px-3 py-2 pl-8 text-sm text-nc-text placeholder-nc-text-muted focus:border-accent focus:outline-none" />
          <i
            class="fa fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-nc-text-muted" />
        </div>
        {#if searchLower}
          <span class="text-xs text-nc-text-muted"
            >{searchMatchCount} match{searchMatchCount !== 1 ? "es" : ""}</span>
        {/if}
        <button
          class="text-nc-text-muted transition-colors hover:text-nc-text"
          on:click={toggleSearch}>
          <i class="fa fa-times" />
        </button>
      </div>
    {/if}
  </div>

  <div class="panel p-4">
    <h3 class="text-sm uppercase tracking-[0.08em] text-nc-text">Conversation</h3>
    {#if filteredMessages.length > 50}
      <!-- Virtualized rendering for large message lists -->
      <div class="mt-3">
        <VirtualList
          count={filteredMessages.length}
          estimateSize={72}
          overscan={8}
          reverse={true}
          containerClass="h-[60vh] max-h-[600px]">
          <div slot="default" let:index>
            {@const message = filteredMessages[index]}
            {@const msgType = getMessageType(message)}
            {@const geoTagged = isGeoTagged(message)}
            {@const failed = isDecryptionFailed(message)}
            <div
              id="msg-{message.id}"
              class="pb-2 transition-shadow duration-300"
              on:mouseenter={() => geoTagged && onMessageHover(message.id)}
              on:mouseleave={() => geoTagged && onMessageLeave()}>
              {#if failed}
                <div
                  class="border-warning/50 bg-warning/10 rounded border px-3 py-2 text-sm text-warning">
                  <div class="flex items-center gap-2">
                    <i class="fa fa-exclamation-triangle" />
                    <span>Message integrity check failed — possible tampering</span>
                  </div>
                  <div class="mt-1 text-xs text-nc-text-muted">
                    <span class="font-mono">{asShortKey(message.pubkey)}</span> · {formatTimestamp(
                      message.created_at,
                    )}
                  </div>
                </div>
              {:else if msgType === "check-in"}
                <CheckInCard {message} />
              {:else if msgType === "alert"}
                <AlertCard {message} />
              {:else if msgType === "sitrep"}
                <SitrepCard {message} />
              {:else if msgType === "spotrep"}
                <SpotrepCard {message} />
              {:else}
                <div class="rounded border border-nc-shell-border px-3 py-2 text-sm text-nc-text">
                  <div class="flex items-center justify-between gap-2 text-xs text-nc-text-muted">
                    <span class="font-mono">{asShortKey(message.pubkey)}</span>
                    <span>{formatTimestamp(message.created_at)}</span>
                  </div>
                  <div class="mt-1 whitespace-pre-wrap break-words text-nc-text">
                    {getDisplayContent(message)}
                  </div>
                  {#if geoTagged}
                    <div class="mt-1 text-xs text-nc-text-muted">📍 Geo-tagged</div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </VirtualList>
      </div>
    {:else}
      <div class="mt-3 space-y-2">
        {#each filteredMessages as message (message.id)}
          {@const msgType = getMessageType(message)}
          {@const geoTagged = isGeoTagged(message)}
          {@const failed = isDecryptionFailed(message)}
          <div
            id="msg-{message.id}"
            class="transition-shadow duration-300"
            on:mouseenter={() => geoTagged && onMessageHover(message.id)}
            on:mouseleave={() => geoTagged && onMessageLeave()}>
            {#if failed}
              <div
                class="border-warning/50 bg-warning/10 rounded border px-3 py-2 text-sm text-warning">
                <div class="flex items-center gap-2">
                  <i class="fa fa-exclamation-triangle" />
                  <span>Message integrity check failed — possible tampering</span>
                </div>
                <div class="mt-1 text-xs text-nc-text-muted">
                  <span class="font-mono">{asShortKey(message.pubkey)}</span> · {formatTimestamp(
                    message.created_at,
                  )}
                </div>
              </div>
            {:else if msgType === "check-in"}
              <CheckInCard {message} />
            {:else if msgType === "alert"}
              <AlertCard {message} />
            {:else if msgType === "sitrep"}
              <SitrepCard {message} />
            {:else if msgType === "spotrep"}
              <SpotrepCard {message} />
            {:else}
              <div class="rounded border border-nc-shell-border px-3 py-2 text-sm text-nc-text">
                <div class="flex items-center justify-between gap-2 text-xs text-nc-text-muted">
                  <span class="font-mono">{asShortKey(message.pubkey)}</span>
                  <span>{formatTimestamp(message.created_at)}</span>
                </div>
                <div class="mt-1 whitespace-pre-wrap break-words text-nc-text">
                  {getDisplayContent(message)}
                </div>
                {#if geoTagged}
                  <div class="mt-1 text-xs text-nc-text-muted">📍 Geo-tagged</div>
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <p class="text-sm text-nc-text-muted">
            {searchLower
              ? "No messages match your search."
              : "No messages yet. Send the first group message."}
          </p>
        {/each}
      </div>
    {/if}

    <!-- Queued/failed messages from offline outbox -->
    <div class="mt-2 space-y-2">
      {#each queuedForChannel as queued (queued.id)}
        <div
          class="rounded border px-3 py-2 text-sm {queued.status === 'failed'
            ? 'border-red-700/50 bg-red-900/10'
            : 'bg-nc-shell-bg/50 border-nc-shell-border'}">
          <div class="flex items-center justify-between gap-2 text-xs text-nc-text-muted">
            <span class="font-mono">You</span>
            <span class="flex items-center gap-1">
              {#if queued.status === "queued"}
                <span title="Queued — will send when online">⏳</span>
              {:else if queued.status === "sending"}
                <span title="Sending..." class="animate-pulse">⏳</span>
              {:else if queued.status === "failed"}
                <span title="Failed after {queued.retryCount} retries">⚠️</span>
              {/if}
            </span>
          </div>
          <div class="mt-1 whitespace-pre-wrap break-words text-nc-text">{queued.content}</div>
          {#if queued.status === "failed"}
            <button
              type="button"
              class="text-red-400 hover:text-red-300 mt-1 text-xs"
              on:click={() => refreshOutboxStatus()}>
              Tap to retry
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="panel p-4">
    <h3 class="text-sm uppercase tracking-[0.08em] text-nc-text">Send Message</h3>

    {#if selectedType === "check-in"}
      <div
        class="bg-green-900/20 text-green-400 mt-2 flex items-center gap-2 rounded px-3 py-1.5 text-xs">
        <span>📍 CHECK-IN</span>
        <button
          type="button"
          class="ml-auto text-nc-text-muted hover:text-nc-text"
          on:click={() => (selectedType = "message")}>✕</button>
      </div>
    {:else if selectedType === "alert"}
      <div class="bg-red-900/20 mt-2 rounded px-3 py-1.5 text-xs">
        <div class="text-red-400 flex items-center gap-2">
          <span>🚨 ALERT</span>
          <div class="ml-2 flex gap-1">
            {#each ["low", "medium", "high"] as p}
              <button
                type="button"
                class="rounded px-2 py-0.5 text-xs {alertPriority === p
                  ? 'bg-nc-shell-border text-nc-text'
                  : 'text-nc-text-muted hover:text-nc-text'}"
                on:click={() => setAlertPriority(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            {/each}
          </div>
          <button
            type="button"
            class="ml-auto text-nc-text-muted hover:text-nc-text"
            on:click={() => (selectedType = "message")}>✕</button>
        </div>
      </div>
    {/if}

    <div class="mt-3 space-y-3">
      <div class="flex items-center gap-2">
        {#if showTypeSelector}
          <MessageTypeSelector showAdvanced={showAdvancedTypes} on:select={onTypeSelect} />
        {/if}
        <div class="flex-1">
          <Input
            placeholder={selectedType === "check-in"
              ? "Optional note..."
              : selectedType === "alert"
                ? "What's happening?"
                : "Type a message"}
            bind:value={draft}
            disabled={pendingSend} />
        </div>
      </div>
      <div class="flex justify-end">
        <button class="btn btn-accent" type="button" on:click={onSend} disabled={pendingSend}>
          {pendingSend
            ? "Sending…"
            : selectedType === "check-in"
              ? "📍 Check In"
              : selectedType === "alert"
                ? "🚨 Send Alert"
                : "Send"}
        </button>
      </div>
    </div>
  </div>

  <!-- Report form overlays -->
  {#if showSitrepForm}
    <div class="z-50 fixed inset-0 flex items-center justify-center bg-black/60">
      <SitrepForm on:submit={handleSitrepSubmit} on:cancel={() => (showSitrepForm = false)} />
    </div>
  {/if}

  {#if showSpotrepForm}
    <div class="z-50 fixed inset-0 flex items-center justify-center bg-black/60">
      <SpotrepForm on:submit={handleSpotrepSubmit} on:cancel={() => (showSpotrepForm = false)} />
    </div>
  {/if}
{/if}
