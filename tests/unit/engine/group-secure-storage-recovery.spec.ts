import {describe, expect, it} from "vitest"
import {
  createSecureGroupStateMemoryStore,
  readEncryptedSecureGroupState,
} from "../../../src/engine/group-secure-storage"
import {
  detectSecureGroupStateCorruption,
  rehydrateSecureGroupStateFromTrustedRemote,
  toSecureGroupRecoveryMessage,
} from "../../../src/engine/group-secure-storage-recovery"

describe("engine/group-secure-storage-recovery", () => {
  it("detects corruption markers for missing, malformed, and decryption-failed records", () => {
    expect(detectSecureGroupStateCorruption({record: null})).toEqual({
      corrupted: true,
      reason: "MISSING_RECORD",
    })

    expect(
      detectSecureGroupStateCorruption({
        record: {envelope: {version: 2, algorithm: "AES-GCM-256"}},
      }),
    ).toEqual({
      corrupted: true,
      reason: "SCHEMA_VERSION_MISMATCH",
    })

    expect(
      detectSecureGroupStateCorruption({
        record: {
          envelope: {
            version: 1,
            algorithm: "AES-GCM-256",
            saltBase64: "a",
            ivBase64: "b",
            ciphertextBase64: "c",
          },
        },
        decryptionError: new Error("decrypt failed"),
      }),
    ).toEqual({
      corrupted: true,
      reason: "DECRYPTION_FAILED",
    })
  })

  it("rehydrates secure group state from trusted remote source", async () => {
    const store = createSecureGroupStateMemoryStore()

    const rehydrated = await rehydrateSecureGroupStateFromTrustedRemote({
      store,
      accountId: "acct-4",
      groupId: "ops",
      encryptionRoot: "root-secret",
      now: 600,
      fetchTrustedRemoteState: async () => ({cursor: 33, sync: "remote"}),
    })

    expect(rehydrated).toMatchObject({
      ok: true,
      source: "trusted-remote",
    })

    const read = await readEncryptedSecureGroupState<{cursor: number; sync: string}>(store, {
      accountId: "acct-4",
      groupId: "ops",
      encryptionRoot: "root-secret",
    })

    expect(read).toEqual({cursor: 33, sync: "remote"})
  })

  it("returns actionable recovery messaging", () => {
    expect(toSecureGroupRecoveryMessage({corrupted: true, reason: "MISSING_RECORD"})).toContain(
      "rehydrated",
    )
    expect(
      toSecureGroupRecoveryMessage({
        ok: false,
        reason: "trusted-remote-unavailable",
      }),
    ).toContain("Unable to recover")
    expect(toSecureGroupRecoveryMessage({ok: true, source: "trusted-remote"})).toContain(
      "recovered",
    )
  })
})
