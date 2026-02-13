<script lang="ts">
  import {relaySearch} from "@welshman/app"
  import {identity, without} from "@welshman/lib"
  import {displayRelayUrl} from "@welshman/util"
  import PersonSelect from "src/app/shared/PersonSelect.svelte"
  import {router} from "src/app/util/router"
  import Button from "src/partials/Button.svelte"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Input from "src/partials/Input.svelte"
  import ListItem from "src/partials/ListItem.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import {showWarning} from "src/partials/Toast.svelte"
  import {
    buildInviteQueryParams,
    createDefaultInviteGroupDraft,
    getGroupInviteHints,
    toGroupInvitePayload,
    type InviteGroupDraft,
  } from "src/app/invite/create"
  import {toSpliced} from "src/util/misc"
  import {onMount} from "svelte"

  export let initialPubkey = null
  export let initialGroupAddress = null

  const showSection = section => {
    sections = [...sections, section]
  }

  const hideSection = section => {
    sections = without([section], sections)

    if (section === "people") {
      pubkeys = []
    }

    if (section === "relays") {
      relays = []
    }

    if (section === "groups") {
      group = createDefaultInviteGroupDraft(initialGroupAddress || "")
    }
  }

  const addRelay = url => {
    if (url) {
      relayInput.clear()
      relays = [...relays, {url, claim: ""}]
    }
  }

  const removeRelay = i => {
    relays = toSpliced(relays, i, 1)
  }

  let relayInput
  let sections = []
  let pubkeys = []
  let relays = []
  let group = createDefaultInviteGroupDraft(initialGroupAddress || "")
  $: groupHints = getGroupInviteHints(group)
  $: includePeople = sections.includes("people")
  $: includeRelays = sections.includes("relays")
  $: includeGroup = sections.includes("groups")
  $: hasGroupPayload = !!toGroupInvitePayload(group)
  $: canSubmit =
    (includePeople && pubkeys.length > 0) ||
    (includeRelays && relays.length > 0) ||
    (includeGroup && hasGroupPayload)

  const onGroupIdInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement

    group = {...group, groupId: target.value}
  }

  const onGroupModeChange = (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement

    group = {...group, preferredMode: target.value as InviteGroupDraft["preferredMode"]}
  }

  const onGroupMissionTierChange = (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement

    group = {...group, missionTier: Number(target.value) as InviteGroupDraft["missionTier"]}
  }

  const onGroupLabelInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement

    group = {...group, label: target.value}
  }

  const onSubmit = () => {
    if (includeGroup && !hasGroupPayload) {
      showWarning("Provide a valid group invite with supported mode and tier.")

      return
    }

    const params = buildInviteQueryParams({
      people: includePeople ? pubkeys : [],
      relays: includeRelays ? relays.map(({url, claim}) => ({url, claim})) : [],
      group: includeGroup ? group : undefined,
    })

    router
      .at("qrcode")
      .of(window.origin + "/invite?" + params.toString())
      .open()
  }

  onMount(() => {
    if (initialPubkey) {
      showSection("people")
      pubkeys = pubkeys.concat(initialPubkey)
    }

    if (initialGroupAddress) {
      showSection("groups")
      group = {
        ...group,
        groupId: initialGroupAddress,
      }
    }

    // Not sure why, but the inputs are getting automatically focused
    setTimeout(() => (document.activeElement as any).blur())
  })
</script>

<div class="mb-4 flex flex-col items-center justify-center">
  <Heading>Create an Invite</Heading>
  <p>
    Invite links allow you to help your friends onboard to nostr more easily, or get easy access to
    relays.
  </p>
</div>
{#each sections as section (section)}
  {#if section === "people"}
    <Card>
      <FlexColumn>
        <div class="flex justify-between">
          <Subheading>People</Subheading>
          <i class="fa fa-times cursor-pointer" on:click={() => hideSection("people")} />
        </div>
        <p>Suggest people to follow - this is especially useful for new users.</p>
        <PersonSelect multiple bind:value={pubkeys} />
      </FlexColumn>
    </Card>
  {:else if section === "relays"}
    <Card>
      <FlexColumn>
        <div class="flex justify-between">
          <Subheading>Relays</Subheading>
          <i class="fa fa-times cursor-pointer" on:click={() => hideSection("relays")} />
        </div>
        <p>
          Invite people to use specific relays. An invite code can optionally be provided to grant
          access to private relays.
        </p>
        {#each relays as relay, i (relay.url + i)}
          <ListItem on:remove={() => removeRelay(i)}>
            <span slot="label">{displayRelayUrl(relay.url)}</span>
            <span slot="data">
              <Input bind:value={relay.claim} placeholder="Claim (optional)" />
            </span>
          </ListItem>
        {/each}
        <SearchSelect
          value={null}
          bind:this={relayInput}
          search={$relaySearch.searchValues}
          termToItem={identity}
          onChange={url => addRelay(url)}>
          <i slot="before" class="fa fa-search" />
          <div slot="item" let:item>
            {displayRelayUrl(item)}
          </div>
        </SearchSelect>
      </FlexColumn>
    </Card>
  {:else if section === "groups"}
    <Card>
      <FlexColumn>
        <div class="flex justify-between">
          <Subheading>Group</Subheading>
          <i class="fa fa-times cursor-pointer" on:click={() => hideSection("groups")} />
        </div>
        <p>
          Add a group invite payload to this QR link. Recipients can use the group context for
          faster join onboarding.
        </p>

        <Input
          placeholder="Group address (e.g. relay.example'ops)"
          bind:value={group.groupId}
          on:input={onGroupIdInput} />

        <div class="grid gap-2 sm:grid-cols-2">
          <label class="text-sm text-neutral-300">
            Preferred mode
            <select
              class="mt-1 h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
              bind:value={group.preferredMode}
              on:change={onGroupModeChange}>
              <option value="baseline-nip29">baseline-nip29</option>
              <option value="secure-nip-ee">secure-nip-ee</option>
            </select>
          </label>

          <label class="text-sm text-neutral-300">
            Mission tier
            <select
              class="mt-1 h-9 w-full rounded border border-neutral-700 bg-neutral-900 px-3 text-neutral-100"
              bind:value={group.missionTier}
              on:change={onGroupMissionTierChange}>
              <option value={0}>Tier 0</option>
              <option value={1}>Tier 1</option>
              <option value={2}>Tier 2</option>
            </select>
          </label>
        </div>

        <Input
          placeholder="Optional group label"
          bind:value={group.label}
          on:input={onGroupLabelInput} />

        <div class="space-y-2 text-sm text-neutral-300">
          {#each groupHints as hint, i (`group-hint-${i}`)}
            <div class="rounded border border-neutral-700 px-3 py-2">{hint}</div>
          {/each}
        </div>
      </FlexColumn>
    </Card>
  {/if}
{/each}
<div class="flex justify-end gap-4">
  <Button disabled={sections.includes("people")} on:click={() => showSection("people")}>
    <i class="fa fa-plus" /> Add people
  </Button>
  <Button disabled={sections.includes("relays")} on:click={() => showSection("relays")}>
    <i class="fa fa-plus" /> Add relays
  </Button>
  <Button disabled={sections.includes("groups")} on:click={() => showSection("groups")}>
    <i class="fa fa-plus" /> Add group
  </Button>
</div>
<Button class="btn btn-accent" disabled={!canSubmit} on:click={onSubmit}>Create Invite Link</Button>
