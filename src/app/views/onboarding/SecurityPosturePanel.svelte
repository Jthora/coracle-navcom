<script lang="ts">
  let expanded = false
</script>

<button
  class="panel mt-3 w-full cursor-pointer p-3 text-left text-nc-text"
  on:click={() => (expanded = !expanded)}>
  <div class="flex items-center justify-between">
    <span class="text-sm font-semibold uppercase tracking-wide">
      What's Protected / What's Visible
    </span>
    <i class="fa fa-chevron-{expanded ? 'up' : 'down'} text-xs" />
  </div>

  {#if expanded}
    <div class="mt-3 space-y-3 text-sm">
      <div>
        <p class="font-semibold text-success">🔒 Protected</p>
        <ul class="mt-1 list-disc space-y-1 pl-5">
          <li>Message content in encrypted groups (end-to-end, only group members can read)</li>
          <li>Your private key (never leaves this device, never transmitted to any server)</li>
          <li>Group membership details in Tier 2 groups (dedicated relay isolation)</li>
          <li>Direct message content (NIP-44 encrypted between sender and recipient)</li>
        </ul>
      </div>
      <div>
        <p class="font-semibold text-warning">👁 Visible to relay operators</p>
        <ul class="mt-1 list-disc space-y-1 pl-5">
          <li>Your public key (this is your identity on the network — by design)</li>
          <li>Which relays you connect to and when</li>
          <li>Message timestamps and approximate sizes</li>
          <li>Which relays carry which group traffic (in non-Tier-2 groups)</li>
        </ul>
      </div>
      <p class="text-nc-text-muted">
        This is the nature of relay-based networks. NavCom uses encryption to protect content
        and relay isolation (Tier 2) to limit metadata exposure.
        Configure dedicated relays per group in settings for maximum privacy.
      </p>
    </div>
  {/if}
</button>
