import {describe, it, expect, beforeEach} from "vitest"
import {get} from "svelte/store"
import {
  onboardingState,
  resetOnboardingState,
  setOnboardingStage,
  setOnboardingPath,
  setBackupNeeded,
  confirmBackup,
  markOnboardingComplete,
  ensureCompletionIfKeyed,
  markFirstPostTracked,
  dismissManagedExportPrompt,
  syncOnboardingAccount,
} from "src/app/state/onboarding"

beforeEach(() => {
  localStorage.clear()
  resetOnboardingState()
})

describe("onboarding state", () => {
  it("starts with default values", () => {
    const state = get(onboardingState)
    expect(state.stage).toBe("start")
    expect(state.path).toBe("managed")
    expect(state.pending).toBe(true)
    expect(state.complete).toBe(false)
    expect(state.backupNeeded).toBe(false)
    expect(state.managedExportDismissed).toBe(false)
  })

  it("sets stage and path and keeps pending true until completion", () => {
    setOnboardingStage("profile")
    setOnboardingPath("import")
    const state = get(onboardingState)
    expect(state.stage).toBe("profile")
    expect(state.pending).toBe(true)
    expect(state.complete).toBe(false)
    expect(state.path).toBe("import")
  })

  it("marks completion with timestamp and resets managed export dismissal", () => {
    dismissManagedExportPrompt()
    markOnboardingComplete("managed", false)
    const state = get(onboardingState)
    expect(state.complete).toBe(true)
    expect(state.pending).toBe(false)
    expect(state.completionAt).not.toBeNull()
    expect(state.managedExportDismissed).toBe(false)
  })

  it("enables backup reminders and confirmation flow", () => {
    setBackupNeeded(true)
    expect(get(onboardingState).backupNeeded).toBe(true)
    confirmBackup()
    const state = get(onboardingState)
    expect(state.backupNeeded).toBe(false)
    expect(state.backupConfirmedAt).not.toBeNull()
  })

  it("auto-completes if keyed while at start", () => {
    ensureCompletionIfKeyed(true)
    const state = get(onboardingState)
    expect(state.complete).toBe(true)
    expect(state.stage).toBe("done")
  })

  it("marks first post tracked once", () => {
    markOnboardingComplete("managed", false)
    markFirstPostTracked()
    expect(get(onboardingState).firstPostTracked).toBe(true)
  })

  it("resets on account switch", () => {
    syncOnboardingAccount("npub1abc")
    setOnboardingStage("profile")
    syncOnboardingAccount("npub1xyz")
    const state = get(onboardingState)
    expect(state.stage).toBe("start")
    expect(state.lastAccount).toBe("npub1xyz")
    expect(state.complete).toBe(false)
  })
})
