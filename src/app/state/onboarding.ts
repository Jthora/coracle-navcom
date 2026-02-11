import {get, writable} from "svelte/store"
import {synced, localStorageProvider} from "@welshman/store"

export type OnboardingStage = "start" | "key" | "profile" | "done"
export type OnboardingPath = "managed" | "import" | "external_signer" | null

export type OnboardingState = {
  stage: OnboardingStage
  path: OnboardingPath
  pending: boolean
  complete: boolean
  backupNeeded: boolean
  backupConfirmedAt: number | null
  lastAccount: string | null
  completionAt: number | null
  firstPostTracked: boolean
  managedExportDismissed: boolean
}

const defaultState: OnboardingState = {
  stage: "start",
  path: "managed",
  pending: true,
  complete: false,
  backupNeeded: false,
  backupConfirmedAt: null,
  lastAccount: null,
  completionAt: null,
  firstPostTracked: false,
  managedExportDismissed: false,
}

export const onboardingState = synced<OnboardingState>({
  key: "onboarding/state",
  defaultValue: defaultState,
  storage: localStorageProvider,
})

export const onboardingReturnTo = writable<string | null>(null)

const normalizeStage = (stage: OnboardingStage | string | undefined | null): OnboardingStage => {
  if (!stage) return "start"
  if (stage === "keys" || stage === "follows" || stage === "note" || stage === "intro")
    return "start"
  return ["start", "key", "profile", "done"].includes(stage as OnboardingStage)
    ? (stage as OnboardingStage)
    : "start"
}

export const resetOnboardingState = (stage: OnboardingStage = "start") =>
  onboardingState.set({...defaultState, stage})

export const syncOnboardingAccount = (currentPubkey: string | null) => {
  onboardingState.update(state => {
    if (!currentPubkey) return state

    if (state.lastAccount && state.lastAccount !== currentPubkey) {
      return {...defaultState, lastAccount: currentPubkey}
    }

    if (!state.lastAccount) {
      return {...state, lastAccount: currentPubkey}
    }

    return state
  })
}

export const setOnboardingStage = (stage: OnboardingStage) =>
  onboardingState.update(state => ({
    ...state,
    stage: normalizeStage(stage),
    pending: true,
    complete: false,
  }))

export const setOnboardingPath = (path: OnboardingPath) =>
  onboardingState.update(state => ({...state, path}))

export const setBackupNeeded = (needed: boolean) =>
  onboardingState.update(state => ({
    ...state,
    backupNeeded: needed,
    backupConfirmedAt: needed ? null : state.backupConfirmedAt,
  }))

export const confirmBackup = () =>
  onboardingState.update(state => ({...state, backupNeeded: false, backupConfirmedAt: Date.now()}))

export const markOnboardingComplete = (path: OnboardingPath, backupNeeded: boolean) =>
  onboardingState.update(state => ({
    ...state,
    stage: "done",
    path: path ?? state.path,
    pending: false,
    complete: true,
    backupNeeded,
    backupConfirmedAt: backupNeeded ? null : state.backupConfirmedAt,
    completionAt: Date.now(),
    firstPostTracked: false,
    managedExportDismissed: path === "managed" ? false : state.managedExportDismissed,
  }))

export const ensureCompletionIfKeyed = (hasKey: boolean) => {
  if (!hasKey) return

  const state = get(onboardingState)
  if (!state.complete && state.stage === "start") {
    markOnboardingComplete(state.path, state.backupNeeded)
  }
}

export const markFirstPostTracked = () =>
  onboardingState.update(state => ({...state, firstPostTracked: true}))

export const dismissManagedExportPrompt = () =>
  onboardingState.update(state => ({...state, managedExportDismissed: true}))
