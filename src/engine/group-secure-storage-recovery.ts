import {
  writeEncryptedSecureGroupState,
  type SecureGroupStateStore,
} from "src/engine/group-secure-storage"

export type SecureGroupStateCorruptionReason =
  | "MISSING_RECORD"
  | "SCHEMA_VERSION_MISMATCH"
  | "MISSING_ENVELOPE_FIELDS"
  | "DECRYPTION_FAILED"

export type DetectSecureGroupStateCorruptionInput = {
  record?: {
    envelope?: {
      version?: number
      algorithm?: string
      saltBase64?: string
      ivBase64?: string
      ciphertextBase64?: string
    }
  } | null
  decryptionError?: unknown
}

export type DetectSecureGroupStateCorruptionResult = {
  corrupted: boolean
  reason?: SecureGroupStateCorruptionReason
}

export type RehydrateSecureGroupStateFromRemoteInput = {
  store: SecureGroupStateStore
  accountId: string
  groupId: string
  encryptionRoot: string
  fetchTrustedRemoteState: () => Promise<unknown>
  now?: number
}

export type RehydrateSecureGroupStateFromRemoteResult =
  | {
      ok: true
      state: unknown
      source: "trusted-remote"
    }
  | {
      ok: false
      reason: "trusted-remote-unavailable"
    }

export const detectSecureGroupStateCorruption = ({
  record,
  decryptionError,
}: DetectSecureGroupStateCorruptionInput): DetectSecureGroupStateCorruptionResult => {
  if (!record) {
    return {corrupted: true, reason: "MISSING_RECORD"}
  }

  const envelope = record.envelope

  if (!envelope) {
    return {corrupted: true, reason: "MISSING_ENVELOPE_FIELDS"}
  }

  if (envelope.version !== 1) {
    return {corrupted: true, reason: "SCHEMA_VERSION_MISMATCH"}
  }

  if (!envelope.saltBase64 || !envelope.ivBase64 || !envelope.ciphertextBase64) {
    return {corrupted: true, reason: "MISSING_ENVELOPE_FIELDS"}
  }

  if (decryptionError) {
    return {corrupted: true, reason: "DECRYPTION_FAILED"}
  }

  return {corrupted: false}
}

export const rehydrateSecureGroupStateFromTrustedRemote = async ({
  store,
  accountId,
  groupId,
  encryptionRoot,
  fetchTrustedRemoteState,
  now,
}: RehydrateSecureGroupStateFromRemoteInput): Promise<RehydrateSecureGroupStateFromRemoteResult> => {
  const remote = await fetchTrustedRemoteState()

  if (!remote) {
    return {
      ok: false,
      reason: "trusted-remote-unavailable",
    }
  }

  await writeEncryptedSecureGroupState(store, {
    accountId,
    groupId,
    encryptionRoot,
    state: remote,
    now,
  })

  return {
    ok: true,
    state: remote,
    source: "trusted-remote",
  }
}

export const toSecureGroupRecoveryMessage = (
  input:
    | {ok: true; source: "trusted-remote"}
    | {ok: false; reason: "trusted-remote-unavailable"}
    | {corrupted: true; reason?: SecureGroupStateCorruptionReason}
    | {corrupted: false},
) => {
  if ("ok" in input) {
    if (input.ok) {
      return "Secure group state was recovered from trusted remote events."
    }

    return "Unable to recover secure group state from trusted remote events. Retry when relay connectivity improves."
  }

  if (!input.corrupted) {
    return "Secure group state is healthy."
  }

  if (input.reason === "SCHEMA_VERSION_MISMATCH") {
    return "Secure group state format is unsupported. Refresh the app to run latest migrations."
  }

  if (input.reason === "DECRYPTION_FAILED") {
    return "Secure group state could not be decrypted. Recovery from trusted remote events is required."
  }

  if (input.reason === "MISSING_ENVELOPE_FIELDS") {
    return "Secure group state is malformed and will be rehydrated from trusted remote events."
  }

  return "Secure group state is missing and will be rehydrated from trusted remote events."
}
