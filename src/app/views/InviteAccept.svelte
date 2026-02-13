<script lang="ts">
  import {session} from "@welshman/app"
  import {normalizeRelayUrl} from "@welshman/util"
  import {groupProjections} from "src/app/groups/state"
  import PersonList from "src/app/shared/PersonList.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import Onboarding from "src/app/views/Onboarding.svelte"
  import {
    getGroupInviteEntryMeta,
    resolveGroupInviteDestinationPath,
    resolveAutoJoinGroupInvite,
    resolveGroupInviteAcceptPayloads,
  } from "src/app/invite/accept"
  import Link from "src/partials/Link.svelte"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import {updateIn} from "src/util/misc"
  import {onMount} from "svelte"

  export let people = []
  export let relays = []
  export let groups = []

  const parsedRelays = relays
    .map(s => ({url: s.split("|")[0], claim: s.split("|")[1]}))
    .map(updateIn("url", normalizeRelayUrl))

  $: groupInviteResolution = resolveGroupInviteAcceptPayloads(groups)
  $: parsedGroups = groupInviteResolution.groups
  $: invalidGroupInviteCount = groupInviteResolution.invalidCount

  let autoJoinTriggered = false

  const hasActiveMembership = (groupId: string) => {
    const accountPubkey = $session?.pubkey

    if (!accountPubkey) return false

    const projection = $groupProjections.get(groupId)
    const membership = projection?.members[accountPubkey]

    return membership?.status === "active"
  }

  const getDestinationPath = (group: (typeof parsedGroups)[number]) =>
    resolveGroupInviteDestinationPath({
      group,
      hasActiveMembership: hasActiveMembership(group.groupId),
    })

  const getDestinationLabel = (group: (typeof parsedGroups)[number]) =>
    hasActiveMembership(group.groupId) ? "Open Group Chat" : "Open Join Flow"

  onMount(() => {
    const autoJoinTarget = resolveAutoJoinGroupInvite({
      hasSession: Boolean($session),
      groups: parsedGroups,
      invalidCount: invalidGroupInviteCount,
      peopleCount: people.length,
      relayCount: parsedRelays.length,
    })

    if (!autoJoinTarget || autoJoinTriggered) return

    autoJoinTriggered = true
    window.location.assign(getDestinationPath(autoJoinTarget))
  })
</script>

{#if $session}
  <div class="mb-4 flex flex-col items-center justify-center">
    <Heading>You've been invited</Heading>
    <p>
      You've been sent a nostr invite link! Take a look below to find some suggestions to improve
      your experience on nostr.
    </p>
  </div>
  {#if people.length > 0}
    <Card>
      <FlexColumn>
        <Subheading>People</Subheading>
        <p>Here are some people you might be interested in following.</p>
        <PersonList pubkeys={people} />
      </FlexColumn>
    </Card>
  {/if}
  {#if parsedRelays.length > 0}
    <Card>
      <FlexColumn>
        <Subheading>Relays</Subheading>
        <p>Below are a few relays that might help you connect to the people you want to reach.</p>
        <div class="grid grid-cols-1 gap-4">
          {#each parsedRelays as relay (relay.url)}
            <RelayCard url={relay.url} claim={relay.claim} />
          {/each}
        </div>
      </FlexColumn>
    </Card>
  {/if}
  {#if parsedGroups.length > 0}
    <Card>
      <FlexColumn>
        <Subheading>Groups</Subheading>
        <p>Use these group invite entries to open the join flow with prefilled context.</p>
        <div class="grid grid-cols-1 gap-4">
          {#each parsedGroups as group, i (`group-${group.groupId}-${i}`)}
            <div class="rounded border border-neutral-700 p-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-neutral-100">
                    {group.label || group.groupId}
                  </div>
                  {#if group.label}
                    <div class="text-xs text-neutral-400">{group.groupId}</div>
                  {/if}
                  {#if getGroupInviteEntryMeta(group)}
                    <div class="mt-1 text-xs text-neutral-400">
                      {getGroupInviteEntryMeta(group)}
                    </div>
                  {/if}
                </div>
                <Link class="btn" href={getDestinationPath(group)}
                  >{getDestinationLabel(group)}</Link>
              </div>
            </div>
          {/each}
        </div>
      </FlexColumn>
    </Card>
  {/if}
  {#if invalidGroupInviteCount > 0}
    <Card>
      <FlexColumn>
        <Subheading>Group Invite Warnings</Subheading>
        <p>
          {invalidGroupInviteCount} group invite entr{invalidGroupInviteCount === 1 ? "y" : "ies"}
          could not be validated and were ignored.
        </p>
      </FlexColumn>
    </Card>
  {/if}
  <Link class="btn btn-accent" href="/">Done</Link>
{:else}
  <Onboarding invite={{people, relays, groups: parsedGroups, parsedRelays}} />
{/if}
