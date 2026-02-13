import {describe, expect, it} from "vitest"
import {
  createSecureGroupStateMemoryStore,
  decryptSecureGroupState,
  encryptSecureGroupState,
  migrateLegacyPlaintextSecureGroupState,
  readEncryptedSecureGroupState,
  writeEncryptedSecureGroupState,
} from "../../../src/engine/group-secure-storage"
import {
  verifySecureGroupStateWipe,
  wipeSecureGroupState,
} from "../../../src/engine/group-secure-storage-wipe"

describe("engine/group-secure-storage", () => {
  it("encrypts secure group state using versioned schema and decrypts round-trip", async () => {
    const record = await encryptSecureGroupState({
      accountId: "acct-1",
      groupId: "ops",
      encryptionRoot: "root-secret",
      state: {cursor: 10, members: ["a"]},
      now: 100,
    })

    expect(record.id).toBe("secure-group-state:acct-1:ops")
    expect(record.envelope.version).toBe(1)
    expect(record.envelope.algorithm).toBe("AES-GCM-256")
    expect(record.envelope.keyContext).toBe("secure-group:acct-1:ops")

    const decrypted = await decryptSecureGroupState<{cursor: number; members: string[]}>({
      record,
      encryptionRoot: "root-secret",
    })

    expect(decrypted).toEqual({cursor: 10, members: ["a"]})
  })

  it("writes and reads encrypted secure group state through storage path", async () => {
    const store = createSecureGroupStateMemoryStore()

    await writeEncryptedSecureGroupState(store, {
      accountId: "acct-1",
      groupId: "intel",
      encryptionRoot: "root-secret",
      state: {cursor: 20, rosterCount: 4},
      now: 200,
    })

    const read = await readEncryptedSecureGroupState<{cursor: number; rosterCount: number}>(store, {
      accountId: "acct-1",
      groupId: "intel",
      encryptionRoot: "root-secret",
    })

    expect(read).toEqual({cursor: 20, rosterCount: 4})
  })

  it("migrates legacy plaintext cache to encrypted records", async () => {
    const records = await migrateLegacyPlaintextSecureGroupState({
      accountId: "acct-1",
      encryptionRoot: "root-secret",
      legacyByGroupId: {
        ops: {cursor: 1},
        intel: {cursor: 2},
      },
      now: 300,
    })

    expect(records).toHaveLength(2)
    expect(records.map(record => record.groupId).sort()).toEqual(["intel", "ops"])

    const ops = records.find(record => record.groupId === "ops")
    const intel = records.find(record => record.groupId === "intel")

    const decryptedOps = await decryptSecureGroupState<{cursor: number}>({
      record: ops!,
      encryptionRoot: "root-secret",
    })

    const decryptedIntel = await decryptSecureGroupState<{cursor: number}>({
      record: intel!,
      encryptionRoot: "root-secret",
    })

    expect(decryptedOps).toEqual({cursor: 1})
    expect(decryptedIntel).toEqual({cursor: 2})
  })

  it("supports scoped group wipe with verification", async () => {
    const store = createSecureGroupStateMemoryStore()

    await writeEncryptedSecureGroupState(store, {
      accountId: "acct-2",
      groupId: "ops",
      encryptionRoot: "root-secret",
      state: {cursor: 1},
      now: 400,
    })

    await writeEncryptedSecureGroupState(store, {
      accountId: "acct-2",
      groupId: "intel",
      encryptionRoot: "root-secret",
      state: {cursor: 2},
      now: 401,
    })

    const result = await wipeSecureGroupState(store, {
      accountId: "acct-2",
      groupId: "ops",
    })

    expect(result.ok).toBe(true)
    expect(result.wipedCount).toBe(1)
    expect(result.verified).toBe(true)

    const ops = await readEncryptedSecureGroupState<{cursor: number}>(store, {
      accountId: "acct-2",
      groupId: "ops",
      encryptionRoot: "root-secret",
    })

    const intel = await readEncryptedSecureGroupState<{cursor: number}>(store, {
      accountId: "acct-2",
      groupId: "intel",
      encryptionRoot: "root-secret",
    })

    expect(ops).toBeNull()
    expect(intel).toEqual({cursor: 2})
  })

  it("supports account-scoped wipe and explicit verification checks", async () => {
    const store = createSecureGroupStateMemoryStore()

    await writeEncryptedSecureGroupState(store, {
      accountId: "acct-3",
      groupId: "ops",
      encryptionRoot: "root-secret",
      state: {cursor: 3},
      now: 500,
    })

    await writeEncryptedSecureGroupState(store, {
      accountId: "acct-3",
      groupId: "intel",
      encryptionRoot: "root-secret",
      state: {cursor: 4},
      now: 501,
    })

    const wipe = await wipeSecureGroupState(store, {
      accountId: "acct-3",
    })

    expect(wipe.ok).toBe(true)
    expect(wipe.wipedCount).toBe(2)

    const verification = await verifySecureGroupStateWipe(store, wipe.wipedIds)

    expect(verification).toEqual({
      verified: true,
      failures: [],
    })
  })
})
