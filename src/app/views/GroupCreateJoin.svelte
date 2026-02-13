<script lang="ts">
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

  export let groupId = ""
  export let preferredMode = ""
  export let missionTier: 0 | 1 | 2 | null = null
  export let label = ""

  let createGroupId = ""
  let createTitle = ""
  let createDescription = ""
  let joinGroupAddress = ""
  let pendingCreate = false
  let pendingJoin = false

  $: createPrompts = buildCreatePolicyPrompts(createGroupId)
  $: joinPrompts = buildJoinPolicyPrompts(joinGroupAddress)
  $: joinInviteHints = [
    preferredMode ? `Invite mode hint: ${preferredMode}` : "",
    missionTier === null ? "" : `Invite mission tier hint: ${missionTier}`,
    label ? `Invite label: ${label}` : "",
  ].filter(Boolean)
  $: if (groupId && !joinGroupAddress) {
    joinGroupAddress = groupId
  }

  const onCreate = async () => {
    const parsed = parseGroupAddressResult(createGroupId)

    if (!parsed.ok) {
      showWarning("Provide a valid group address before creating.")

      return
    }

    pendingCreate = true

    try {
      const result = await publishGroupCreateWithRecovery(
        {
          groupId: parsed.value.canonicalId,
          title: createTitle || undefined,
          description: createDescription || undefined,
        },
        "admin",
        1,
      )

      const message = getGroupCreateRecoveryMessage(result)

      if (result.ok) {
        showInfo(message)
        router.at(`groups/${encodeURIComponent(parsed.value.canonicalId)}/chat`).push()
      } else {
        showWarning(message)
      }
    } catch (error) {
      showWarning("Group create failed. Please retry.")
    } finally {
      pendingCreate = false
    }
  }

  const onJoin = async () => {
    const parsed = parseGroupAddressResult(joinGroupAddress)

    if (!parsed.ok) {
      showWarning("Provide a valid group address to join.")

      return
    }

    pendingJoin = true

    try {
      await publishGroupJoin({groupId: parsed.value.canonicalId})
      showInfo("Join request submitted.")
      router.at(`groups/${encodeURIComponent(parsed.value.canonicalId)}/chat`).push()
    } catch (error) {
      showWarning("Unable to submit join request.")
    } finally {
      pendingJoin = false
    }
  }

  $: document.title = "Create or Join Group"
</script>

<div class="panel p-4">
  <div class="flex items-center gap-2">
    <i class="fa fa-plus-circle text-accent" />
    <h2 class="text-lg uppercase tracking-[0.08em]">Create Group</h2>
  </div>

  <div class="mt-3 space-y-2">
    <Input placeholder="Group address (e.g. relay.example'ops)" bind:value={createGroupId} />
    <Input placeholder="Optional name" bind:value={createTitle} />
    <Input placeholder="Optional description" bind:value={createDescription} />
  </div>

  <div class="mt-3 space-y-2 text-sm">
    {#each createPrompts as prompt, i (`create-${i}`)}
      <div
        class="rounded border border-neutral-700 px-3 py-2"
        class:text-warning={prompt.level === "warning"}>
        {prompt.message}
      </div>
    {/each}
  </div>

  <div class="mt-4 flex justify-end">
    <button class="btn btn-accent" type="button" on:click={onCreate} disabled={pendingCreate}>
      {pendingCreate ? "Creating…" : "Create Group"}
    </button>
  </div>
</div>

<div class="panel p-4">
  <div class="flex items-center gap-2">
    <i class="fa fa-sign-in-alt text-accent" />
    <h2 class="text-lg uppercase tracking-[0.08em]">Join Group</h2>
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
