<script lang="ts">
  import {onMount} from "svelte"
  import {get} from "svelte/store"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {FOLLOWS, makeEvent, RelayMode, getRelaysFromList, makeSecret} from "@welshman/util"
  import {
    userRelayList,
    loginWithNip01,
    loginWithNip07,
    loginWithNip55,
    setProfile,
    pubkey,
    publishThunk,
    tagPubkey,
  } from "@welshman/app"
  import {Capacitor} from "@capacitor/core"
  import {getNip07, Nip07Signer, getNip55, Nip55Signer} from "@welshman/signer"
  import {nsecDecode} from "src/util/nostr"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Button from "src/partials/Button.svelte"
  import {showWarning} from "src/partials/Toast.svelte"
  import Start from "src/app/views/onboarding/Start.svelte"
  import KeyChoice from "src/app/views/onboarding/KeyChoice.svelte"
  import ProfileLite from "src/app/views/onboarding/ProfileLite.svelte"
  import Complete from "src/app/views/onboarding/Complete.svelte"
  import {setChecked, loadPubkeys, listenForNotifications, env, setOutboxPolicies} from "src/engine"
  import {router} from "src/app/util/router"
  import {boot} from "src/app/state"
  import {
    onboardingState,
    setOnboardingPath,
    setOnboardingStage,
    setBackupNeeded,
    markOnboardingComplete,
    syncOnboardingAccount,
    ensureCompletionIfKeyed,
  } from "src/app/state/onboarding"
  import {trackOnboarding, trackOnboardingEdge, trackOnboardingError} from "src/util/telemetry"
  import ImportPasswordPrompt from "src/app/views/onboarding/ImportPasswordPrompt.svelte"
  import {decrypt} from "nostr-tools/nip49"
  import {bytesToHex} from "@welshman/lib"
  import {uniqueRelays, uniqueFollowTags} from "src/app/views/onboarding/util"

  type Stage = "start" | "key" | "profile" | "done"
  type Path = "managed" | "import" | "external_signer"

  type SignerApp = {
    name: string
    packageName: string
    iconUrl: string
  }

  export let invite: any = null
  export let stage: Stage = "start"
  export let nstartCompleted = false
  export let returnTo: string | null = null

  const validStages: Stage[] = ["start", "key", "profile", "done"]

  $: currentStage = validStages.includes(stage) ? stage : "start"
  $: hasKey = Boolean($pubkey)

  let selectedPath: Path = "managed"
  let keyError: string | null = null
  let keyLoading = false
  let finishing = false
  let relaysApplied = false
  let starterApplied = false
  let backupNeeded = false
  let profile = {handle: "", displayName: "", starterFollows: true}
  let relayEdgeLogged = false
  let followsEdgeLogged = false
  let hydrated = false
  let queueRelays = false
  let queueFollows = false
  let externalTimeout: number | null = null
  let externalTimedOut = false
  let hasNip07 = false
  let signerApps: SignerApp[] = []
  let importEncrypted: string | null = null
  let showImportPassword = false
  let importPasswordError: string | null = null
  let importPasswordLoading = false

  const flushQueues = () => {
    if (queueRelays) {
      applyRelaysIfNeeded()
    }
    if (queueFollows) {
      applyStarterFollowsIfEnabled()
    }
  }

  // Preload starter follows for visibility
  onMount(() => {
    if (!env.ENABLE_GUIDED_SIGNUP && !env.ENABLE_GUIDED_SIGNUP_SHADOW) {
      router.at("/login").open()
      return
    }

    window.addEventListener("online", flushQueues)
    window.addEventListener("offline", () => {
      if (!relayEdgeLogged && !queueRelays) {
        trackOnboardingEdge("relay_offline", false)
        relayEdgeLogged = true
      }
      if (!followsEdgeLogged && !queueFollows) {
        trackOnboardingEdge("starter_offline", false)
        followsEdgeLogged = true
      }
      queueRelays = true
      queueFollows = true
    })

    const stored = get(onboardingState)
    selectedPath = (stored.path as Path) || "managed"
    backupNeeded = stored.backupNeeded
    stage = validStages.includes(stored.stage as Stage) ? (stored.stage as Stage) : "start"

    syncOnboardingAccount(get(pubkey) || null)
    ensureCompletionIfKeyed(Boolean(get(pubkey)))

    if (stored.complete && get(pubkey)) {
      markOnboardingComplete(selectedPath, backupNeeded)
      stage = "done"
      return exit()
    }

    setOnboardingStage(stage)
    setOnboardingPath(selectedPath)
    hydrated = true

    loadPubkeys(env.DEFAULT_FOLLOWS)
    trackOnboarding("onboarding_entry", {entry_point: returnTo ? "post_gate" : "direct"})
    trackOnboarding("onboarding_step_completed", {step: stage})

    hasNip07 = Boolean(getNip07())

    const loadNip55 = async () => {
      if (Capacitor.isNativePlatform()) {
        signerApps = await getNip55()
      }
    }

    loadNip55()
  })

  const go = (next: Stage, opts: {complete?: boolean} = {}) => {
    stage = next
    if (opts.complete) {
      markOnboardingComplete(selectedPath, backupNeeded)
    } else {
      setOnboardingStage(next)
    }
    trackOnboarding("onboarding_step_completed", {step: next})
  }

  const mapLegacyStage = () => {
    const legacy = ["follows", "note", "keys", "intro"]
    if (legacy.includes(stage as string)) {
      stage = "start"
      setOnboardingStage("start")
    }
  }

  mapLegacyStage()

  $: syncOnboardingAccount($pubkey || null)
  $: ensureCompletionIfKeyed(hasKey)
  $: if (
    hydrated &&
    $onboardingState.stage !== stage &&
    validStages.includes($onboardingState.stage as Stage)
  ) {
    stage = $onboardingState.stage as Stage
  }
  $: if (hydrated && $onboardingState.backupNeeded !== backupNeeded) {
    backupNeeded = $onboardingState.backupNeeded
  }
  $: if (hydrated && $onboardingState.path && $onboardingState.path !== selectedPath) {
    selectedPath = $onboardingState.path as Path
  }

  const handleManaged = async () => {
    keyError = null
    keyLoading = true
    try {
      const secret = makeSecret()
      loginWithNip01(secret)
      boot()
      selectedPath = "managed"
      backupNeeded = false
      go("profile")
      trackOnboarding("onboarding_path_selected", {path: "managed"})
      setOnboardingPath("managed")
      setBackupNeeded(false)

      if (externalTimedOut) {
        trackOnboardingEdge("external_signer_timeout", true)
        externalTimedOut = false
      }
    } catch (e) {
      console.error(e)
      keyError = "Could not create a managed key. Try again."
      trackOnboardingError("managed_key_failure")
    } finally {
      keyLoading = false
      externalTimedOut = false
      if (externalTimeout) {
        clearTimeout(externalTimeout)
        externalTimeout = null
      }
    }
  }

  const handleImport = async (secretInput: string) => {
    keyError = null
    keyLoading = true
    try {
      const trimmed = secretInput.trim()
      if (!trimmed.startsWith("nsec1")) {
        if (trimmed.startsWith("ncryptsec")) {
          importEncrypted = trimmed
          showImportPassword = true
          return
        }

        throw new Error("invalid_format")
      }

      const secret = nsecDecode(trimmed)
      loginWithNip01(secret)
      boot()
      selectedPath = "import"
      backupNeeded = true
      go("profile")
      trackOnboarding("onboarding_path_selected", {path: "import"})
      setOnboardingPath("import")
      setBackupNeeded(true)
    } catch (e) {
      console.error(e)
      keyError = "That key didn’t look valid. Check and try again."
      trackOnboardingError("import_invalid")
    } finally {
      keyLoading = false
    }
  }

  const handleImportEncrypted = async (password: string) => {
    if (!importEncrypted) return
    importPasswordError = null
    importPasswordLoading = true
    try {
      const bytes = decrypt(importEncrypted, password)
      const hex = bytesToHex(bytes)
      loginWithNip01(hex)
      boot()
      selectedPath = "import"
      backupNeeded = true
      showImportPassword = false
      importEncrypted = null
      go("profile")
      trackOnboarding("onboarding_path_selected", {path: "import"})
      setOnboardingPath("import")
      setBackupNeeded(true)
    } catch (e) {
      console.error(e)
      importPasswordError = "Couldn’t decrypt that key. Check the password and try again."
      trackOnboardingError("import_decrypt_failed")
    } finally {
      importPasswordLoading = false
      keyLoading = false
    }
  }

  const handleExternal = () => {
    selectedPath = "external_signer"
    backupNeeded = false
    router.at("/login").open()
    trackOnboarding("onboarding_path_selected", {path: "external_signer"})
    setOnboardingPath("external_signer")
    setBackupNeeded(false)

    if (externalTimeout) {
      clearTimeout(externalTimeout)
    }

    externalTimeout = window.setTimeout(() => {
      if (!$pubkey) {
        externalTimedOut = true
        trackOnboardingEdge("external_signer_timeout", false)
        showWarning("Signer didn’t respond. Try the recommended managed key.")
        go("key")
        selectedPath = "managed"
      }
    }, 8000)
  }

  const handleExtension = async () => {
    try {
      keyError = null
      keyLoading = true
      const signer = new Nip07Signer()
      const signerPubkey = await signer.getPubkey()
      loginWithNip07(signerPubkey)
      boot()
      selectedPath = "external_signer"
      backupNeeded = false
      setOnboardingPath("external_signer")
      setBackupNeeded(false)
      trackOnboarding("onboarding_path_selected", {path: "external_signer", via: "nip07"})
      go("profile")
    } catch (e) {
      console.error(e)
      keyError = "Extension did not respond. Try again or pick another option."
      trackOnboardingError("external_extension_failed")
    } finally {
      keyLoading = false
      externalTimedOut = false
      if (externalTimeout) {
        clearTimeout(externalTimeout)
        externalTimeout = null
      }
    }
  }

  const handleSignerApp = async (app: SignerApp) => {
    try {
      keyError = null
      keyLoading = true
      const signer = new Nip55Signer(app.packageName)
      const signerPubkey = await signer.getPubkey()
      loginWithNip55(signerPubkey, app.packageName)
      boot()
      selectedPath = "external_signer"
      backupNeeded = false
      setOnboardingPath("external_signer")
      setBackupNeeded(false)
      trackOnboarding("onboarding_path_selected", {path: "external_signer", via: "nip55"})
      go("profile")
    } catch (e) {
      console.error(e)
      keyError = "Signer app did not respond. Try again or pick another option."
      trackOnboardingError("external_signer_app_failed")
    } finally {
      keyLoading = false
      externalTimedOut = false
      if (externalTimeout) {
        clearTimeout(externalTimeout)
        externalTimeout = null
      }
    }
  }

  const applyRelaysIfNeeded = async (attempt = 0) => {
    const urls = getRelaysFromList($userRelayList)
    if (urls.length > 0) {
      relaysApplied = true
      queueRelays = false
      if (relayEdgeLogged) {
        trackOnboardingEdge("relay_offline", true)
        relayEdgeLogged = false
      }
      return
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      queueRelays = true
      relaysApplied = false
      if (!relayEdgeLogged) {
        trackOnboardingEdge("relay_offline", false)
        relayEdgeLogged = true
      }
      return
    }

    try {
      const relays = uniqueRelays(env.DEFAULT_RELAYS.map(url => ["r", url]))
      await setOutboxPolicies(() => relays)
      relaysApplied = true
      queueRelays = false
      if (relayEdgeLogged) {
        trackOnboardingEdge("relay_publish_fail", true)
        relayEdgeLogged = false
      }
    } catch (e) {
      console.error(e)
      relaysApplied = false
      if (attempt === 0) {
        showWarning("Relay defaults not applied. Retrying in the background.")
        if (!relayEdgeLogged) {
          trackOnboardingEdge("relay_publish_fail", false)
          relayEdgeLogged = true
        }
      }
      if (attempt < 2) {
        const delay = 800 * Math.pow(2, attempt)
        setTimeout(() => applyRelaysIfNeeded(attempt + 1), delay)
      } else {
        queueRelays = true
      }
    }
  }

  const applyStarterFollowsIfEnabled = async (attempt = 0) => {
    if (!profile.starterFollows) {
      starterApplied = false
      return
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      queueFollows = true
      starterApplied = false
      if (!followsEdgeLogged) {
        trackOnboardingEdge("starter_offline", false)
        followsEdgeLogged = true
      }
      return
    }

    try {
      const tags = uniqueFollowTags(env.DEFAULT_FOLLOWS, tagPubkey)
      const event = makeEvent(FOLLOWS, {tags})
      await publishThunk({
        event,
        relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
      })
      starterApplied = true
      queueFollows = false
      if (followsEdgeLogged) {
        trackOnboardingEdge("starter_fail", true)
        followsEdgeLogged = false
      }
    } catch (e) {
      console.error(e)
      starterApplied = false
      if (attempt === 0) {
        showWarning("Starter follows not applied. Retrying in the background.")
        if (!followsEdgeLogged) {
          trackOnboardingEdge("starter_fail", false)
          followsEdgeLogged = true
        }
      }
      if (attempt < 2) {
        const delay = 800 * Math.pow(2, attempt)
        setTimeout(() => applyStarterFollowsIfEnabled(attempt + 1), delay)
      } else {
        queueFollows = true
      }
    }
  }

  const applyProfileIfProvided = async () => {
    if (!profile.handle && !profile.displayName) return

    const values: Record<string, string> = {}
    if (profile.handle) values.name = profile.handle
    if (profile.displayName) values.display_name = profile.displayName

    try {
      setProfile(values)
    } catch (e) {
      console.error(e)
    }
  }

  const finish = async () => {
    if (!$pubkey) {
      keyError = "We couldn't detect a key. Please complete the key step first."
      go("key")
      return
    }

    finishing = true

    try {
      await applyProfileIfProvided()
      await applyRelaysIfNeeded()
      await applyStarterFollowsIfEnabled()

      // Ensure profile data is present on write relays
      const writeRelays = getRelaysFromList($userRelayList, RelayMode.Write)
      if (writeRelays.length > 0) {
        loadPubkeys([$pubkey])
        loadPubkeys(env.DEFAULT_FOLLOWS)
      }

      listenForNotifications()
      setChecked("*")

      trackOnboarding("onboarding_completed", {
        path: selectedPath,
        starter_follows_applied: starterApplied,
        relays_applied: relaysApplied,
      })

      go("done", {complete: true})
    } finally {
      finishing = false
    }
  }

  const normalizedReturnTo = () => {
    if (!returnTo) return null
    if (returnTo.startsWith("/")) return returnTo
    return `/${returnTo}`
  }

  const exit = () => {
    const target = normalizedReturnTo()
    if (target) {
      router.go({path: target})
    } else {
      router.at("notes").push()
    }
  }
</script>

<FlexColumn class="mt-8">
  {#key currentStage}
    {#if currentStage === "start"}
      <Start {hasKey} onContinue={() => go("key")} onSkipExisting={exit} />
    {:else if currentStage === "key"}
      <KeyChoice
        {selectedPath}
        {hasNip07}
        {signerApps}
        loading={keyLoading}
        error={keyError}
        on:select={e => (selectedPath = e.detail.path)}
        on:managed={handleManaged}
        on:import={e => handleImport(e.detail.secret)}
        on:external={handleExternal}
        on:extension={handleExtension}
        on:signerApp={e => handleSignerApp(e.detail.app)} />
      <div class="mt-4 flex justify-between text-sm text-neutral-400">
        <div>Managed is fastest. Advanced options remain available.</div>
        <div class="flex gap-2">
          <Button class="btn btn-low whitespace-normal text-center" on:click={() => go("start")}>
            Back
          </Button>
          <Button
            class="btn btn-accent whitespace-normal text-center"
            on:click={() => go("profile")}>
            Skip for now
          </Button>
        </div>
      </div>
    {:else if currentStage === "profile"}
      <ProfileLite
        handle={profile.handle}
        displayName={profile.displayName}
        starterFollows={profile.starterFollows}
        loading={finishing}
        onChange={values => (profile = values)}
        onBack={() => go("key")}
        onContinue={finish} />
    {:else if currentStage === "done"}
      <Complete
        {relaysApplied}
        {starterApplied}
        {backupNeeded}
        onBack={() => go("profile")}
        onFinish={exit} />
    {/if}
  {/key}
  <div class="m-auto flex gap-2">
    {#each ["start", "key", "profile", "done"] as s}
      <div
        class="h-2 w-2 rounded-full"
        class:bg-neutral-300={s === currentStage}
        class:bg-neutral-500={s !== currentStage} />
    {/each}
  </div>

  <ImportPasswordPrompt
    open={showImportPassword}
    loading={importPasswordLoading}
    error={importPasswordError}
    on:submit={e => handleImportEncrypted(e.detail.password)}
    on:cancel={() => {
      showImportPassword = false
      importEncrypted = null
      importPasswordError = null
      keyLoading = false
    }} />
</FlexColumn>
