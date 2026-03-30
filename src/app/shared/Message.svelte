<script lang="ts">
  import cx from "classnames"
  import {formatTimestamp} from "@welshman/lib"
  import {PublishStatus} from "@welshman/net"
  import {abortThunk, session, thunkHasStatus, thunks} from "@welshman/app"
  import {fly} from "svelte/transition"
  import {ticker} from "src/util/misc"
  import Modal from "src/partials/Modal.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Link from "src/partials/Link.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import NoteInfo from "src/app/shared/NoteInfo.svelte"
  import {getDmMessageSecurityState} from "src/app/shared/message-security"
  import {ensureMessagePlaintext, retryMessageDecryption, userSettings} from "src/engine"
  import {router} from "src/app/util/router"

  export let message

  let retrying = false

  const retryDecrypt = async () => {
    retrying = true
    try {
      await retryMessageDecryption(message)
    } finally {
      retrying = false
    }
  }

  const getContent = e => (e.kind === 4 ? ensureMessagePlaintext(e) : e.content) || ""

  const elapsed = ticker()

  let showDetails = false

  $: thunk = $thunks.find(t => t.event.id === message.id)
  $: remaining = Math.ceil($userSettings.send_delay / 1000) - $elapsed
  $: dmSecurity = getDmMessageSecurityState(message)
</script>

<div in:fly={{y: 20}} class="grid gap-2 py-1">
  <div
    class={cx("flex max-w-xl flex-col gap-2 rounded-2xl px-4 py-2", {
      "bg-nc-surface-elevated ml-12 justify-self-end rounded-br-none text-nc-text":
        message.pubkey === $session.pubkey,
      "mr-12 rounded-bl-none bg-nc-shell-deep": message.pubkey !== $session.pubkey,
    })}>
    {#if message.showProfile && message.pubkey !== $session.pubkey}
      <Link
        modal
        href={router.at("people").of(message.pubkey).toString()}
        class="relative z-feature flex items-center gap-2">
        <PersonCircle pubkey={message.pubkey} class="h-8 w-8" />
        <PersonName pubkey={message.pubkey} />
      </Link>
    {/if}
    <div class="break-words">
      {#await getContent(message)}
        <!-- pass -->
      {:then content}
        {#if content}
          <NoteContent showEntire note={{...message, content}} />
        {:else if message.kind === 4 && message.content}
          <div class="flex items-center gap-2 text-sm italic text-nc-text-muted">
            <i class="fa fa-lock text-xs" />
            <span>Message could not be decrypted</span>
            <button
              class="ml-1 cursor-pointer underline hover:text-nc-text"
              disabled={retrying}
              on:click={retryDecrypt}>
              {#if retrying}
                <i class="fa fa-circle-notch fa-spin text-xs" />
              {:else}
                Retry
              {/if}
            </button>
          </div>
        {:else}
          <NoteContent showEntire note={{...message, content}} />
        {/if}
      {/await}
    </div>
    <small
      class="mt-1 flex items-center justify-between gap-2 text-xs"
      class:text-nc-text-muted={message.pubkey === $session.pubkey}
      class:text-nc-text={message.pubkey !== $session.pubkey}>
      {#if thunk}
        {#if thunkHasStatus(PublishStatus.Pending, thunk)}
          <div class="flex items-center gap-1">
            <i class="fa fa-circle-notch fa-spin"></i>
            Sending...
            {#if remaining > 0}
              <button
                class="cursor-pointer py-1 text-nc-text-muted underline"
                on:click={() => abortThunk(thunk)}>Cancel</button>
            {/if}
          </div>
        {:else}
          {formatTimestamp(message.created_at)}
        {/if}
      {:else}
        {formatTimestamp(message.created_at)}
      {/if}
      <div class="flex items-center gap-3">
        <i
          class="fa fa-info-circle cursor-pointer text-nc-text-muted"
          on:click={() => (showDetails = true)} />
        {#if message.kind === 4}
          {#if dmSecurity}
            <span
              class="rounded border border-nc-shell-border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]">
              {dmSecurity.badge}
            </span>
          {/if}
          <Popover triggerType="mouseenter">
            <i
              slot="trigger"
              class={`fa fa-${dmSecurity?.icon === "lock" ? "lock" : "unlock"} cursor-pointer text-nc-text-muted`} />
            <div slot="tooltip" class="flex max-w-xs flex-col gap-2">
              {#if dmSecurity?.icon === "lock"}
                <p>
                  This message was sent with Navcom PQC DM mode ({dmSecurity?.badge}).
                </p>
              {:else}
                <p>
                  This message was sent using nostr's legacy DMs, which have a number of
                  shortcomings. Read more <Link class="underline" modal href="/help/nip-17-dms"
                    >here</Link
                  >.
                </p>
              {/if}

              {#if dmSecurity?.warning}
                <p>{dmSecurity.warning}</p>
              {/if}
            </div>
          </Popover>
        {:else}
          <Popover triggerType="mouseenter">
            <i slot="trigger" class="fa fa-lock cursor-pointer text-nc-text-muted" />
            <div slot="tooltip" class="flex flex-col gap-2">
              <p>
                This message was sent using nostr's new group chat specification, which solves
                several problems with legacy DMs. Read more <Link
                  class="underline"
                  modal
                  href="/help/nip-17-dms">here</Link
                >.
              </p>
              {#if message.pubkey === $session.pubkey}
                <p>
                  Note that these messages are not yet universally supported. Make sure the person
                  you're chatting with is using a compatible nostr client.
                </p>
              {/if}
            </div>
          </Popover>
        {/if}
      </div>
    </small>
  </div>
</div>

{#if showDetails}
  <Modal onEscape={() => (showDetails = false)}>
    <NoteInfo event={message} />
  </Modal>
{/if}
