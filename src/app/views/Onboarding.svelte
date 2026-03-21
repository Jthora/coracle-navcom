<script lang="ts">
  import {onMount} from "svelte"
  import {get} from "svelte/store"
  import {RelayMode, getRelaysFromList, makeSecret, isShareableRelayUrl} from "@welshman/util"
  import {
    userRelayList,
    loginWithNip01,
    loginWithNip07,
    loginWithNip55,
    setProfile,
    pubkey,
    tagPubkey,
  } from "@welshman/app"
  import {Capacitor} from "@capacitor/core"
  import {getNip07, Nip07Signer, getNip55, Nip55Signer} from "@welshman/signer"
  import {nsecDecode} from "src/util/nostr"
  import {showWarning} from "src/partials/Toast.svelte"
  import OnboardingStageHost from "src/app/views/onboarding/OnboardingStageHost.svelte"
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
  import {decrypt} from "nostr-tools/nip49"
  import {bytesToHex} from "@welshman/lib"
  import {createOnboardingProvisioningRetry} from "src/app/views/onboarding/provisioning-retry"

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
    trackOnboarding("onboarding_entry", {
      entry_point: returnTo ? "post_gate" : "direct",
      has_invite: Boolean(invite),
      nstart_completed: Boolean(nstartCompleted),
    })
    trackOnboarding("onboarding_step_completed", {step: stage})

    hasNip07 = Boolean(getNip07())

    // NavCom: if arriving from an invite and no key yet, auto-generate managed key
    // to skip the key ceremony screen. User lands on profile screen directly.
    if (returnTo && invite && !get(pubkey) && stage === "start") {
      try {
        const secret = makeSecret()
        loginWithNip01(secret)
        boot()
        setPathState("managed", false)

        // Auto-configure relays from invite hints if available
        if (invite.parsedRelays?.length > 0) {
          const inviteRelayUrls = invite.parsedRelays
            .map((r: {url: string}) => r.url)
            .filter((u: string) => u && isShareableRelayUrl(u))
          if (inviteRelayUrls.length > 0) {
            setOutboxPolicies(inviteRelayUrls)
            relaysApplied = true
          }
        }

        stage = "profile"
        setOnboardingStage("profile")
        trackOnboarding("onboarding_path_selected", {path: "managed", auto: true})
      } catch (e) {
        console.error("Auto-keygen for invite flow failed, falling back to manual", e)
      }
    }

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

  const clearExternalTimeout = () => {
    if (externalTimeout) {
      clearTimeout(externalTimeout)
      externalTimeout = null
    }
  }

  const setPathState = (path: Path, needsBackup: boolean) => {
    selectedPath = path
    backupNeeded = needsBackup
    setOnboardingPath(path)
    setBackupNeeded(needsBackup)
  }

  const handleManaged = async () => {
    keyError = null
    keyLoading = true
    try {
      const secret = makeSecret()
      loginWithNip01(secret)
      boot()
      setPathState("managed", false)
      go("profile")
      trackOnboarding("onboarding_path_selected", {path: "managed"})

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
      clearExternalTimeout()
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
      setPathState("import", true)
      go("profile")
      trackOnboarding("onboarding_path_selected", {path: "import"})
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
      setPathState("import", true)
      showImportPassword = false
      importEncrypted = null
      go("profile")
      trackOnboarding("onboarding_path_selected", {path: "import"})
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
    setPathState("external_signer", false)
    router.at("/login").open()
    trackOnboarding("onboarding_path_selected", {path: "external_signer"})

    clearExternalTimeout()

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

  const loginWithExternalSigner = async ({
    via,
    getPubkey,
    applyLogin,
    failureCode,
    failureMessage,
  }: {
    via: "nip07" | "nip55"
    getPubkey: () => Promise<string>
    applyLogin: (signerPubkey: string) => void
    failureCode: string
    failureMessage: string
  }) => {
    try {
      keyError = null
      keyLoading = true
      const signerPubkey = await getPubkey()

      applyLogin(signerPubkey)
      boot()
      setPathState("external_signer", false)
      trackOnboarding("onboarding_path_selected", {path: "external_signer", via})
      go("profile")
    } catch (e) {
      console.error(e)
      keyError = failureMessage
      trackOnboardingError(failureCode)
    } finally {
      keyLoading = false
      externalTimedOut = false
      clearExternalTimeout()
    }
  }

  const handleExtension = async () => {
    await loginWithExternalSigner({
      via: "nip07",
      getPubkey: () => new Nip07Signer().getPubkey(),
      applyLogin: signerPubkey => loginWithNip07(signerPubkey),
      failureCode: "external_extension_failed",
      failureMessage: "Extension did not respond. Try again or pick another option.",
    })
  }

  const handleSignerApp = async (app: SignerApp) => {
    await loginWithExternalSigner({
      via: "nip55",
      getPubkey: () => new Nip55Signer(app.packageName).getPubkey(),
      applyLogin: signerPubkey => loginWithNip55(signerPubkey, app.packageName),
      failureCode: "external_signer_app_failed",
      failureMessage: "Signer app did not respond. Try again or pick another option.",
    })
  }

  const {applyRelaysIfNeeded, applyStarterFollowsIfEnabled} = createOnboardingProvisioningRetry({
    relays: {
      getUserRelayList: () => $userRelayList,
      defaultRelays: env.DEFAULT_RELAYS,
      setOutboxPolicies,
      isOnline: () => (typeof navigator === "undefined" ? true : navigator.onLine),
      showWarning,
      trackOnboardingEdge,
      getRelayEdgeLogged: () => relayEdgeLogged,
      setRelayEdgeLogged: value => (relayEdgeLogged = value),
      setQueueRelays: value => (queueRelays = value),
      setRelaysApplied: value => (relaysApplied = value),
    },
    follows: {
      getStarterFollowsEnabled: () => profile.starterFollows,
      defaultFollows: env.DEFAULT_FOLLOWS,
      tagPubkey,
      isOnline: () => (typeof navigator === "undefined" ? true : navigator.onLine),
      showWarning,
      trackOnboardingEdge,
      getFollowsEdgeLogged: () => followsEdgeLogged,
      setFollowsEdgeLogged: value => (followsEdgeLogged = value),
      setQueueFollows: value => (queueFollows = value),
      setStarterApplied: value => (starterApplied = value),
    },
  })

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
    // Defer key backup reminder — prompt 24h after setup
    try {
      if (!localStorage.getItem("key-backup-reminded")) {
        localStorage.setItem(
          "key-backup-reminded",
          JSON.stringify({
            dismissed: false,
            setupAt: Date.now(),
          }),
        )
      }
    } catch {
      /* localStorage unavailable */
    }

    const target = normalizedReturnTo()
    if (target) {
      router.go({path: target})
    } else {
      // NavCom default: land in Comms Mode, not /notes
      router.at("/").push()
    }
  }
</script>

<OnboardingStageHost
  {currentStage}
  {hasKey}
  {selectedPath}
  {hasNip07}
  {signerApps}
  {keyLoading}
  {keyError}
  {finishing}
  {relaysApplied}
  {starterApplied}
  {backupNeeded}
  {profile}
  {showImportPassword}
  {importPasswordLoading}
  {importPasswordError}
  onContinueStart={() => go("key")}
  onSkipExisting={exit}
  onBackToStart={() => go("start")}
  onSkipKey={() => go("profile")}
  onSelectPath={path => (selectedPath = path)}
  onManaged={handleManaged}
  onImport={handleImport}
  onExternal={handleExternal}
  onExtension={handleExtension}
  onSignerApp={handleSignerApp}
  onProfileChange={values => (profile = values)}
  onBackProfile={() => go("key")}
  onContinueProfile={finish}
  onBackDone={() => go("profile")}
  onFinish={exit}
  onImportPasswordSubmit={handleImportEncrypted}
  onImportPasswordCancel={() => {
    showImportPassword = false
    importEncrypted = null
    importPasswordError = null
    keyLoading = false
  }} />
