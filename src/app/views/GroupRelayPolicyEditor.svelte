<script lang="ts">
  import Input from "src/partials/Input.svelte"
  import {
    createRelayEntry,
    getRelayFallbackPlan,
    removeRelayEntry,
    saveRoomRelayPolicy,
    updateRelayEntry,
    validateRelayPolicy,
    type RelayHealth,
    type RelayRole,
    type RoomRelayPolicy,
  } from "src/app/groups/relay-policy"

  export let policy: RoomRelayPolicy
  export let onChange: (policy: RoomRelayPolicy) => void
  export let onSaved: (result: {ok: boolean; message: string}) => void

  let newRelayUrl = ""
  let newRelayRole: RelayRole = "read-write"
  let newRelayPrivate = false
  let newRelayClaim = ""

  $: validation = validateRelayPolicy(policy)
  $: fallbackPlan = getRelayFallbackPlan(policy)

  const addRelay = () => {
    const relay = createRelayEntry({
      url: newRelayUrl,
      role: newRelayRole,
      isPrivate: newRelayPrivate,
      claim: newRelayClaim,
      health: "unknown",
    })

    onChange({...policy, relays: [...policy.relays, relay]})
    newRelayUrl = ""
    newRelayRole = "read-write"
    newRelayPrivate = false
    newRelayClaim = ""
  }

  const removeRelay = (relayId: string) => {
    onChange({...policy, relays: removeRelayEntry(policy.relays, relayId)})
  }

  const onRelayChange = (relayId: string, updates: Record<string, unknown>) => {
    onChange({
      ...policy,
      relays: updateRelayEntry(policy.relays, relayId, updates),
    })
  }

  const onRelayUrlInput = (relayId: string, event: Event) => {
    const target = event.currentTarget as HTMLInputElement

    onRelayChange(relayId, {url: target.value})
  }

  const onRelayRoleChange = (relayId: string, event: Event) => {
    const target = event.currentTarget as HTMLSelectElement

    onRelayChange(relayId, {role: target.value as RelayRole})
  }

  const onRelayHealthChange = (relayId: string, event: Event) => {
    const target = event.currentTarget as HTMLSelectElement

    onRelayChange(relayId, {health: target.value as RelayHealth})
  }

  const onRelayPrivateChange = (relayId: string, event: Event) => {
    const target = event.currentTarget as HTMLInputElement

    onRelayChange(relayId, {isPrivate: target.checked})
  }

  const onRelayClaimInput = (relayId: string, event: Event) => {
    const target = event.currentTarget as HTMLInputElement

    onRelayChange(relayId, {claim: target.value})
  }

  const onSave = () => {
    if (!validation.ok) {
      onSaved({ok: false, message: validation.errors[0] || "Relay policy is invalid."})

      return
    }

    saveRoomRelayPolicy(policy)
    onSaved({ok: true, message: "Relay policy saved."})
  }
</script>

<div class="panel p-4">
  <h3 class="text-sm uppercase tracking-[0.08em] text-nc-text">Room Relay Policy</h3>

  <div class="mt-3 space-y-2">
    {#each policy.relays as relay (relay.id)}
      <div class="rounded border border-nc-shell-border p-3">
        <div class="grid gap-2 sm:grid-cols-2">
          <Input
            value={relay.url}
            on:input={event => onRelayUrlInput(relay.id, event)}
            placeholder="wss://relay.example" />
          <label class="text-sm text-nc-text">
            Role
            <select
              class="mt-1 h-9 w-full rounded border border-nc-shell-border bg-nc-shell-deep px-3 text-nc-text"
              value={relay.role}
              on:change={event => onRelayRoleChange(relay.id, event)}>
              <option value="read">read</option>
              <option value="write">write</option>
              <option value="read-write">read-write</option>
            </select>
          </label>
          <label class="text-sm text-nc-text">
            Health
            <select
              class="mt-1 h-9 w-full rounded border border-nc-shell-border bg-nc-shell-deep px-3 text-nc-text"
              value={relay.health}
              on:change={event => onRelayHealthChange(relay.id, event)}>
              <option value="healthy">healthy</option>
              <option value="limited">limited</option>
              <option value="unreachable">unreachable</option>
              <option value="unknown">unknown</option>
            </select>
          </label>
          <label class="mt-7 inline-flex items-center gap-2 text-sm text-nc-text">
            <input
              type="checkbox"
              checked={relay.isPrivate}
              on:change={event => onRelayPrivateChange(relay.id, event)} />
            Private relay
          </label>
          {#if relay.isPrivate}
            <Input
              value={relay.claim || ""}
              on:input={event => onRelayClaimInput(relay.id, event)}
              placeholder="Claim token (optional)" />
          {/if}
        </div>

        <div class="mt-3 flex justify-end">
          <button class="btn" type="button" on:click={() => removeRelay(relay.id)}>Remove</button>
        </div>
      </div>
    {/each}
  </div>

  <div class="mt-4 rounded border border-nc-shell-border p-3">
    <h4 class="text-sm uppercase tracking-[0.08em] text-nc-text">Add Relay</h4>
    <div class="mt-2 grid gap-2 sm:grid-cols-2">
      <Input bind:value={newRelayUrl} placeholder="wss://relay.example" />
      <label class="text-sm text-nc-text">
        Role
        <select
          class="mt-1 h-9 w-full rounded border border-nc-shell-border bg-nc-shell-deep px-3 text-nc-text"
          bind:value={newRelayRole}>
          <option value="read">read</option>
          <option value="write">write</option>
          <option value="read-write">read-write</option>
        </select>
      </label>
      <label class="inline-flex items-center gap-2 text-sm text-nc-text">
        <input type="checkbox" bind:checked={newRelayPrivate} />
        Private relay
      </label>
      {#if newRelayPrivate}
        <Input bind:value={newRelayClaim} placeholder="Claim token (optional)" />
      {/if}
    </div>
    <div class="mt-3 flex justify-end">
      <button class="btn" type="button" on:click={addRelay} disabled={!newRelayUrl.trim()}
        >Add Relay</button>
    </div>
  </div>

  <div class="mt-3 space-y-2 text-sm">
    {#each validation.errors as error, i (`relay-error-${i}`)}
      <div class="rounded border border-warning px-3 py-2 text-warning">{error}</div>
    {/each}
    {#each validation.warnings as warning, i (`relay-warning-${i}`)}
      <div class="rounded border border-nc-shell-border px-3 py-2 text-nc-text">{warning}</div>
    {/each}
  </div>

  <div class="mt-3 rounded border border-nc-shell-border px-3 py-2 text-sm text-nc-text">
    <div class="font-semibold text-nc-text">Fallback path</div>
    <div class="mt-1">Primary write relay: {fallbackPlan.primary || "none"}</div>
    <div class="mt-1">
      Backup relays:
      {#if fallbackPlan.fallbacks.length > 0}
        {fallbackPlan.fallbacks.join(" → ")}
      {:else}
        none
      {/if}
    </div>
    <div class="mt-1 text-nc-text-muted">{fallbackPlan.guidance}</div>
  </div>

  <div class="mt-4 flex justify-end">
    <button class="btn btn-accent" type="button" on:click={onSave} disabled={!validation.ok}
      >Save Relay Policy</button>
  </div>
</div>
