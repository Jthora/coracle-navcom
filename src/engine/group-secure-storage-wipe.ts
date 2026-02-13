import type {SecureGroupStateStore} from "src/engine/group-secure-storage"

export type SecureGroupStateWipeScope = {
  accountId: string
  groupId?: string
}

export type SecureGroupStateWipeResult = {
  ok: boolean
  wipedCount: number
  wipedIds: string[]
  verified: boolean
  verificationFailures: string[]
}

const toRecordId = (accountId: string, groupId: string) =>
  `secure-group-state:${accountId}:${groupId}`

const resolveWipeIds = async (store: SecureGroupStateStore, scope: SecureGroupStateWipeScope) => {
  if (scope.groupId) {
    return [toRecordId(scope.accountId, scope.groupId)]
  }

  const records = await store.listByAccount(scope.accountId)

  return records.map(record => record.id)
}

export const verifySecureGroupStateWipe = async (
  store: SecureGroupStateStore,
  wipedIds: string[],
): Promise<{verified: boolean; failures: string[]}> => {
  const failures: string[] = []

  for (const id of wipedIds) {
    const record = await store.get(id)

    if (record) {
      failures.push(id)
    }
  }

  return {
    verified: failures.length === 0,
    failures,
  }
}

export const wipeSecureGroupState = async (
  store: SecureGroupStateStore,
  scope: SecureGroupStateWipeScope,
): Promise<SecureGroupStateWipeResult> => {
  const wipeIds = await resolveWipeIds(store, scope)

  for (const id of wipeIds) {
    await store.delete(id)
  }

  const verification = await verifySecureGroupStateWipe(store, wipeIds)

  return {
    ok: verification.verified,
    wipedCount: wipeIds.length,
    wipedIds: wipeIds,
    verified: verification.verified,
    verificationFailures: verification.failures,
  }
}
