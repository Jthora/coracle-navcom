<script lang="ts">
  import {formatTimestamp} from "@welshman/lib"
  import {signer} from "@welshman/app"
  import {onMount, onDestroy} from "svelte"
  import Link from "src/partials/Link.svelte"
  import Input from "src/partials/Input.svelte"
  import {showWarning} from "src/partials/Toast.svelte"
  import {ensureGroupsHydrated, groupProjections, groupsHydrated} from "src/app/groups/state"
  import {trackGroupTelemetry} from "src/app/groups/telemetry"
  import {classifyGroupEventKind} from "src/domain/group-kinds"
  import {publishGroupMessage, setChecked} from "src/engine"

  export let groupId: string

  let draft = ""
  let pendingSend = false

  $: projection = $groupProjections.get(groupId)
  $: groupTitle = projection?.group.title || groupId
  $: messages = projection
    ? projection.sourceEvents
        .filter(event => classifyGroupEventKind(event.kind) === "message" && event.content)
        .slice()
        .sort(
          (left, right) => left.created_at - right.created_at || left.id.localeCompare(right.id),
        )
    : []

  $: document.title = projection ? `${groupTitle} · Group Chat` : "Group Chat"

  const baseRoute = () => `/groups/${encodeURIComponent(groupId)}`

  const asShortKey = (pubkey: string) => `${pubkey.slice(0, 8)}…${pubkey.slice(-8)}`

  const markGroupRead = () => {
    setChecked(`groups/${groupId}`)
  }

  onMount(() => {
    ensureGroupsHydrated()
    markGroupRead()
    trackGroupTelemetry("group_chat_opened", {
      route: "group-chat",
      groupIdShape: groupId.includes("'") ? "relay-address" : "opaque",
    })
  })

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

    pendingSend = true

    try {
      await publishGroupMessage({groupId, content})
      trackGroupTelemetry("group_send_success", {
        messageLengthBucket:
          content.length < 80 ? "short" : content.length < 240 ? "medium" : "long",
      })
      draft = ""
    } catch (error) {
      trackGroupTelemetry("group_send_error", {
        errorType: error instanceof Error ? error.name || "Error" : "unknown",
      })
      showWarning(error instanceof Error ? error.message : "Unable to send group message.")
    } finally {
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
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold text-neutral-50">{groupTitle}</h2>
        <p class="mt-1 text-sm text-neutral-300">Group Chat</p>
      </div>
      <div class="flex gap-2 text-sm">
        <Link class="btn" href={baseRoute()}>Overview</Link>
        <Link class="btn" href={`${baseRoute()}/members`}>Members</Link>
        <Link class="btn" href={`${baseRoute()}/settings`}>Settings</Link>
      </div>
    </div>
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
