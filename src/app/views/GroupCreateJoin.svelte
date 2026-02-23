<script lang="ts">
  import {signer} from "@welshman/app"
  import {onDestroy, onMount} from "svelte"
  import Input from "src/partials/Input.svelte"
  import GroupBreadcrumbs from "src/app/groups/GroupBreadcrumbs.svelte"
  import {buildGroupBreadcrumbItems, type GroupBreadcrumbSection} from "src/app/groups/breadcrumbs"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import {router} from "src/app/util/router"
  import {
    env,
    getGroupCreateRecoveryMessage,
    publishGroupCreateWithRecovery,
    publishGroupJoin,
  } from "src/engine"
  import {parseGroupAddressResult} from "src/domain/group-id"
  import {buildCreatePolicyPrompts, buildJoinPolicyPrompts} from "src/app/groups/create-join"
  import {trackGroupTelemetry} from "src/app/groups/telemetry"
  import {
    getCreateGroupAddressResult,
    buildRelayGroupAddress,
    type GuidedCreateJoinFlow,
  } from "src/app/groups/guided-create-join"
  import {
    GUIDED_RELAY_PRESET_OPTIONS,
    getGuidedSecurityStatus,
    getPrimaryRelayHostFromSelectedRelays,
    getRecommendedRelayHost,
    getRelayPresetValues,
    formatSelectedRelays,
    parseSelectedRelays,
    type GuidedPrivacyLevel,
    type GuidedRelayPreset,
  } from "src/app/groups/guided-create-options"
  import {
    attemptRelayChallengeAuth,
    checkRelayCapabilities,
    getRelayAuthConfirmedMap,
    hasViableRelayPath,
    refreshRelayAuthSessions,
    RELAY_AUTH_SESSION_TTL_MS_DEFAULT,
    type RelayAuthLifecycleSession,
    type RelayCapabilityCheck,
  } from "src/app/groups/relay-capability"
  import {
    buildReceiverSetupChecklist,
    buildRelayAccessPackageText,
    getRelayAuthMethodIndicator,
    summarizeMissingRelayCredentials,
  } from "src/app/groups/relay-auth-ux"
  import {resolveRequestedTransportMode} from "src/app/groups/transport-mode"
  import {copyToClipboard} from "src/util/html"

  export let groupId = ""
  export let preferredMode = ""
  export let missionTier: 0 | 1 | 2 | null = null
  export let label = ""

  let flow: GuidedCreateJoinFlow = "create"
  let createRelayHost = ""
  let createSelectedRelaysText = ""
  let createSelectedRelays: string[] = []
  let createRelayPreset: GuidedRelayPreset = "navcom"
  let createRelayChecks: RelayCapabilityCheck[] = []
  let createRelayChecksRunning = false
  let createRelayChecksAt = 0
  let createRelayAuthSessions: Record<string, RelayAuthLifecycleSession> = {}
  let createRelayAuthPending: Record<string, boolean> = {}
  let createMissingCredentialWarnings: string[] = []
  let createAccessPackageText = ""
  let createRoomName = ""
  let createPrivacy: GuidedPrivacyLevel = "auto"
  let createGroupIdOverride = ""
  let createTitle = ""
  let createDescription = ""
  let joinGroupAddress = ""
  let createError = ""
  let joinError = ""
  let joinSelectedRelaysText = ""
  let joinSelectedRelays: string[] = []
  let joinRelayChecks: RelayCapabilityCheck[] = []
  let joinRelayChecksRunning = false
  let joinRelayChecksAt = 0
  let joinRelayAuthSessions: Record<string, RelayAuthLifecycleSession> = {}
  let joinRelayAuthPending: Record<string, boolean> = {}
  let joinMissingCredentialWarnings: string[] = []
  let pendingCreate = false
  let pendingJoin = false
  let preferredRelayHost = "relay.example"
  let setupStartedAt = 0
  let setupCompleted = false
  let setupStarted = false
  let joinSubmittedAt = 0

  $: createSelectedRelays = parseSelectedRelays(createSelectedRelaysText)
  $: createRelayHost = getPrimaryRelayHostFromSelectedRelays(createSelectedRelaysText)
  $: createGroupId = buildRelayGroupAddress(createRelayHost, createRoomName)
  $: createPrompts = buildCreatePolicyPrompts(createGroupIdOverride || createGroupId)
  $: createRoomWarnings = [
    createRoomName && createGroupId && !createGroupId.endsWith(createRoomName.toLowerCase())
      ? "Group name is normalized to a relay-safe slug."
      : "",
  ].filter(Boolean)
  $: createRelayWarnings = [
    createSelectedRelays.length === 0
      ? "Add at least one relay in Selected Relays to create the group."
      : "",
    createRelayHost && !createRelayHost.includes(".")
      ? "Primary relay host looks incomplete; use a full relay address when possible."
      : "",
  ].filter(Boolean)
  $: joinPrompts = buildJoinPolicyPrompts(joinGroupAddress)
  $: joinSelectedRelays = parseSelectedRelays(joinSelectedRelaysText)
  $: joinAddressParsed = parseGroupAddressResult(joinGroupAddress)
  $: joinAddressValid = joinAddressParsed.ok
  $: securityStatus = getGuidedSecurityStatus(createPrivacy)
  $: createRequestedTransport = resolveRequestedTransportMode({
    flow: "create",
    privacy: createPrivacy,
    invitePreferredMode: preferredMode,
  })
  $: joinRequestedTransport = resolveRequestedTransportMode({
    flow: "join",
    privacy: createPrivacy,
    invitePreferredMode: preferredMode,
  })
  $: joinInviteHints = [
    preferredMode ? `Invite mode hint: ${preferredMode}` : "",
    missionTier === null ? "" : `Invite mission tier hint: ${missionTier}`,
    label ? `Invite label: ${label}` : "",
  ].filter(Boolean)

  $: if (groupId && !joinGroupAddress) {
    joinGroupAddress = groupId
    flow = "join"
  }

  $: if (!joinSelectedRelaysText) {
    if (joinAddressParsed.ok && joinAddressParsed.value.relayHost) {
      joinSelectedRelaysText = formatSelectedRelays([`wss://${joinAddressParsed.value.relayHost}`])
    }
  }

  $: preferredRelayHost = getRecommendedRelayHost(groupId)

  $: if (!createSelectedRelaysText && flow !== "join") {
    const relays = getRelayPresetValues({
      preset: createRelayPreset,
      recommendedRelayHost: preferredRelayHost,
      defaultRelays: env.DEFAULT_RELAYS,
      indexerRelays: env.INDEXER_RELAYS,
    })

    createSelectedRelaysText = formatSelectedRelays(relays)
  }

  $: if (flow === "create") {
    joinError = ""
  }

  $: if (flow === "join") {
    createError = ""
  }

  $: createMissingCredentialWarnings = summarizeMissingRelayCredentials({
    checks: createRelayChecks,
    authConfirmed: getRelayAuthConfirmedMap({sessions: createRelayAuthSessions}),
    hasSigner: Boolean($signer?.sign),
  }).warnings

  $: joinMissingCredentialWarnings = summarizeMissingRelayCredentials({
    checks: joinRelayChecks,
    authConfirmed: getRelayAuthConfirmedMap({sessions: joinRelayAuthSessions}),
    hasSigner: Boolean($signer?.sign),
  }).warnings

  $: createAccessPackageText = buildRelayAccessPackageText({
    groupAddress: createGroupIdOverride || createGroupId,
    relays: createSelectedRelays,
    checks: createRelayChecks,
    securityMode: createPrivacy,
    requestedTransportMode: createRequestedTransport.requestedMode,
  })

  $: joinSetupChecklist = buildReceiverSetupChecklist({
    groupAddress: joinGroupAddress,
    groupAddressValid: joinAddressValid,
    selectedRelays: joinSelectedRelays,
    checks: joinRelayChecks,
    authConfirmed: getRelayAuthConfirmedMap({sessions: joinRelayAuthSessions}),
  })

  const goToFlow = (nextFlow: GuidedCreateJoinFlow) => {
    flow = nextFlow
    trackGroupTelemetry("group_setup_flow_selected", {flow: nextFlow})

    if (nextFlow === "join") {
      trackGroupTelemetry(
        "group_join_started",
        {
          mode: "guided",
          entry_point: groupId ? "invite_prefill" : "manual_address",
        },
        {
          dedupeKey: `group-join-started-${groupId || "manual"}`,
          minIntervalMs: 10_000,
        },
      )
    }
  }

  const applyRelayPreset = (preset: GuidedRelayPreset) => {
    createRelayPreset = preset

    if (preset === "custom") return

    createSelectedRelaysText = formatSelectedRelays(
      getRelayPresetValues({
        preset,
        recommendedRelayHost: preferredRelayHost,
        defaultRelays: env.DEFAULT_RELAYS,
        indexerRelays: env.INDEXER_RELAYS,
      }),
    )
  }

  const hasCreateRelayAuthBlocker = () => {
    const previousSessions = createRelayAuthSessions
    const refreshedSessions = refreshRelayAuthSessions({sessions: createRelayAuthSessions})

    createRelayAuthSessions = refreshedSessions
    emitRelayAuthExpiryTelemetry({
      flow: "create",
      previousSessions,
      nextSessions: refreshedSessions,
    })

    const confirmed = getRelayAuthConfirmedMap({sessions: refreshedSessions})

    return createRelayChecks.some(
      check => check.status === "auth-required" && !confirmed[check.relay],
    )
  }

  const hasJoinRelayAuthBlocker = () => {
    const previousSessions = joinRelayAuthSessions
    const refreshedSessions = refreshRelayAuthSessions({sessions: joinRelayAuthSessions})

    joinRelayAuthSessions = refreshedSessions
    emitRelayAuthExpiryTelemetry({
      flow: "join",
      previousSessions,
      nextSessions: refreshedSessions,
    })

    const confirmed = getRelayAuthConfirmedMap({sessions: refreshedSessions})

    return joinRelayChecks.some(
      check => check.status === "auth-required" && !confirmed[check.relay],
    )
  }

  const hasCreateRelayViabilityBlocker = () =>
    !hasViableRelayPath({
      checks: createRelayChecks,
      authConfirmed: getRelayAuthConfirmedMap({sessions: createRelayAuthSessions}),
      selectedRelays: createSelectedRelays,
    })

  const hasJoinRelayViabilityBlocker = () =>
    !hasViableRelayPath({
      checks: joinRelayChecks,
      authConfirmed: getRelayAuthConfirmedMap({sessions: joinRelayAuthSessions}),
      selectedRelays: joinSelectedRelays,
    })

  const getCreateRelaySession = (relay: string): RelayAuthLifecycleSession =>
    createRelayAuthSessions[relay] || {status: "idle"}

  const getJoinRelaySession = (relay: string): RelayAuthLifecycleSession =>
    joinRelayAuthSessions[relay] || {status: "idle"}

  const isCreateRelayConfirmed = (relay: string) =>
    Boolean(getRelayAuthConfirmedMap({sessions: createRelayAuthSessions})[relay])

  const isJoinRelayConfirmed = (relay: string) =>
    Boolean(getRelayAuthConfirmedMap({sessions: joinRelayAuthSessions})[relay])

  const getRelayAuthStatusClass = (status: RelayAuthLifecycleSession["status"]) => {
    if (status === "authenticated") return "border-emerald-500 text-emerald-300"
    if (status === "expired") return "border-amber-500 text-amber-300"
    if (status === "failed") return "border-warning text-warning"

    return "border-neutral-600 text-neutral-300"
  }

  const getRelayAuthStatusLabel = (status: RelayAuthLifecycleSession["status"]) => {
    if (status === "authenticated") return "authenticated"
    if (status === "authenticating") return "authenticating"
    if (status === "expired") return "expired"
    if (status === "failed") return "failed"

    return "not-authenticated"
  }

  const getRelayAuthMethodBadgeClass = (tone: "neutral" | "warning" | "danger") => {
    if (tone === "warning") return "border-amber-500 text-amber-300"
    if (tone === "danger") return "border-warning text-warning"

    return "border-neutral-600 text-neutral-300"
  }

  const getRelayCheckCounts = (checks: RelayCapabilityCheck[]) => {
    const readyCount = checks.filter(check => check.status === "ready").length
    const authRequiredCount = checks.filter(check => check.status === "auth-required").length
    const unreachableCount = checks.filter(check => check.status === "unreachable").length
    const notAdvertisedCount = checks.filter(check => check.status === "not-advertised").length
    const unknownCount = checks.filter(check => check.status === "unknown").length

    return {
      readyCount,
      authRequiredCount,
      unreachableCount,
      notAdvertisedCount,
      unknownCount,
    }
  }

  const getRelayChecksResult = (checks: RelayCapabilityCheck[]) => {
    const {authRequiredCount, unreachableCount, unknownCount} = getRelayCheckCounts(checks)

    if (unreachableCount > 0 || unknownCount > 0 || authRequiredCount > 0) {
      return "warning"
    }

    return "success"
  }

  const emitRelayAuthExpiryTelemetry = ({
    flow,
    previousSessions,
    nextSessions,
  }: {
    flow: "create" | "join"
    previousSessions: Record<string, RelayAuthLifecycleSession>
    nextSessions: Record<string, RelayAuthLifecycleSession>
  }) => {
    for (const [relay, nextSession] of Object.entries(nextSessions)) {
      const previousSession = previousSessions[relay]

      if (previousSession?.status !== "authenticated" || nextSession.status !== "expired") {
        continue
      }

      trackGroupTelemetry("group_setup_relay_auth_expired", {
        flow,
        relay,
        result: "warning",
      })
    }
  }

  const runCreateRelayChecks = async () => {
    if (createSelectedRelays.length === 0) {
      showWarning("Add relays before running capability checks.")

      return
    }

    createRelayChecksRunning = true
    const startedAt = Date.now()
    trackGroupTelemetry("group_setup_relay_checks_started", {
      flow: "create",
      relay_count: createSelectedRelays.length,
    })

    try {
      createRelayChecks = await checkRelayCapabilities(createSelectedRelays)
      createRelayChecksAt = Date.now()

      const {readyCount, authRequiredCount, unreachableCount, notAdvertisedCount} =
        getRelayCheckCounts(createRelayChecks)

      trackGroupTelemetry("group_setup_relay_checks_completed", {
        flow: "create",
        relay_count: createSelectedRelays.length,
        ready_count: readyCount,
        auth_required_count: authRequiredCount,
        unreachable_count: unreachableCount,
        not_advertised_count: notAdvertisedCount,
        no_groups_count: notAdvertisedCount,
        elapsed_ms: Math.max(0, Date.now() - startedAt),
        result: getRelayChecksResult(createRelayChecks),
      })

      if (authRequiredCount > 0) {
        showWarning("Some relays require challenge/response authentication before write access.")
      } else {
        showInfo("Relay capability checks completed.")
      }
    } catch {
      trackGroupTelemetry("group_setup_relay_check_failed", {
        flow: "create",
        relay_count: createSelectedRelays.length,
        elapsed_ms: Math.max(0, Date.now() - startedAt),
        result: "error",
      })
      showWarning("Relay capability checks failed. Verify relay URLs and retry.")
    } finally {
      createRelayChecksRunning = false
    }
  }

  const runJoinRelayChecks = async () => {
    if (joinSelectedRelays.length === 0) {
      showWarning("Add relays before running capability checks.")

      return
    }

    joinRelayChecksRunning = true
    const startedAt = Date.now()
    trackGroupTelemetry("group_setup_relay_checks_started", {
      flow: "join",
      relay_count: joinSelectedRelays.length,
    })

    try {
      joinRelayChecks = await checkRelayCapabilities(joinSelectedRelays)
      joinRelayChecksAt = Date.now()

      const {readyCount, authRequiredCount, unreachableCount, notAdvertisedCount} =
        getRelayCheckCounts(joinRelayChecks)

      trackGroupTelemetry("group_setup_relay_checks_completed", {
        flow: "join",
        relay_count: joinSelectedRelays.length,
        ready_count: readyCount,
        auth_required_count: authRequiredCount,
        unreachable_count: unreachableCount,
        not_advertised_count: notAdvertisedCount,
        no_groups_count: notAdvertisedCount,
        elapsed_ms: Math.max(0, Date.now() - startedAt),
        result: getRelayChecksResult(joinRelayChecks),
      })

      if (authRequiredCount > 0) {
        showWarning("Some relays require challenge/response authentication before joining.")
      } else {
        showInfo("Relay capability checks completed.")
      }
    } catch {
      trackGroupTelemetry("group_setup_relay_check_failed", {
        flow: "join",
        relay_count: joinSelectedRelays.length,
        elapsed_ms: Math.max(0, Date.now() - startedAt),
        result: "error",
      })
      showWarning("Relay capability checks failed. Verify relay URLs and retry.")
    } finally {
      joinRelayChecksRunning = false
    }
  }

  const confirmCreateRelayAuth = async (relay: string) => {
    if (!$signer?.sign) {
      trackGroupTelemetry("group_setup_relay_auth_result", {
        flow: "create",
        relay,
        ok: false,
        auth_status: "missing-signer",
        result: "error",
      })
      showWarning("A signer is required to authenticate this relay.")

      return
    }

    const startedAt = Date.now()
    trackGroupTelemetry("group_setup_relay_auth_started", {
      flow: "create",
      relay,
    })

    createRelayAuthPending = {...createRelayAuthPending, [relay]: true}
    createRelayAuthSessions = {
      ...createRelayAuthSessions,
      [relay]: {
        ...getCreateRelaySession(relay),
        status: "authenticating",
        lastAttemptAt: Date.now(),
      },
    }

    try {
      const result = await attemptRelayChallengeAuth({
        relay,
        sign: event => $signer.sign(event),
      })

      trackGroupTelemetry("group_setup_relay_auth_result", {
        flow: "create",
        relay,
        ok: result.ok,
        auth_status: result.authStatus,
        elapsed_ms: Math.max(0, Date.now() - startedAt),
        result: result.ok ? "success" : "error",
      })

      if (result.ok) {
        createRelayAuthSessions = {
          ...createRelayAuthSessions,
          [relay]: {
            status: "authenticated",
            lastAttemptAt: Date.now(),
            authenticatedAt: Date.now(),
            expiresAt: Date.now() + RELAY_AUTH_SESSION_TTL_MS_DEFAULT,
            lastReason: result.reason,
          },
        }
        showInfo(`Relay authentication succeeded for ${relay}.`)
      } else {
        createRelayAuthSessions = {
          ...createRelayAuthSessions,
          [relay]: {
            ...getCreateRelaySession(relay),
            status: "failed",
            lastAttemptAt: Date.now(),
            lastReason: result.reason,
          },
        }
        showWarning(result.reason)
      }
    } finally {
      createRelayAuthPending = {...createRelayAuthPending, [relay]: false}
    }
  }

  const confirmJoinRelayAuth = async (relay: string) => {
    if (!$signer?.sign) {
      trackGroupTelemetry("group_setup_relay_auth_result", {
        flow: "join",
        relay,
        ok: false,
        auth_status: "missing-signer",
        result: "error",
      })
      showWarning("A signer is required to authenticate this relay.")

      return
    }

    const startedAt = Date.now()
    trackGroupTelemetry("group_setup_relay_auth_started", {
      flow: "join",
      relay,
    })

    joinRelayAuthPending = {...joinRelayAuthPending, [relay]: true}
    joinRelayAuthSessions = {
      ...joinRelayAuthSessions,
      [relay]: {
        ...getJoinRelaySession(relay),
        status: "authenticating",
        lastAttemptAt: Date.now(),
      },
    }

    try {
      const result = await attemptRelayChallengeAuth({
        relay,
        sign: event => $signer.sign(event),
      })

      trackGroupTelemetry("group_setup_relay_auth_result", {
        flow: "join",
        relay,
        ok: result.ok,
        auth_status: result.authStatus,
        elapsed_ms: Math.max(0, Date.now() - startedAt),
        result: result.ok ? "success" : "error",
      })

      if (result.ok) {
        joinRelayAuthSessions = {
          ...joinRelayAuthSessions,
          [relay]: {
            status: "authenticated",
            lastAttemptAt: Date.now(),
            authenticatedAt: Date.now(),
            expiresAt: Date.now() + RELAY_AUTH_SESSION_TTL_MS_DEFAULT,
            lastReason: result.reason,
          },
        }
        showInfo(`Relay authentication succeeded for ${relay}.`)
      } else {
        joinRelayAuthSessions = {
          ...joinRelayAuthSessions,
          [relay]: {
            ...getJoinRelaySession(relay),
            status: "failed",
            lastAttemptAt: Date.now(),
            lastReason: result.reason,
          },
        }
        showWarning(result.reason)
      }
    } finally {
      joinRelayAuthPending = {...joinRelayAuthPending, [relay]: false}
    }
  }

  const getRelayStatusBadgeClass = (status: RelayCapabilityCheck["status"]) => {
    if (status === "ready") return "border-emerald-500 text-emerald-300"
    if (status === "auth-required") return "border-amber-500 text-amber-300"
    if (status === "not-advertised") return "border-neutral-600 text-neutral-300"

    return "border-neutral-600 text-neutral-300"
  }

  const getRelayConfidenceLabel = (check: RelayCapabilityCheck) => {
    if (check.status === "ready") {
      return check.supportsNip29 ? "Advertised" : "Observed Working"
    }

    if (check.status === "auth-required") {
      return "Auth Needed"
    }

    if (check.status === "unreachable") {
      return "Unreachable"
    }

    if (check.status === "not-advertised") {
      return "Not Advertised"
    }

    return "Unknown"
  }

  const getRelayConfidenceClass = (check: RelayCapabilityCheck) => {
    if (check.status === "ready") return "border-emerald-500 text-emerald-300"
    if (check.status === "auth-required") return "border-amber-500 text-amber-300"
    if (check.status === "unreachable") return "border-warning text-warning"
    if (check.status === "not-advertised") return "border-neutral-600 text-neutral-300"

    return "border-neutral-600 text-neutral-300"
  }

  const getRelayRuntimeProof = (
    check: RelayCapabilityCheck,
    relayConfirmed = false,
  ): {label: string; detail: string; tone: "good" | "warn" | "neutral"} => {
    if (check.status === "unreachable") {
      return {
        label: "Failed",
        detail: "Could not reach relay, so runtime behavior could not be verified.",
        tone: "warn",
      }
    }

    if (check.status === "auth-required" && relayConfirmed) {
      return {
        label: "Auth Confirmed",
        detail: "Relay challenge/response auth completed for this session.",
        tone: "good",
      }
    }

    if (check.status === "ready") {
      return {
        label: "Preflight Passed",
        detail: "Metadata probe succeeded. Publish/subscribe proof is still runtime-dependent.",
        tone: "neutral",
      }
    }

    if (check.status === "auth-required") {
      return {
        label: "Pending Auth",
        detail: "Relay requires auth before write proof can be established.",
        tone: "warn",
      }
    }

    return {
      label: "Unverified",
      detail: "Capability advertisement only. Runtime publish/subscribe proof not yet confirmed.",
      tone: "neutral",
    }
  }

  const getRuntimeProofClass = (tone: "good" | "warn" | "neutral") => {
    if (tone === "good") return "border-emerald-500 text-emerald-300"
    if (tone === "warn") return "border-warning text-warning"

    return "border-neutral-600 text-neutral-300"
  }

  const getCapabilitySignalLabel = (value?: boolean | null) => {
    if (value === true) return "yes"
    if (value === false) return "no"

    return "unknown"
  }

  const getCapabilitySignalClass = (value?: boolean | null) => {
    if (value === true) return "border-emerald-500 text-emerald-300"
    if (value === false) return "border-warning text-warning"

    return "border-neutral-600 text-neutral-300"
  }

  const getChecklistStatusClass = (done: boolean) =>
    done ? "border-emerald-500 text-emerald-300" : "border-warning text-warning"

  const onCopyCreateAccessPackage = async () => {
    if (!createAccessPackageText) {
      showWarning("Complete group address and relay selection before copying access package.")

      return
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(createAccessPackageText)
      } else if (typeof document !== "undefined") {
        copyToClipboard(createAccessPackageText)
      } else {
        throw new Error("clipboard unavailable")
      }

      const authRequiredCount = createRelayChecks.filter(
        check => check.status === "auth-required",
      ).length

      trackGroupTelemetry("group_setup_share_package_created", {
        flow: "create",
        relay_count: createSelectedRelays.length,
        auth_required_count: authRequiredCount,
        security_mode: createPrivacy,
        requested_transport_mode: createRequestedTransport.requestedMode,
        result: "success",
      })

      showInfo("Access package copied to clipboard.")
    } catch {
      trackGroupTelemetry("group_setup_share_package_created", {
        flow: "create",
        relay_count: createSelectedRelays.length,
        auth_required_count: createRelayChecks.filter(check => check.status === "auth-required")
          .length,
        security_mode: createPrivacy,
        requested_transport_mode: createRequestedTransport.requestedMode,
        result: "error",
      })
      showWarning("Unable to copy access package. Copy manually from preview.")
    }
  }

  const onCreate = async () => {
    if (hasCreateRelayViabilityBlocker()) {
      const counts = getRelayCheckCounts(createRelayChecks)

      trackGroupTelemetry("group_setup_blocked_by_relay_requirements", {
        flow: "create",
        block_reason: "viability",
        relay_count: createSelectedRelays.length,
        ready_count: counts.readyCount,
        auth_required_count: counts.authRequiredCount,
        unreachable_count: counts.unreachableCount,
        not_advertised_count: counts.notAdvertisedCount,
        no_groups_count: counts.notAdvertisedCount,
        result: "error",
      })
      createError =
        "No viable relay path is available. Run relay checks, authenticate required relays, or update the selected relay list."
      showWarning("Resolve relay viability issues before creating the group.")

      return
    }

    if (hasCreateRelayAuthBlocker()) {
      const counts = getRelayCheckCounts(createRelayChecks)
      const missingCredentials = summarizeMissingRelayCredentials({
        checks: createRelayChecks,
        authConfirmed: getRelayAuthConfirmedMap({sessions: createRelayAuthSessions}),
        hasSigner: Boolean($signer?.sign),
      })

      trackGroupTelemetry("group_setup_blocked_by_relay_requirements", {
        flow: "create",
        block_reason: "auth-required",
        relay_count: createSelectedRelays.length,
        ready_count: counts.readyCount,
        auth_required_count: counts.authRequiredCount,
        unreachable_count: counts.unreachableCount,
        not_advertised_count: counts.notAdvertisedCount,
        no_groups_count: counts.notAdvertisedCount,
        missing_signer_count: missingCredentials.missingSignerRelays.length,
        unknown_auth_method_count: missingCredentials.unknownMethodRelays.length,
        result: "error",
      })

      if (missingCredentials.missingSignerRelays.length > 0) {
        createError =
          "At least one relay requires challenge/response authentication, but no signer is available. Unlock a signer, then retry."
      } else if (missingCredentials.unknownMethodRelays.length > 0) {
        createError =
          "At least one relay requires a relay-specific authentication method that is not advertised. Provide relay credentials or switch relays."
      } else {
        createError =
          "At least one relay requires challenge/response authentication. Authenticate required relays, then retry."
      }
      showWarning("Authenticate required relays before creating the group.")

      return
    }

    const createTarget = getCreateGroupAddressResult({
      relayHost: createRelayHost,
      roomName: createRoomName,
      manualAddress: createGroupIdOverride,
    })

    if (!createTarget.ok) {
      createError = createTarget.message
      showWarning(createTarget.message)

      return
    }

    createError = ""
    trackGroupTelemetry("group_setup_create_attempt", {
      privacy: createPrivacy,
      relayHost: createRelayHost,
      relayCount: createSelectedRelays.length,
      hasManualAddress: Boolean(createGroupIdOverride.trim()),
      requested_transport_mode: createRequestedTransport.requestedMode,
      transport_mode_source: createRequestedTransport.source,
      mode: "guided",
      entry_point: groupId ? "invite_prefill" : "groups_create",
    })

    pendingCreate = true

    try {
      const result = await publishGroupCreateWithRecovery(
        {
          groupId: createTarget.canonicalId,
          title: createTitle || undefined,
          description: createDescription || undefined,
        },
        "admin",
        1,
        {requestedMode: createRequestedTransport.requestedMode},
      )

      const message = getGroupCreateRecoveryMessage(result)

      if (result.ok) {
        setupCompleted = true
        trackGroupTelemetry("group_setup_create_result", {
          result: "success",
          privacy: createPrivacy,
          mode: "guided",
        })
        trackGroupTelemetry("group_setup_completed", {
          mode: "guided",
          entry_point: groupId ? "invite_prefill" : "groups_create",
          elapsed_ms: setupStartedAt > 0 ? Date.now() - setupStartedAt : 0,
          result: "success",
        })
        showInfo(message)
        router.at(`groups/${encodeURIComponent(createTarget.canonicalId)}/chat`).push()
      } else {
        trackGroupTelemetry("group_setup_create_result", {
          result: "warning",
          privacy: createPrivacy,
          mode: "guided",
        })
        createError = `${message} You can retry now or review relay details.`
        showWarning(message)
      }
    } catch (error) {
      trackGroupTelemetry("group_setup_create_result", {
        result: "error",
        privacy: createPrivacy,
        mode: "guided",
      })
      createError = "Group create failed. Check relay details and retry."
      showWarning("Group create failed. Please retry.")
    } finally {
      pendingCreate = false
    }
  }

  const onJoin = async () => {
    if (hasJoinRelayViabilityBlocker()) {
      const counts = getRelayCheckCounts(joinRelayChecks)

      trackGroupTelemetry("group_setup_blocked_by_relay_requirements", {
        flow: "join",
        block_reason: "viability",
        relay_count: joinSelectedRelays.length,
        ready_count: counts.readyCount,
        auth_required_count: counts.authRequiredCount,
        unreachable_count: counts.unreachableCount,
        not_advertised_count: counts.notAdvertisedCount,
        no_groups_count: counts.notAdvertisedCount,
        result: "error",
      })
      joinError =
        "No viable relay path is available. Run relay checks, authenticate required relays, or update the selected relay list."
      showWarning("Resolve relay viability issues before joining.")

      return
    }

    if (hasJoinRelayAuthBlocker()) {
      const counts = getRelayCheckCounts(joinRelayChecks)
      const missingCredentials = summarizeMissingRelayCredentials({
        checks: joinRelayChecks,
        authConfirmed: getRelayAuthConfirmedMap({sessions: joinRelayAuthSessions}),
        hasSigner: Boolean($signer?.sign),
      })

      trackGroupTelemetry("group_setup_blocked_by_relay_requirements", {
        flow: "join",
        block_reason: "auth-required",
        relay_count: joinSelectedRelays.length,
        ready_count: counts.readyCount,
        auth_required_count: counts.authRequiredCount,
        unreachable_count: counts.unreachableCount,
        not_advertised_count: counts.notAdvertisedCount,
        no_groups_count: counts.notAdvertisedCount,
        missing_signer_count: missingCredentials.missingSignerRelays.length,
        unknown_auth_method_count: missingCredentials.unknownMethodRelays.length,
        result: "error",
      })

      if (missingCredentials.missingSignerRelays.length > 0) {
        joinError =
          "At least one relay requires challenge/response authentication, but no signer is available. Unlock a signer, then retry."
      } else if (missingCredentials.unknownMethodRelays.length > 0) {
        joinError =
          "At least one relay requires a relay-specific authentication method that is not advertised. Provide relay credentials or switch relays."
      } else {
        joinError =
          "At least one relay requires challenge/response authentication. Authenticate required relays, then retry."
      }
      showWarning("Authenticate required relays before joining.")

      return
    }

    const parsed = parseGroupAddressResult(joinGroupAddress)

    if (!parsed.ok) {
      joinError = "Provide a valid group address from an invite to continue."
      showWarning("Provide a valid group address to join.")

      return
    }

    joinError = ""
    trackGroupTelemetry("group_join_started", {
      mode: "guided",
      entry_point: groupId ? "invite_prefill" : "manual_address",
    })
    trackGroupTelemetry("group_setup_join_attempt", {
      hasPrefill: Boolean(groupId),
      requested_transport_mode: joinRequestedTransport.requestedMode,
      transport_mode_source: joinRequestedTransport.source,
      mode: "guided",
    })
    trackGroupTelemetry("group_join_submitted", {
      mode: "guided",
      entry_point: groupId ? "invite" : "manual_address",
    })

    joinSubmittedAt = Date.now()

    pendingJoin = true

    try {
      await publishGroupJoin({groupId: parsed.value.canonicalId}, "member", {
        requestedMode: joinRequestedTransport.requestedMode,
      })
      setupCompleted = true
      trackGroupTelemetry("group_setup_join_result", {result: "success"})
      trackGroupTelemetry("group_setup_completed", {
        mode: "guided",
        entry_point: groupId ? "invite_prefill" : "manual_address",
        elapsed_ms: setupStartedAt > 0 ? Date.now() - setupStartedAt : 0,
        result: "success",
      })
      trackGroupTelemetry("group_join_active_detected", {
        entry_point: groupId ? "invite" : "manual_address",
        time_since_join_submit_ms: joinSubmittedAt > 0 ? Date.now() - joinSubmittedAt : 0,
      })
      showInfo("Join request submitted.")
      router.at(`groups/${encodeURIComponent(parsed.value.canonicalId)}/chat`).push()
    } catch (error) {
      trackGroupTelemetry("group_setup_join_result", {result: "error"})
      joinError =
        "Unable to submit join request. Confirm the address and relay reachability, then retry."
      showWarning("Unable to submit join request.")
    } finally {
      pendingJoin = false
    }
  }

  onMount(() => {
    const requestedFlow = new URLSearchParams(window.location.search).get("flow")

    if (!groupId && requestedFlow === "join") {
      flow = "join"
    }

    if (setupStarted) return

    setupStarted = true
    setupStartedAt = Date.now()

    trackGroupTelemetry("group_setup_started", {
      mode: "guided",
      entry_point: groupId ? "invite_prefill" : "groups_create",
      room_context_present: false,
    })

    if (groupId) {
      trackGroupTelemetry("group_join_started", {
        mode: "guided",
        entry_point: "invite",
      })
    }
  })

  onDestroy(() => {
    if (!setupStarted || setupCompleted) return

    trackGroupTelemetry("group_setup_abandoned", {
      mode: "guided",
      entry_point: groupId ? "invite_prefill" : "groups_create",
      last_step: flow,
      elapsed_ms: setupStartedAt > 0 ? Date.now() - setupStartedAt : 0,
      result: "abandon",
    })
  })

  $: document.title = flow === "join" ? "Join Group" : "Create Group"
  $: breadcrumbSection =
    flow === "join"
      ? ("join-room" as GroupBreadcrumbSection)
      : ("create-room" as GroupBreadcrumbSection)
  $: breadcrumbs = buildGroupBreadcrumbItems({section: breadcrumbSection})
</script>

<div class="panel p-4">
  <GroupBreadcrumbs items={breadcrumbs} />
  <div class="flex items-center gap-2">
    <i class="fa fa-route text-accent" />
    <h2 class="text-lg uppercase tracking-[0.08em]">Create or Join Group</h2>
  </div>
  <p class="mt-3 text-neutral-300">Choose your path. You can switch anytime.</p>

  <div class="mt-4 grid gap-3 sm:grid-cols-2">
    <button
      class="btn"
      class:btn-accent={flow === "create"}
      type="button"
      on:click={() => goToFlow("create")}>
      <i class="fa-solid fa-plus" /> Create a group
    </button>
    <button
      class="btn"
      class:btn-accent={flow === "join"}
      type="button"
      on:click={() => goToFlow("join")}>
      <i class="fa-solid fa-right-to-bracket" /> Join from invite
    </button>
  </div>
</div>

{#if flow === "create"}
  <div class="panel p-4">
    <div class="flex items-center gap-2">
      <i class="fa fa-plus-circle text-accent" />
      <h2 class="text-lg uppercase tracking-[0.08em]">Create Group</h2>
    </div>

    <div class="mt-3 grid gap-2 sm:grid-cols-2">
      <div class="rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300 sm:col-span-2">
        <div class="mb-2 font-semibold text-neutral-100">Group details</div>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-sm font-semibold text-neutral-100" for="room-name">
              Group Name
            </label>
            <Input id="room-name" placeholder="e.g. ops" bind:value={createRoomName} />
          </div>
          <div>
            <label class="mb-1 block text-sm font-semibold text-neutral-100" for="room-title">
              Group Title <span class="italic text-neutral-400">(optional)</span>
            </label>
            <Input id="room-title" placeholder="Group title" bind:value={createTitle} />
          </div>
          <div>
            <label
              class="mb-1 block text-sm font-semibold text-neutral-100"
              for="room-description">
              Group Description <span class="italic text-neutral-400">(optional)</span>
            </label>
            <Input
              id="room-description"
              placeholder="Group description"
              bind:value={createDescription} />
          </div>
          <details class="rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
            <summary class="cursor-pointer">Advanced: override group address manually</summary>
            <div class="mt-2">
              <Input
                placeholder="Group address (e.g. relay.example'ops)"
                bind:value={createGroupIdOverride} />
              <p class="mt-2 text-xs text-neutral-400">
                Use this only when you need a specific canonical address (for migration,
                compatibility, or pre-agreed naming). Otherwise Group Name-derived address is
                preferred.
              </p>
            </div>
          </details>
          {#if createRoomWarnings.length > 0}
            <div class="space-y-2">
              {#each createRoomWarnings as warning, i (`create-room-warning-${i}`)}
                <div class="rounded border border-neutral-700 px-3 py-2 text-neutral-300">
                  {warning}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
      <div class="sm:col-span-2">
        <label class="mb-1 block text-sm font-semibold text-neutral-100" for="relay-preset">
          Relay preset
        </label>
        <select
          id="relay-preset"
          class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
          bind:value={createRelayPreset}
          on:change={() => applyRelayPreset(createRelayPreset)}>
          {#each GUIDED_RELAY_PRESET_OPTIONS as option}
            <option value={option.id}>{option.label}</option>
          {/each}
        </select>
        <div class="mt-1 text-xs text-neutral-400">
          {GUIDED_RELAY_PRESET_OPTIONS.find(option => option.id === createRelayPreset)?.description}
        </div>
      </div>
      <div class="sm:col-span-2">
        <label class="mb-1 block text-sm font-semibold text-neutral-100" for="selected-relays">
          Selected relays
        </label>
        <textarea
          id="selected-relays"
          class="min-h-24 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
          placeholder="One relay per line (e.g. wss://relay.example)"
          bind:value={createSelectedRelaysText} />
        <div class="mt-1 text-xs text-neutral-400">
          Primary relay host for group address: <strong
            >{createRelayHost || preferredRelayHost}</strong>
        </div>
        {#if createSelectedRelays.length > 1}
          <div class="mt-1 text-xs text-neutral-400">
            Primary relay host is derived from the first selected relay address.
          </div>
        {/if}
        <div class="mt-2 flex items-center gap-2">
          <button
            class="btn"
            type="button"
            on:click={runCreateRelayChecks}
            disabled={createRelayChecksRunning}>
            {createRelayChecksRunning ? "Checking relays…" : "Check relay capabilities"}
          </button>
          {#if createRelayChecksAt > 0}
            <span class="text-xs text-neutral-400"
              >Checked at {new Date(createRelayChecksAt).toLocaleTimeString()}</span>
          {/if}
        </div>
        {#if createRelayChecks.length > 0}
          <div class="mt-2 space-y-2 rounded border border-neutral-700 px-3 py-2">
            {#each createRelayChecks as check (`create-check-${check.relay}`)}
              <div class="rounded border border-neutral-700 px-2 py-2 text-xs text-neutral-300">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-semibold text-neutral-100">{check.relay}</span>
                  <span
                    class={`rounded border px-2 py-0.5 ${getRelayStatusBadgeClass(check.status)}`}
                    >{check.status}</span>
                  {#if getRelayAuthMethodIndicator(check).needsCredential}
                    <span
                      class={`rounded border px-2 py-0.5 ${getRelayAuthMethodBadgeClass(getRelayAuthMethodIndicator(check).tone)}`}
                      >{getRelayAuthMethodIndicator(check).label}</span>
                  {/if}
                  {#if check.status === "auth-required"}
                    {@const session = getCreateRelaySession(check.relay)}
                    <span
                      class={`rounded border px-2 py-0.5 ${getRelayAuthStatusClass(session.status)}`}
                      >{getRelayAuthStatusLabel(session.status)}</span>
                  {/if}
                </div>
                <div class="mt-1 text-neutral-400">{check.details}</div>
                <div class="mt-2 rounded border border-neutral-700 px-2 py-2 text-[11px]">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-neutral-500">Confidence</span>
                    <span
                      class={`rounded border px-2 py-0.5 ${getRelayConfidenceClass(check)}`}
                      >{getRelayConfidenceLabel(check)}</span>
                  </div>
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <span class="text-neutral-500">Runtime proof</span>
                    <span
                      class={`rounded border px-2 py-0.5 ${getRuntimeProofClass(getRelayRuntimeProof(check, isCreateRelayConfirmed(check.relay)).tone)}`}
                      >{getRelayRuntimeProof(check, isCreateRelayConfirmed(check.relay)).label}</span>
                  </div>
                  <div class="mt-1 text-neutral-400">
                    {getRelayRuntimeProof(check, isCreateRelayConfirmed(check.relay)).detail}
                  </div>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-1">
                  <span class="text-[10px] uppercase tracking-[0.08em] text-neutral-500"
                    >Capabilities</span>
                  <span
                    class={`rounded border px-2 py-0.5 ${getCapabilitySignalClass(check.supportsNip29)}`}
                    >NIP-29 {getCapabilitySignalLabel(check.supportsNip29)}</span>
                  <span
                    class={`rounded border px-2 py-0.5 ${getCapabilitySignalClass(check.supportsNip42)}`}
                    >NIP-42 {getCapabilitySignalLabel(check.supportsNip42)}</span>
                  <span
                    class={`rounded border px-2 py-0.5 ${getCapabilitySignalClass(check.supportsNip104)}`}
                    >NIP-104 {getCapabilitySignalLabel(check.supportsNip104)}</span>
                  <span
                    class={`rounded border px-2 py-0.5 ${getCapabilitySignalClass(check.supportsNipEeSignal)}`}
                    >NIP-EE signal {getCapabilitySignalLabel(check.supportsNipEeSignal)}</span>
                  <span
                    class={`rounded border px-2 py-0.5 ${getCapabilitySignalClass(check.supportsNavcomBaseline)}`}
                    >Navcom baseline {getCapabilitySignalLabel(check.supportsNavcomBaseline)}</span>
                  {#if check.isNavcomDefaultRelay}
                    <span class="rounded border border-accent px-2 py-0.5 text-accent"
                      >Default Navcom relay</span>
                  {/if}
                </div>
                {#if check.status === "auth-required" && !isCreateRelayConfirmed(check.relay)}
                  <div class="mt-2">
                    <button
                      class="btn"
                      type="button"
                      on:click={() => confirmCreateRelayAuth(check.relay)}
                      disabled={Boolean(createRelayAuthPending[check.relay])}>
                      {createRelayAuthPending[check.relay]
                        ? "Authenticating…"
                        : "Authenticate relay (challenge/response)"}
                    </button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
        {#if createMissingCredentialWarnings.length > 0}
          <div class="mt-2 space-y-2 rounded border border-warning px-3 py-2 text-xs text-warning">
            {#each createMissingCredentialWarnings as warning, i (`create-credential-warning-${i}`)}
              <div>{warning}</div>
            {/each}
          </div>
        {/if}
        {#if createRelayWarnings.length > 0}
          <div class="mt-2 space-y-2">
            {#each createRelayWarnings as warning, i (`create-relay-warning-${i}`)}
              <div class="rounded border border-neutral-700 px-3 py-2 text-neutral-300">
                {warning}
              </div>
            {/each}
          </div>
        {/if}
      </div>
      <div
        class="rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300 sm:col-span-2">
        <div class="mb-2 font-semibold text-neutral-100">Security Mode</div>
        <p class="mb-2 text-xs text-neutral-400">
          Choose a mode by requested transport behavior.
        </p>
        <select
          class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
          bind:value={createPrivacy}>
          <option value="auto">Auto (Compatibility First)</option>
          <option value="basic">Basic (Open Group)</option>
          <option value="secure">Secure (Common Encryption)</option>
          <option value="max">Max (Post Quantum Cryptography)</option>
        </select>
        <div class="mt-2 rounded border border-neutral-700 px-3 py-2 text-xs text-neutral-400">
          Compatibility mode means <strong>baseline-nip29</strong> transport with broad relay/device
          interoperability priority. In current create/join implementation: Auto and Basic request
          baseline transport, while Secure and Max request secure transport first.
        </div>
        <div class="mt-2 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
          <div class="font-semibold text-neutral-100">{securityStatus.badge}</div>
          <div class="mt-1 text-neutral-400">{securityStatus.hint}</div>
        </div>
      </div>
    </div>

    {#if createGroupId}
      <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
        Group address preview: <strong>{createGroupId}</strong>
      </div>
    {/if}

    {#if createAccessPackageText}
      <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
        <div class="mb-2 font-semibold text-neutral-100">Share Access Package</div>
        <p class="mb-2 text-xs text-neutral-400">
          Includes group address, relay list, relay auth requirements, and security/fallback
          expectations.
        </p>
        <textarea
          class="min-h-40 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-100"
          readonly
          value={createAccessPackageText} />
        <div class="mt-2 flex justify-end">
          <button class="btn" type="button" on:click={onCopyCreateAccessPackage}>
            Copy access package
          </button>
        </div>
      </div>
    {/if}

    {#if createError}
      <div class="mt-3 rounded border border-warning px-3 py-2 text-sm text-warning">
        {createError}
      </div>
    {/if}

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
{/if}

{#if flow === "join"}
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

    <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
      <div class="mb-1 font-semibold text-neutral-100">Join relays</div>
      <textarea
        class="min-h-20 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
        placeholder="One relay per line (invite relay will prefill when available)"
        bind:value={joinSelectedRelaysText} />
      <div class="mt-2 flex items-center gap-2">
        <button
          class="btn"
          type="button"
          on:click={runJoinRelayChecks}
          disabled={joinRelayChecksRunning}>
          {joinRelayChecksRunning ? "Checking relays…" : "Check relay capabilities"}
        </button>
        {#if joinRelayChecksAt > 0}
          <span class="text-xs text-neutral-400"
            >Checked at {new Date(joinRelayChecksAt).toLocaleTimeString()}</span>
        {/if}
      </div>
      {#if joinRelayChecks.length > 0}
        <div class="mt-2 space-y-2">
          {#each joinRelayChecks as check (`join-check-${check.relay}`)}
            <div class="rounded border border-neutral-700 px-2 py-2 text-xs text-neutral-300">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-neutral-100">{check.relay}</span>
                <span class={`rounded border px-2 py-0.5 ${getRelayStatusBadgeClass(check.status)}`}
                  >{check.status}</span>
                {#if getRelayAuthMethodIndicator(check).needsCredential}
                  <span
                    class={`rounded border px-2 py-0.5 ${getRelayAuthMethodBadgeClass(getRelayAuthMethodIndicator(check).tone)}`}
                    >{getRelayAuthMethodIndicator(check).label}</span>
                {/if}
                {#if check.status === "auth-required"}
                  {@const session = getJoinRelaySession(check.relay)}
                  <span
                    class={`rounded border px-2 py-0.5 ${getRelayAuthStatusClass(session.status)}`}
                    >{getRelayAuthStatusLabel(session.status)}</span>
                {/if}
              </div>
              <div class="mt-1 text-neutral-400">{check.details}</div>
              <div class="mt-2 rounded border border-neutral-700 px-2 py-2 text-[11px]">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-neutral-500">Confidence</span>
                  <span class={`rounded border px-2 py-0.5 ${getRelayConfidenceClass(check)}`}
                    >{getRelayConfidenceLabel(check)}</span>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span class="text-neutral-500">Runtime proof</span>
                  <span
                    class={`rounded border px-2 py-0.5 ${getRuntimeProofClass(getRelayRuntimeProof(check, isJoinRelayConfirmed(check.relay)).tone)}`}
                    >{getRelayRuntimeProof(check, isJoinRelayConfirmed(check.relay)).label}</span>
                </div>
                <div class="mt-1 text-neutral-400">
                  {getRelayRuntimeProof(check, isJoinRelayConfirmed(check.relay)).detail}
                </div>
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-1">
                <span class="text-[10px] uppercase tracking-[0.08em] text-neutral-500"
                  >Capabilities</span>
                <span
                  class={`rounded border px-2 py-0.5 ${getCapabilitySignalClass(check.supportsNip29)}`}
                  >NIP-29 {getCapabilitySignalLabel(check.supportsNip29)}</span>
                <span
                  class={`rounded border px-2 py-0.5 ${getCapabilitySignalClass(check.supportsNip42)}`}
                  >NIP-42 {getCapabilitySignalLabel(check.supportsNip42)}</span>
                <span
                  class={`rounded border px-2 py-0.5 ${getCapabilitySignalClass(check.supportsNip104)}`}
                  >NIP-104 {getCapabilitySignalLabel(check.supportsNip104)}</span>
                <span
                  class={`rounded border px-2 py-0.5 ${getCapabilitySignalClass(check.supportsNipEeSignal)}`}
                  >NIP-EE signal {getCapabilitySignalLabel(check.supportsNipEeSignal)}</span>
                <span
                  class={`rounded border px-2 py-0.5 ${getCapabilitySignalClass(check.supportsNavcomBaseline)}`}
                  >Navcom baseline {getCapabilitySignalLabel(check.supportsNavcomBaseline)}</span>
                {#if check.isNavcomDefaultRelay}
                  <span class="rounded border border-accent px-2 py-0.5 text-accent"
                    >Default Navcom relay</span>
                {/if}
              </div>
              {#if check.status === "auth-required" && !isJoinRelayConfirmed(check.relay)}
                <div class="mt-2">
                  <button
                    class="btn"
                    type="button"
                    on:click={() => confirmJoinRelayAuth(check.relay)}
                    disabled={Boolean(joinRelayAuthPending[check.relay])}>
                    {joinRelayAuthPending[check.relay]
                      ? "Authenticating…"
                      : "Authenticate relay (challenge/response)"}
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
      {#if joinMissingCredentialWarnings.length > 0}
        <div class="mt-2 space-y-2 rounded border border-warning px-3 py-2 text-xs text-warning">
          {#each joinMissingCredentialWarnings as warning, i (`join-credential-warning-${i}`)}
            <div>{warning}</div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="mt-3 rounded border border-neutral-700 px-3 py-2 text-sm text-neutral-300">
      <div class="mb-1 font-semibold text-neutral-100">Receiver Setup Checklist</div>
      <p class="mb-2 text-xs text-neutral-400">
        Complete each item before joining to avoid relay/auth failures.
      </p>
      <div class="space-y-2">
        {#each joinSetupChecklist.items as item (`join-checklist-${item.id}`)}
          <div class="flex items-center gap-2">
            <span class={`rounded border px-2 py-0.5 text-xs ${getChecklistStatusClass(item.done)}`}
              >{item.done ? "done" : "required"}</span>
            <span class="text-xs text-neutral-200">{item.label}</span>
          </div>
        {/each}
      </div>
      {#if joinSetupChecklist.blockingReasons.length > 0}
        <div class="mt-2 space-y-1 rounded border border-warning px-3 py-2 text-xs text-warning">
          {#each joinSetupChecklist.blockingReasons as reason, i (`join-blocking-${i}`)}
            <div>{reason}</div>
          {/each}
        </div>
      {/if}
    </div>

    {#if joinInviteHints.length > 0}
      <div class="mt-3 space-y-2 text-sm text-neutral-300">
        {#each joinInviteHints as hint, i (`invite-hint-${i}`)}
          <div class="rounded border border-neutral-700 px-3 py-2">{hint}</div>
        {/each}
      </div>
    {/if}

    {#if joinError}
      <div class="mt-3 rounded border border-warning px-3 py-2 text-sm text-warning">
        {joinError}
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
{/if}
