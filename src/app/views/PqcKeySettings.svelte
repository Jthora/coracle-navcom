<script lang="ts">
  import {onMount} from "svelte"
  import {pubkey} from "@welshman/app"
  import {get} from "svelte/store"
  import Heading from "src/partials/Heading.svelte"
  import Button from "src/partials/Button.svelte"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import {loadPqcKeyPair, removePqcKeyPair} from "src/engine/pqc/pq-key-store"
  import {ensureOwnPqcKey} from "src/engine/pqc/pq-key-lifecycle"
  import type {PqcKeyPublicationRecord} from "src/engine/pqc/key-publication"

  let generating = false
  let rotating = false
  let record: PqcKeyPublicationRecord | null = null

  // Load existing key on mount
  const userPub = get(pubkey)

  onMount(async () => {
    if (userPub) {
      const existing = await loadPqcKeyPair(userPub)
      if (existing) {
        record = existing.record
      }
    }
  })

  $: hasKey = record !== null
  $: isExpired = record ? record.expires_at < Math.floor(Date.now() / 1000) : false
  $: generatedDate = record ? new Date(record.created_at * 1000).toLocaleDateString() : null
  $: expiresDate = record ? new Date(record.expires_at * 1000).toLocaleDateString() : null

  async function handleGenerate() {
    if (!userPub) return
    generating = true
    try {
      const result = await ensureOwnPqcKey()
      if (result) {
        record = result.record
        showInfo("PQC key generated and published successfully.")
      }
    } catch (e) {
      showWarning("Failed to generate PQC key. Please try again.")
    } finally {
      generating = false
    }
  }

  async function handleRotate() {
    if (!userPub) return
    rotating = true
    try {
      // Remove old key and force regeneration
      await removePqcKeyPair(userPub)
      const result = await ensureOwnPqcKey()
      if (result) {
        record = result.record
        showInfo("PQC key rotated. New key published to relays.")
      }
    } catch (e) {
      showWarning("Failed to rotate PQC key. Please try again.")
    } finally {
      rotating = false
    }
  }
</script>

<div class="flex flex-col gap-4">
  <Heading>Post-Quantum Encryption</Heading>

  <div class="bg-neutral-800/50 rounded-lg border border-neutral-700 p-4">
    {#if hasKey && !isExpired}
      <div class="mb-3 flex items-center gap-2">
        <span class="bg-green-400 inline-block h-2 w-2 rounded-full" />
        <span class="text-green-400 text-sm font-medium">Active</span>
      </div>

      <div class="grid grid-cols-2 gap-y-2 text-sm">
        <span class="text-neutral-400">Algorithm</span>
        <span class="text-neutral-100"
          >{record.pq_alg === "mlkem768" ? "ML-KEM-768" : record.pq_alg}</span>

        <span class="text-neutral-400">Generated</span>
        <span class="text-neutral-100">{generatedDate}</span>

        <span class="text-neutral-400">Expires</span>
        <span class="text-neutral-100">{expiresDate}</span>

        <span class="text-neutral-400">Key ID</span>
        <span class="truncate font-mono text-xs text-neutral-100">{record.key_id}</span>

        <span class="text-neutral-400">Published</span>
        <span class="text-green-400">✅ Yes</span>
      </div>

      <div class="mt-4 flex gap-2">
        <Button class="btn btn-low" on:click={handleRotate} disabled={rotating}>
          {rotating ? "Rotating..." : "Rotate Key"}
        </Button>
      </div>
    {:else if hasKey && isExpired}
      <div class="mb-3 flex items-center gap-2">
        <span class="bg-yellow-400 inline-block h-2 w-2 rounded-full" />
        <span class="text-yellow-400 text-sm font-medium">Expired</span>
      </div>

      <p class="mb-3 text-sm text-neutral-400">
        Your PQC key has expired. Generate a new key to continue using post-quantum encryption.
      </p>

      <Button class="btn btn-accent" on:click={handleRotate} disabled={rotating}>
        {rotating ? "Generating..." : "Generate New Key"}
      </Button>
    {:else}
      <div class="mb-3 flex items-center gap-2">
        <span class="inline-block h-2 w-2 rounded-full bg-neutral-500" />
        <span class="text-sm font-medium text-neutral-400">No PQC Key</span>
      </div>

      <p class="mb-3 text-sm text-neutral-400">
        Generate a post-quantum encryption key to enable ML-KEM-768 encrypted messaging. Your public
        key will be published to your relays so others can send you PQC-encrypted messages.
      </p>

      <Button class="btn btn-accent" on:click={handleGenerate} disabled={generating}>
        {generating ? "Generating..." : "Generate PQC Key"}
      </Button>
    {/if}
  </div>
</div>
