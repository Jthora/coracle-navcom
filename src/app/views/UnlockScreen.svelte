<!--
  UnlockScreen.svelte — Passphrase prompt shown on app start when keys are locked.

  Shown when:
  1. User has keys in secure store (IndexedDB) but no in-memory passphrase
  2. Migration from localStorage is needed (first time after upgrade)

  Dispatches 'unlock' with the passphrase on success.
-->

<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import {appName} from "src/partials/state"
  import {retrieveKey, listKeyIds} from "src/engine/keys/secure-store"
  import {migrateLegacyKeys} from "src/engine/keys/migrate"
  import {validatePassphrase, passphraseStrength} from "src/engine/keys/passphrase"
  import {pqcMigrationProgress} from "src/engine/pqc/pq-key-store"

  const dispatch = createEventDispatcher<{unlock: {passphrase: string}; skip: void}>()

  export let mode: "unlock" | "setup" | "migrate" = "unlock"

  let passphrase = ""
  let confirmPassphrase = ""
  let error = ""
  let loading = false

  $: isSetup = mode === "setup" || mode === "migrate"
  $: strength = passphraseStrength(passphrase)
  $: strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong"][strength]
  $: strengthColor = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ][strength]

  async function handleUnlock() {
    if (!passphrase) {
      error = "Please enter your passphrase"
      return
    }

    loading = true
    error = ""

    try {
      if (isSetup) {
        // Setting up new passphrase
        const validation = validatePassphrase(passphrase)
        if (validation) {
          error = validation
          loading = false
          return
        }
        if (passphrase !== confirmPassphrase) {
          error = "Passphrases do not match"
          loading = false
          return
        }

        if (mode === "migrate") {
          const result = await migrateLegacyKeys(passphrase)
          if (!result.nostrKeyMigrated && result.pqcKeysMigrated === 0 && !result.alreadyMigrated) {
            error = "No keys found to migrate"
            loading = false
            return
          }
        }

        dispatch("unlock", {passphrase})
      } else {
        // Unlocking existing keys — verify by trying to unwrap the first key
        const keyIds = await listKeyIds()
        if (keyIds.length === 0) {
          dispatch("unlock", {passphrase})
          return
        }

        const testKey = await retrieveKey(keyIds[0], passphrase)
        if (!testKey) {
          error = "Wrong passphrase — please try again"
          loading = false
          return
        }

        dispatch("unlock", {passphrase})
      }
    } catch (e) {
      error = "An error occurred. Please try again."
      loading = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") handleUnlock()
  }
</script>

<div class="z-50 fixed inset-0 flex items-center justify-center bg-nc-shell-deep">
  <div class="mx-4 w-full max-w-sm rounded-xl bg-nc-shell-bg p-6 shadow-xl">
    <div class="mb-6 text-center">
      <div class="mb-2 text-3xl">🔐</div>
      <h1 class="text-xl font-bold text-nc-text">{appName}</h1>
      <p class="mt-1 text-sm text-nc-text-muted">
        {#if mode === "migrate"}
          Secure your keys with a passphrase
        {:else if isSetup}
          Create a passphrase to protect your keys
        {:else}
          Enter your passphrase to unlock
        {/if}
      </p>
    </div>

    <div class="flex flex-col gap-3">
      <div>
        <input
          type="password"
          bind:value={passphrase}
          on:keydown={handleKeydown}
          placeholder={isSetup ? "Create a passphrase" : "Enter passphrase"}
          class="w-full rounded-lg border border-nc-shell-border bg-nc-input px-3 py-2.5 text-nc-text placeholder-nc-text-muted focus:border-accent focus:outline-none"
          autocomplete={isSetup ? "new-password" : "current-password"}
          disabled={loading} />
        {#if isSetup && passphrase.length > 0}
          <div class="mt-1.5 flex items-center gap-2">
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-nc-shell-border">
              <div
                class="h-full rounded-full transition-all {strengthColor}"
                style="width: {(strength + 1) * 20}%" />
            </div>
            <span class="text-xs text-nc-text-muted">{strengthLabel}</span>
          </div>
        {/if}
      </div>

      {#if isSetup}
        <input
          type="password"
          bind:value={confirmPassphrase}
          on:keydown={handleKeydown}
          placeholder="Confirm passphrase"
          class="w-full rounded-lg border border-nc-shell-border bg-nc-input px-3 py-2.5 text-nc-text placeholder-nc-text-muted focus:border-accent focus:outline-none"
          autocomplete="new-password"
          disabled={loading} />
      {/if}

      {#if error}
        <p class="text-red-400 text-sm">{error}</p>
      {/if}

      <button
        on:click={handleUnlock}
        disabled={loading || !passphrase}
        class="w-full rounded-lg py-2.5 font-medium transition-colors
          {loading
          ? 'bg-nc-shell-border text-nc-text-muted'
          : 'bg-accent text-neutral-900 hover:opacity-90'}">
        {#if loading}
          {#if $pqcMigrationProgress}
            Securing keys... ({$pqcMigrationProgress.current}/{$pqcMigrationProgress.total})
          {:else}
            Unlocking...
          {/if}
        {:else if mode === "migrate"}
          Secure & Unlock
        {:else if isSetup}
          Set Passphrase
        {:else}
          Unlock
        {/if}
      </button>

      {#if loading && $pqcMigrationProgress && $pqcMigrationProgress.total > 0}
        <div class="mt-1">
          <div class="h-1.5 overflow-hidden rounded-full bg-nc-shell-border">
            <div
              class="h-full rounded-full bg-accent transition-all"
              style="width: {($pqcMigrationProgress.current / $pqcMigrationProgress.total) *
                100}%" />
          </div>
          <p class="mt-1 text-center text-xs text-nc-text-muted">Securing your encryption keys...</p>
        </div>
      {/if}

      {#if !isSetup}
        <p class="mt-2 text-center text-xs text-nc-text-muted">
          If you forgot your passphrase, you'll need your nsec backup to recover your account.
        </p>
        <button
          on:click={() => dispatch("skip")}
          class="mt-1 w-full text-center text-xs text-nc-text-muted underline hover:text-nc-text">
          Skip for now
        </button>
      {:else}
        <p class="mt-2 text-center text-xs text-nc-text-muted">
          Your keys will be encrypted with this passphrase. If you forget it, you'll need your nsec
          backup.
        </p>
      {/if}
    </div>
  </div>
</div>
