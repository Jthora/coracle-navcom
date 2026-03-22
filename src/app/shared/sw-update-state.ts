import {writable} from "svelte/store"

export type SwUpdateState = {
  available: boolean
  updateSW: (() => Promise<void>) | null
  registrationError: boolean
  /** If true, this update is security-critical and cannot be dismissed */
  securityCritical: boolean
}

export const swUpdateState = writable<SwUpdateState>({
  available: false,
  updateSW: null,
  registrationError: false,
  securityCritical: false,
})
